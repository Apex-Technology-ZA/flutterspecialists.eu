---
title: "CI/CD for Flutter with GitHub Actions and fastlane: Production-Ready Automation"
description: A deep dive into building a resilient CI/CD pipeline for Flutter using GitHub Actions and fastlane, including code signing, artifacts, and release gates.
date: 2025-03-20
tags:
  ["ci-cd", "automation", "github-actions", "fastlane", "flutter", "release"]
heroImage: "/og-default.svg"
draft: false
---

Why CI/CD matters

- The speed and quality of release engineering determines how quickly you can learn from production.
- Mature CI/CD turns manual checklists into code, eliminating drift and reducing both risk and toil.
- For Flutter, the complexity spans three layers: Dart/Flutter tooling, Android/iOS native build chains, and store release procedures.

What “good” looks like

- Reproducible, cache‑optimized builds for Android and iOS
- Full suite (lint → unit → widget) on PRs with fast feedback
- “Money path” integration tests on real devices prior to release
- Protected main branch with release gates (size budgets, smoke tests)
- One‑button release to internal/staging; audited and traceable promotion to production

High‑level pipeline

1. PR validation (fast checks)
   - format, analyze, unit and widget tests, minimal build
2. Merge to main (deep checks)
   - as above + size budget, optional device farm tests, artifact build
3. Release (manual or tag‑driven)
   - fastlane lanes for Android/iOS packaging, signing, upload to stores/TestFlight/Internal App Sharing
4. Post‑deploy
   - smoke test, monitoring checks, rollout % with automatic rollback criteria

Repository structure recommendations

- Separate “project infra” from app code (e.g., `/.github/workflows`, `/fastlane`, `/scripts`)
- Keep secrets in GitHub Encrypted Secrets; never in repo
- Define a `/scripts` folder with small, composable scripts:
  - `scripts/ci_bootstrap.sh`: Android SDK, Ruby/bundler, cocoapods
  - `scripts/build_android.sh`, `scripts/build_ios.sh`

Caching strategy

- GitHub Actions:
  - Cache `~/.pub-cache`, Gradle caches, CocoaPods, DerivedData
  - Key caching by lockfiles + OS
- Flutter build caching:
  - Prefer `flutter pub get` cache + Gradle
- Avoid over‑caching; stale caches cause opaque failures. Bust keys on lockfile changes.

GitHub Actions example (conceptual)

- Jobs: lint, test, build_android, build_ios
- Concurrency group: per ref; cancel in progress on new pushes
- Matrix for Android build API levels if needed
- Permissions restricted to minimum (contents: read; for releases, write on packages/deploy job only)

Android build specifics

- Java 17; Gradle Wrapper pinned
- Use Play App Signing
- Keystore for legacy signing stored in GitHub Secrets (base64)
- Service account JSON for Play Developer API stored as secret, referenced by fastlane

iOS build specifics

- Xcode pinned version (e.g., from `macos-13` or `macos-14` runner image)
- Match or App Store Connect API keys via fastlane
- Automatic code signing with Apple’s App Store Connect API key stored in Secrets
- Cache Cocoapods (Pods + DerivedData) keyed by Podfile.lock

fastlane lanes (conceptual)

- `lane :test`: run unit+widget tests (optional; keep in Actions only)
- `lane :build_android`: assembleRelease, export artifacts (AAB/APK), upload to Play internal testing
- `lane :build_ios`: build for TestFlight (IPA), upload to App Store Connect
- `lane :promote_android`, `lane :promote_ios`: promote tracks/testers to production (manual or scheduled)

Example fastlane/App Store Connect key (environment)

- APP_STORE_CONNECT_API_KEY (JSON or base64)
- MATCH_GIT_BASIC_AUTH or API key if using match
- PLAY_JSON_KEY (Android service account)
- ANDROID_KEYSTORE, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEYALIAS, ANDROID_KEYALIAS_PASSWORD

Size budgets and guarding

- Generate APK/AAB/IPA; compute size deltas vs. last production
- Fail PR if thresholds exceeded (e.g., +2MB)
- Keep a markdown report artifact with breakdown (code, assets, ICU data, fonts)

“Money path” device tests

- Run a small suite (2–5 tests) on Firebase Test Lab or similar:
  - Sign‑in happy path
  - Checkout flow
  - Offline → online sync resolution
- Capture video/screens and attach as artifacts to the run

Rollouts and safety

- Android staged rollout: start at 5%, then 25%, then 100% based on error metrics
- iOS phased release: enable after TestFlight soak period
- Automatic rollback trigger: crash‑free rate drop, ANR spikes, or key error budgets exceeded

Observability and reporting

- Post release comments in PR with links to artifacts, release notes, size diff
- Integrate Slack/MS Teams notifications for success/failures and rollouts
- Monitor store vitals and backend error rates; annotate deploys in dashboards (Datadog, Grafana)

Operating model

- CI/CD is code: review changes to workflows and lanes
- Release captain rotation with runbooks and 2‑person approval for production
- Incident playbook: stop rollout, hotfix branch strategy, and post‑mortem template

Adoption steps

1. Stabilize PR validation: cache + tests + size budget
2. Add Android internal app sharing + TestFlight uploads on main merges
3. Add staged rollout automation with metrics gate
4. Introduce device farm tests for money paths
5. Regularly prune and update runner images, Ruby gems, and plugin versions

Conclusion
The most effective CI/CD pipelines are boring: trustworthy, fast, and predictable. Compose your pipeline from small, transparent steps, enforce gates where failures hurt you most, and treat releases as a routine outcome of healthy engineering—not heroics.
