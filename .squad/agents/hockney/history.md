# Project Context

- **Owner:** Amit Joshi
- **Project:** Power Platform Tools — VS Code extension for creating, building, and deploying Power Platform solutions, packages, and portals. Integrates PAC CLI directly into VS Code.
- **Stack:** TypeScript, VS Code Extension API, webpack (multi-target: node + webworker), vscode-languageclient/server, Mocha/Chai/Sinon, Playwright
- **Key directories:**
  - `src/client/` — Desktop extension: commands, tree views, webviews, panels, PAC CLI integration
  - `src/server/` — Language servers for YAML and HTML/Liquid autocomplete
  - `src/web/` — VS Code for Web variant: remote providers, collaboration views
  - `src/common/` — Shared: telemetry (OneDSLogger), auth, ECS feature flags, Copilot/chat, utilities
  - `src/debugger/` — PCF and server-logic debugging, debug adapter
- **Test structure:**
  - Unit: `src/*/test/unit/`
  - Integration: `src/*/test/integration/`
  - E2E: `src/e2e/tests/` (Playwright)
  - Framework: Mocha + Chai (expect) + Sinon
- **Created:** 2026-04-02

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-04-02 — E2E Playwright Review

- **E2E location:** `src/e2e/` with 5 spec files, 1 fixture, 2 helpers, Playwright config
- **Architecture:** Custom fixture (`vscode-web.fixture.ts`) authenticates via Microsoft login popup against `insiders.vscode.dev`, provides `vsCodeWeb` Page to tests
- **Test runner:** `npm run test-e2e` → `npx playwright test --config=src/e2e/playwright.config.ts`
- **Config:** 120s global timeout, 30s expect/action timeout, single worker, Chromium-only, trace/video/screenshot on failure
- **Selectors:** centralized in `helpers/selectors.ts` — CSS selectors for VS Code DOM, not using VS Code-specific test IDs
- **URL builder:** `helpers/url-builder.ts` constructs `insiders.vscode.dev` URL with Power Pages query params; mirrors `queryParameters` enum from `src/web/client/common/constants.ts` but has extra params (orgUrl, dataSource, schema, websiteName, etc.) not in that enum
- **Key anti-pattern:** Heavy use of `waitForTimeout()` (13 occurrences) instead of waiting for specific conditions — flaky by design
- **Credential handling:** `.env` file is gitignored but `.env.example` documents real field names; no secret scanning gate
- **Coverage:** Only Power Pages web extension smoke/sanity level. No error-path, no command-palette, no language-server, no auth-failure tests
- **No page-object model:** All DOM interactions inline in specs — will not scale

### 2026-04-02 — Keaton Lead Review

Keaton approved e2e review with adjustments — POM downgraded to minor (premature for 5 specs), serial marker dismissed (config handles it). P0: waitForTimeout, URL casing, vacuous assertion. P1: auth errors, leaf-node detection, storageState. URL casing is worse than initially reported — test sends camelCase, enum is lowercase, URLSearchParams is case-sensitive; likely causes production query failures.
