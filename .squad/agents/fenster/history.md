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

### E2E P1 Fixes (2026-04-02)

**Leaf-node detection (file-operations.spec.ts):** Replaced brittle `aria-expanded === null` loop with Playwright `filter({ hasNot })` using `.monaco-tl-twistie.collapsible` selector. The twistie's `collapsible` CSS class is VS Code's canonical marker for expandable tree items; its absence reliably identifies leaf/file nodes. Added `treeRowCollapsibleTwistie` to `selectors.ts` for reuse.

**Auth storageState caching:** Added Playwright `storageState` caching to avoid repeating the full Microsoft login flow on every test run. After the first successful auth, cookies/localStorage are saved to `src/e2e/.auth/storageState.json`. On subsequent runs, the config loads the cached state and the fixture uses a reduced 5s timeout for the Allow button (vs 20s on first run). Force re-auth via `PP_FORCE_REAUTH=1` env var or by deleting the `.auth/` directory. Added `.auth/` to `.gitignore`.
