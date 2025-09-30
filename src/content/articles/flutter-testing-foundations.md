---
title: Flutter Testing Foundations
description: A practical guide to unit, widget, and integration tests that keep your Flutter codebase safe to change.
date: 2025-01-20
tags: ["testing", "quality", "flutter"]
heroImage: "/og-default.svg"
draft: false

---

A balanced testing strategy lets teams move quickly without fear of regressions.

Key layers:

- Unit tests: fast, isolated; focus on pure logic and domain rules.
- Widget tests: verify layout and behavior of individual widgets in isolation.
- Integration tests: cover critical flows end-to-end with real device behavior.

Guidelines:

1. Keep business rules out of widgets so unit tests do the heavy lifting.
2. Use fakes/stubs where appropriate; avoid over-mocking.
3. Test public behavior, not private implementation details.
4. For integration tests, prioritize a small, stable set that covers the money paths.

Example structure:

- `test/unit/...` for use cases and services
- `test/widget/...` for composable UIs
- `integration_test/...` for flows like onboarding, checkout, and sync