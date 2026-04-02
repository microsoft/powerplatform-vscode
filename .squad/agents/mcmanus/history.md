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
