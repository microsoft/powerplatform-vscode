---
applyTo: "src/client/**"
description: Desktop Extension Setup and Contribution Instructions
---

# VS Code Desktop Extension

## 1. Project Overview

- The Power Platform VS Code extension desktop code is under `src/client/`.
- Key files: `src/client/extension.ts` (entry), `package.json` (manifest), `src/client/lib/` (CLI integration), `src/client/power-pages/` (Power Pages tooling).

## 2. Development Environment

- Node.js 18+ and npm 9+ required.
- Install dependencies: `npm install`
- Build extension: `gulp ci`
- Test extension: `npm run test-desktop-int`
- Debug/launch in VS Code using provided launch configs.

## 3. Coding Standards

- TypeScript, 4-space indentation, arrow functions preferred.
- Externalize all user-facing strings with `vscode-nls`.
- PascalCase for types/enums, camelCase for functions/variables.
- JSDoc comments for exported functions, classes, interfaces.

## 4. Key Architectural Patterns

- **PAC CLI Integration:** Use `PacWrapper` for CLI operations.
- **Telemetry:** Use `oneDSLoggerWrapper` for events.
- **Service Architecture:** Core services in `src/common/services/`.

## 5. Testing

- Unit tests: `npm run test`
- Integration tests: `npm run test-desktop-int`
- Use Mocha, Chai, Sinon. Mock dependencies.

## 6. Contribution Workflow

- Fork and clone repo. Create feature branch from `main`.
- Make changes in `src/client/` for desktop features.
- Cover new code with tests. Run all tests before PR.
- Submit PR with clear description.

## 7. Localization

- Update localization files in `l10n/` and `localize/` as needed.
- Add new strings to `package.nls.json`.

## 8. Common Tasks

- Add commands: update `package.json`, implement in `src/client/extension.ts`.
- PAC CLI: use `PacWrapper`.
- Telemetry: use `oneDSLoggerWrapper`.
- UI: update files in `src/client/` and assets in `src/client/assets/`.

## 9. Reference Docs

- See `.github/copilot-instructions.md` for architecture/coding guidelines.
- See `README.md` for project info.
