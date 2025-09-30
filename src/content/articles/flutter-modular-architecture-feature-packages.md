---
title: Modular Architecture for Large Flutter Apps with Feature Packages
description: A practical blueprint to modularize large Flutter apps using feature packages, clear boundaries, and stable APIs.
date: 2025-03-12
tags: ["architecture", "modularization", "packages", "flutter", "clean-architecture"]
heroImage: "/og-default.svg"
draft: false
---

Why modularize?
- Scale: Teams can ship features independently with fewer merge conflicts.
- Build times: Smaller targets speed up builds and tests.
- Boundaries: Clear APIs reduce accidental coupling and regressions.
- Reuse: Common modules can be shared across apps and platforms.

Core principles
1) Directional dependencies
   - High-level modules (features) depend on lower-level modules (domain, data, ui-kit).
   - Never allow back-edges (e.g., data → feature).

2) Stable contracts
   - Define public APIs via Dart `export`s; keep implementation details internal.
   - Use semantic versioning within the monorepo to reason about changes.

3) Single responsibility per package
   - Feature modules encapsulate screen flows + UI state.
   - Domain modules encapsulate use cases and business rules.
   - Data modules encapsulate repositories and gateways.

Reference layout (monorepo)
```
/app
  lib/
    main.dart
    di/
      container.dart
  pubspec.yaml

/packages
  /feature_todos
    lib/
      feature_todos.dart      # public API (exports)
      src/
        presentation/...
        state/...
        routes.dart
    pubspec.yaml
  /feature_profile
  /domain_auth
    lib/
      domain_auth.dart
      src/
        usecases/
        entities/
        errors.dart
    pubspec.yaml
  /data_auth
    lib/
      data_auth.dart
      src/
        repositories/
        datasources/
        mappers/
    pubspec.yaml
  /ui_kit
    lib/
      ui_kit.dart
      src/
        atoms/
        molecules/
        theming/
    pubspec.yaml
```

Dependencies (directional)
- app → feature_todos, feature_profile, ui_kit, domain_* (optional), data_* (via DI)
- feature_* → domain_*, ui_kit
- data_* → domain_* (for models) and external packages (http, drift, etc.)
- domain_* → pure Dart only (no Flutter imports)

Enforcing boundaries
- Use Dart `library` and `part` to scope internals if desired.
- In each package, expose a single entrypoint `lib/<package>.dart` exporting only the public API:
  ```dart
  // lib/feature_todos.dart
  library feature_todos;

  export 'src/routes.dart' show TodosRoute;
  export 'src/state/todos_controller.dart' show TodosController;
  ```
- Keep `src/` private to the package’s consumers; do not export deep internals.

DI and composition root
- The app crate (`/app`) is the only place where you wire concrete implementations:
  ```dart
  // app/lib/di/container.dart
  import 'package:data_auth/data_auth.dart';
  import 'package:domain_auth/domain_auth.dart';

  class AppContainer {
    late final AuthRepository authRepo;
    late final SignInUseCase signIn;

    AppContainer() {
      authRepo = HttpAuthRepository(/* client, baseUrl */);
      signIn = SignInUseCase(authRepo);
    }
  }
  ```
- Feature modules accept dependencies in constructors (no global singletons).

State management per feature
- Choose 1–2 patterns repo-wide (e.g., Riverpod + BLoC)
- Example: Riverpod for feature states, BLoC for flows with explicit state machines.
- Avoid mixing many patterns; consistency reduces onboarding time.

Navigation
- Each feature exports a typed route or a route builder function:
  ```dart
  // feature_todos/lib/src/routes.dart
  import 'package:flutter/widgets.dart';
  import 'presentation/todos_page.dart';

  class TodosRoute extends PageRouteBuilder {
    TodosRoute() : super(pageBuilder: (_, __, ___) => const TodosPage());
  }
  ```
- The app composes routes in a central router.

Testing strategy
- Unit tests in domain_* (pure Dart) are the backbone of correctness.
- Widget tests in feature_* validate UI behavior and state transitions.
- Contract tests at package boundaries verify models and repository behavior.
- Integration tests verify critical money paths end-to-end (small, stable suite).

Build and CI optimizations
- Use Melos or custom scripts to run `flutter test` only in changed packages.
- Cache pub and build artifacts in CI; shard tests per package group.
- Lint for forbidden imports (e.g., deny `feature_*` importing `app`).

Migration plan (incremental)
1) Identify high-churn areas → extract first feature package.
2) Extract domain and data layers for that feature.
3) Move shared UI components to `ui_kit`.
4) Establish DI in app; delete old cross-cutting singletons.
5) Repeat feature-by-feature; keep app compiling at each step.

Common pitfalls and remedies
- Pitfall: “God package” exporting everything. Remedy: minimal public API; enforce via exports.
- Pitfall: Circular deps via utility modules. Remedy: move utilities down the stack or duplicate tiny helpers.
- Pitfall: Over-abstracting too early. Remedy: let duplication exist briefly; refactor only when usage patterns stabilize.

Checklist
- [ ] Directional deps validated
- [ ] Public API minimal and documented
- [ ] Feature owns its routes, state, and presentation
- [ ] Domain is Flutter-free and test-heavy
- [ ] Data is replaceable via DI
- [ ] CI runs targeted tests per package
- [ ] Lints prevent forbidden imports

Conclusion
Modularization is not about dogmatic layering; it’s about creating **stable seams** for teams to move fast without stepping on each other. Start where pain is highest, codify boundaries, and evolve toward a package graph that fits your organization’s scale.