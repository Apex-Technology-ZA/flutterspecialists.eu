---
title: Offline‑First Flutter Architecture and Sync: Design, Conflicts, and Guarantees
description: A deep guide to designing offline‑first Flutter apps with robust sync, conflict resolution, and testable guarantees.
date: 2025-03-14
tags: ["architecture", "offline", "sync", "flutter", "data", "consistency"]
heroImage: "/og-default.svg"
draft: false
---

Why offline‑first?
- Modern users expect apps to work on flaky networks, in airplane mode, and in low‑signal areas.
- Offline‑first isn’t just caching; it’s a deliberate data model, write semantics, and conflict strategy.
- Getting it right reduces support load, increases retention, and simplifies UX: users never see “can’t save”.

This guide provides a comprehensive blueprint for offline‑first Flutter apps, with patterns for storage, sync, conflicts, background jobs, and testing.

Contents
- Principles and guarantees
- Data model and identifiers
- Local storage and change log
- Write semantics: queueing, retries, backoff
- Sync strategies (pull/push/merge)
- Conflict resolution patterns
- Background syncing and lifecycle
- UX patterns for trust and clarity
- Observability, metrics, and alerting
- Testing and failure injection
- Reference implementation outline

Principles and guarantees
- Availability first: operations succeed locally, even when offline.
- Convergence: replicas eventually reach a consistent state under no further updates.
- Idempotence: re‑applying the same operation yields the same state; critical for retries.
- Causal ordering (where needed): maintain relative order within an entity/stream.
- Bounded staleness: define acceptable windows for how stale UI can be.

Guarantee matrix (what you can promise)
- Local durability: once the user sees “Saved”, the mutation exists in the local log (fsync’ed).
- Eventual server persistence: queued writes are retried with exponential backoff until success or manual intervention.
- Deterministic conflict policy: given concurrent edits, the outcome is predictable, documented, and test‑covered.

Data model and identifiers
- Use client‑generated, globally unique IDs (UUID v4 or KSUID) for new entities.
- Prefer immutable event stream (append‑only change log) over in‑place mutation for local writes; apply reducers to compute current state.
- Store server ETags/versions per entity to support optimistic concurrency.

Entity shape (example)
```json
{
  "id": "ksuid_29JYBqz9G3S6po1hy...",
  "type": "Note",
  "title": "Grocery list",
  "body": "Milk, eggs, butter",
  "updatedAt": "2025-03-14T09:12:00Z",
  "version": "W/\"etag-server-v15\"",
  "local": {
    "pending": false,
    "dirtyFields": ["body"],
    "lastSyncAt": "2025-03-14T09:15:00Z"
  }
}
```

Local storage and change log
- Chosen stores:
  - drift (SQLite) for relational/stateful queries and constraints
  - isar/hive for pure KV or document workloads
- Tables:
  - entities (current materialized state)
  - changes (append‑only operations: create/update/delete, payload, timestamp, dependency)
  - sync_state (cursors for pull, last_success, backoff state)
- Keep indexes on entity id, updatedAt, and dirty flags for efficient queries.

Write semantics: queueing, retries, backoff
- Local flow:
  1) Validate input in domain layer.
  2) Begin transaction:
     - Append change to `changes`
     - Apply change to `entities` materialized view
  3) Mark entity `local.pending=true` and capture `dirtyFields`.
  4) Enqueue a background job to push.
- Retries:
  - Exponential backoff with jitter (e.g., 1s, 2s, 4s, 8s, cap at 5m) on transient errors.
  - Immediate retry on network regain.
- Idempotence:
  - Include clientChangeId in payload; server stores last applied id per entity to de‑duplicate.

Sync strategies
- Pull (read):
  - Incremental with server cursor (updatedSince watermark or opaque cursor).
  - On first run: full sync per collection, then incremental.
  - Merge strategy avoids clobbering local unsynced changes; consider three‑way merges on fields.
- Push (write):
  - Order by dependency (create before update; parent before child when needed).
  - Batch small operations to reduce overhead but keep batches small enough for rollback handling.
  - On 409 Conflict / 412 Precondition Failed, trigger conflict resolution.

Conflict resolution patterns
- Last‑Writer‑Wins (LWW): compare server `updatedAt` vs. client `updatedAt`.
  - Pros: simple, deterministic; Cons: may clobber legitimate changes.
