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

### 2026-04-02 — E2E Test Architecture Review
- E2E tests live in `src/e2e/` using Playwright, targeting VS Code Web at `insiders.vscode.dev`
- Config enforces serial execution globally (`fullyParallel: false`, `workers: 1`) — per-describe serial markers are unnecessary
- `queryParameters` enum in `src/web/client/common/constants.ts` uses all-lowercase keys; URL builder in `src/e2e/helpers/url-builder.ts` uses camelCase — confirmed casing mismatch
- Production code reads params via `queryParamsMap.get(queryParameters.X)` (lowercase) — test URLs must match
- Auth fixture at `src/e2e/fixtures/vscode-web.fixture.ts` has a catch-all `catch {}` that swallows real auth failures
- `Selectors` object in `src/e2e/helpers/selectors.ts` provides centralized selector constants — adequate for current scale but not a full POM
- 13 `waitForTimeout()` calls across fixture + specs — primary flakiness risk
