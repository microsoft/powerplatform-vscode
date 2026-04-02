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
- **UI components:** Activity bar tree views, PortalWebView, NPSWebView, Copilot webview, Power Pages file explorer, Actions Hub
- **Created:** 2026-04-02

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-04-02 — E2E Test P0 Reliability Fixes
- **P0 Fix 1 (waitForTimeout elimination):** Replaced all 13 `waitForTimeout()` calls across fixture and 3 spec files with condition-based Playwright waits. The 15-second fixture sleep now waits for `powerPagesFileExplorer` or `treeRow` selectors. Spec files use `toBeVisible()` auto-retry or `waitForSelector()` for each wait point.
- **P0 Fix 2 (URL param casing):** Changed `buildVSCodeWebUrl()` to emit lowercase query param keys (`organizationid`, `websiteid`, etc.) matching the `queryParameters` enum in `src/web/client/common/constants.ts`. The extension lowercases keys at parse time (extension.ts line 90), but matching casing at the source removes any risk from intermediate URL consumers.
- **P0 Fix 3 (vacuous assertion):** Changed `expect(count).toBeGreaterThanOrEqual(0)` → `toBeGreaterThan(0)` in navigation.spec.ts, and reordered so the explorer viewlet visibility check runs first.
- **Auth error handling (P1):** Improved the fixture's auth catch block to only swallow timeout errors, re-throwing unexpected failures like network or credential errors.

### 2026-04-02 — Fenster P1 E2E StorageState Caching

Fenster added storageState caching to e2e fixture — auth state saved to `.auth/storageState.json` (gitignored), reused on subsequent test runs, force re-auth via `PP_FORCE_REAUTH=1` environment variable. Reduces auth popup flow overhead in local and CI runs.