- Field‑level merge: merge only independent fields; conflicting fields use LWW or custom policies.
- Operational transforms (OT)/CRDT: for collaborative text or counters; higher complexity, powerful guarantees.
- Manual resolution: queue conflict items for user attention (notifications, “Resolve” screens).
- Recommendation:
  - Start with field‑level merge for independent fields, LWW fallback for conflicts, and manual surface for critical entities.

Example: optimistic concurrency with ETag
- Client sends `If-Match: W/"etag-server-v15"`.
- On mismatch (412), fetch server version, compute three‑way diff:
  - Base: last known server version
  - Local: user‑edited version
  - Remote: current server version
- Merge:
  - If fields disjoint → merge automatically.
  - Else if resolvable by policy → apply.
  - Else create a “conflict item” for manual resolution.

Background syncing and lifecycle
- Architecture:
  - Foreground sync manager (Dart) for active app.
  - Background fetch (platform): Android WorkManager; iOS BGAppRefreshTask/BGProcessingTask with limits.
- Triggers:
  - App start (deferred by a few seconds to avoid blocking UX)
  - Connectivity changes (network regained)
  - Significant time elapse (e.g., every 15–30 min)
  - Manual pull‑to‑refresh
- Guardrails:
  - Respect battery saver, unmetered networks options, and OS quotas.
  - Rate‑limit to avoid server overload; server should also enforce quotas.

UX patterns for trust and clarity
- Optimistic UI: reflect local changes immediately with subtle “Syncing…” status.
- Sync banners/toasts: “You’re offline. Changes will sync when connection resumes.”
- Conflict chips: indicate conflicts on list rows; tap → resolution screen.
- Disabled destructive actions when not possible safely (e.g., permanent delete without server ack).
- Visual status on settings: last sync time, queued ops count, error list (with resend).

Observability, metrics, and alerting
- Client metrics:
  - Queue length over time
  - Sync cycle duration and success rate
  - Conflict rate per collection/field
  - Retry histogram and backoff distribution
- Logging:
  - Redact PII; include change ids, entity ids, and error codes.
  - Sample to avoid volume spikes.
- Alert thresholds (analytics backend):
  - Conflict rate > X% → alert platform squad
  - Retry > N attempts → circuit‑break or escalate UI

Testing and failure injection
- Unit tests:
  - Reducers (applyChange), merge policy, clock‑controlled timestamping.
- Integration tests (widget + persistence):
  - End‑to‑end mutation flows with forced offline/online transitions.
- Failure injection:
  - Simulate 409/412/5xx, timeouts, and partial batch failures.
  - Use dependency injection to swap HTTP client and persistence.
- Property‑based tests:
  - Generate random interleavings of changes/pulls to verify convergence and invariants.

Reference implementation outline (pseudo)
```dart
// Domain change model
sealed class Change {
  final String id; // clientChangeId
  final String entityId;
  final DateTime at;
  const Change(this.id, this.entityId, this.at);
}
class UpdateFields extends Change {
  final Map<String, dynamic> patch;
  const UpdateFields(super.id, super.entityId, super.at, this.patch);
}

// Persistence interface
abstract class ChangeStore {
  Future<void> append(Change c);
  Stream<List<Change>> pending();
  Future<void> markApplied(String changeId, {required String serverVersion});
}

// Sync manager
class SyncManager {
  final ChangeStore changes;
  final EntityStore entities;
  final Api api;
  final Clock clock;
  SyncManager(this.changes, this.entities, this.api, this.clock);

  Future<void> push() async {
    final batch = await changes.pending().first; // small batch
    for (final c in batch) {
      try {
        final res = await api.apply(c);
        await changes.markApplied(c.id, serverVersion: res.etag);
        await entities.updateVersion(c.entityId, res.etag);
      } on PreconditionFailed catch (e) {
        await _resolveConflict(c, e.serverEntity);
      } on TransientError {
        // leave in queue; retry later with backoff
        return;
      }
    }
  }
}
```

When not to go offline‑first
- Real‑time transactional integrity (e.g., stock trades) with strong consistency might not fit offline semantics.
- If product does not require offline and infra budget is minimal, choose simpler caching.

Conclusion
Offline‑first is an architectural choice that must permeate data modeling, UI, and operational practices. With a change log, idempotent writes, measured retries, and explicit conflict policies, you can deliver a robust experience that users trust—on any network.