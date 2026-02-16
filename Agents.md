# Agents Instructions

## General Guidelines

Always read memory bank information from [memory-bank/Agents.md](memory-bank/Agents.md)

## Architecture Overview

This is the **Power Platform VS Code extension** that provides tooling for creating, building, and deploying Power Platform solutions, packages, and portals. It integrates the Power Platform CLI (pac) directly into VS Code.

### Key Components

- **Client (`src/client/`)**: Main VS Code extension logic, UI components, and Power Pages tooling
- **Server (`src/server/`)**: Language servers for HTML/Liquid and YAML files
- **Debugger (`src/debugger/`)**: PCF debugging capabilities for Power Platform components
- **Web (`src/web/`)**: VS Code for Web support
- **Common (`src/common/`)**: Shared utilities, telemetry, and services

### Critical Architecture Patterns

1. **PAC CLI Integration**: The extension automatically downloads and manages the Power Platform CLI (`src/client/lib/CliAcquisition.ts`, `src/client/pac/PacWrapper.ts`)
2. **Multi-Target Build**: Uses webpack to build for desktop VS Code, web, and language servers (`webpack.config.js`)
3. **Telemetry-First**: Comprehensive telemetry using OneDSLogger for both desktop and web (`src/common/OneDSLoggerTelemetry/`)
4. **Service Architecture**: Core services in `src/common/services/` (ArtemisService, BAPService, PPAPIService)

## Development Workflows

### Build Commands

- `npm run build` or `gulp`: Full build (uses gulpfile.mjs)
- `npm run compile-web`: Build web version only
- `npm run test-desktop-int`: Run desktop integration tests
- `npm run test-web-integration`: Run web integration tests

### Key Files for Extension Development

- `src/client/extension.ts`: Main extension entry point
- `package.json`: Extension manifest with commands and contributions
- `src/client/lib/PacActivityBarUI.ts`: Activity bar panels and UI registration
- `src/client/PortalWebView.ts`: Power Pages portal webview management
- `src/client/pac/PacWrapper.ts`: Wrapper for Power Platform CLI commands
- `src/client/power-pages/actions-hub/ActionsHubTreeDataProvider.ts`: Power Pages Actions Hub tree data provider
-

### PAC CLI Integration Patterns

```typescript
// Always use PacWrapper for CLI operations
const pacWrapper = new PacWrapper(context);
await pacWrapper.executeCommand(['solution', 'list']);
```

## Coding Guidelines

### Indentation & Style

- Use 4 spaces for indentation (no tabs)
- Arrow functions `=>` over anonymous functions
- Curly braces on same line, always use braces for loops/conditionals
- No whitespace in parenthesized constructs: `for (let i = 0; i < 10; i++)`

### Naming Conventions

- PascalCase: `type` names, `enum` values
- camelCase: `function`/`method` names, `property` names, `local variables`
- UPPER_CASE: constants
- Use whole words when possible

### Strings & Localization

- "double quotes" for user-facing strings that need localization
- 'single quotes' for internal strings
- All user-visible strings MUST be externalized using `vscode-nls`

### Comments

- Use JSDoc style comments for functions, interfaces, enums, and classes
- Include parameter descriptions and return types

### Workflow

- Use async/await for asynchronous code
- When modifying any localization strings, run `npm run translations-export` to ensure updates are captured.

## Testing Patterns

### Framework Usage

- **Mocha** test framework with `describe` and `it` blocks
- **Chai** `expect` assertions (not assert)
- **Sinon** for stubs and spies
- Mock dependencies extensively for unit tests

### Test Organization

- Unit tests: `src/*/test/unit/`
- Integration tests: `src/*/test/integration/`
- No `//Arrange`, `//Act`, `//Assert` comments

### Running Tests

```bash
npm run test              # Unit tests
npm run test-desktop-int  # Desktop integration tests
npm run test-web-integration  # Web integration tests
```

## Power Platform Specific Patterns

### Power Pages Development

- Portal files use specific extensions: `.copy.html`, `.custom_javascript.js` (see `src/common/constants.ts`)
- File system callbacks in `src/client/power-pages/fileSystemCallbacks.ts`
- Bootstrap diff functionality for portal template updates

### CLI Version Management

- CLI versions managed in `src/client/lib/CliAcquisition.ts`
- Global storage for CLI binaries in VS Code's global storage path
- Cross-platform support (Windows `.exe`, Unix executables)

### Telemetry Implementation

- Use `oneDSLoggerWrapper` for all telemetry events
- Events defined in `src/common/OneDSLoggerTelemetry/telemetryConstants.ts`
- Separate telemetry for desktop vs web experiences
