# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Power Platform VS Code extension** that provides tooling for creating, building, and deploying Power Platform solutions, packages, and Power Pages portals. The extension integrates the Power Platform CLI (pac) directly into VS Code and supports both desktop and web (vscode.dev) environments.

**Important**: Always refer to `.github/instructions/memory-bank.instructions.md` for the latest architecture details and coding guidelines.

## Build Commands

```bash
# Initial setup
npm ci                    # Clean install dependencies
gulp ci                   # Full CI build

# Development builds
npm run build             # Full build using gulp (same as running 'gulp')
npm run compile-web       # Build web version only (webpack)
npm run watch-web         # Watch mode for web development

# Testing
npm run test              # Run unit tests
npm run test-desktop-int  # Run desktop integration tests
npm run test-web-integration  # Run web integration tests
npm run test-common-int   # Run common integration tests
npm run coverage          # Run tests with coverage

# Linting
gulp lint                 # Run ESLint (part of build process)

# Package creation
npm run dist              # Create VSIX package for distribution
```

## Architecture Overview

### Multi-Target Build System

The extension uses **webpack** with three distinct build targets:

1. **Desktop Extension** (`src/client/extension.ts`) - Main VS Code extension
2. **Web Extension** (`src/web/extension.ts`) - VS Code for Web support
3. **Language Servers** (`src/server/`) - HTML/Liquid and YAML language servers

Build configuration is in `webpack.config.js` with task orchestration via `gulpfile.mjs`.

### Key Directory Structure

- **`src/client/`** - Desktop extension code
  - `extension.ts` - Main entry point
  - `lib/` - Core libraries (CLI acquisition, PAC wrapper)
  - `pac/` - Power Platform CLI integration
  - `power-pages/` - Power Pages specific features
    - `actions-hub/` - Power Pages Actions Hub tree view
    - `metadata-diff/` - Compare local vs environment changes
  - `uriHandler/` - Deep link handling (vscode://... URIs)

- **`src/web/`** - Web extension code (VS Code for Web)
  - Shares common utilities with desktop but has web-specific implementations

- **`src/server/`** - Language server implementations
  - `YamlServer.ts` - YAML language features
  - `HtmlServer.ts` - HTML/Liquid language features

- **`src/debugger/`** - PCF (Power Apps Component Framework) debugging support

- **`src/common/`** - Shared code between desktop/web
  - `services/` - Core services (ArtemisService, BAPService, PPAPIService)
  - `utilities/` - Shared utilities
  - `OneDSLoggerTelemetry/` - Telemetry infrastructure
  - `ecs-features/` - Feature flag management

### PAC CLI Integration

The extension **automatically downloads and manages** the Power Platform CLI:

- CLI acquisition: `src/client/lib/CliAcquisition.ts`
- CLI wrapper: `src/client/pac/PacWrapper.ts`
- CLI context: `src/client/pac/PacContext.ts`

Always use `PacWrapper` for CLI operations:

```typescript
const pacWrapper = new PacWrapper(context);
await pacWrapper.executeCommand(['solution', 'list']);
```

### Service Architecture

Three core services handle Power Platform API communication:

1. **ArtemisService** - Power Pages specific APIs
2. **BAPService** - Business Application Platform APIs
3. **PPAPIService** - Power Platform APIs

All services use `AuthenticationProvider` for Microsoft authentication.

### Telemetry System

Comprehensive telemetry using **OneDSLogger**:

- Wrapper: `src/common/OneDSLoggerTelemetry/OneDSLoggerWrapper.ts`
- Constants: `src/common/OneDSLoggerTelemetry/telemetryConstants.ts`
- Separate tracking for desktop vs web experiences
- Use `oneDSLoggerWrapper.getLogger()` for all telemetry events

## Coding Standards

### Style Guidelines (CRITICAL)

- **Indentation**: 4 spaces (NO TABS)
- **Functions**: Arrow functions `=>` preferred over anonymous functions
- **Braces**: Same line, always use for loops/conditionals
- **Parentheses**: No whitespace inside - `for (let i = 0; i < 10; i++)`

### Naming Conventions

- **PascalCase**: Types, interfaces, enums, enum values, classes
- **camelCase**: Functions, methods, properties, local variables
- **UPPER_CASE**: Constants
- Use descriptive, whole words

### String Literals & Localization

- **"double quotes"**: User-facing strings needing localization
- **'single quotes'**: Internal/technical strings
- **ALL user-visible strings MUST be externalized** using `vscode-nls`

### Comments & Documentation

- Use **JSDoc** for functions, interfaces, enums, classes
- Include parameter descriptions and return types
- NO `//Arrange`, `//Act`, `//Assert` comments in tests

## Testing Patterns

### Framework

- **Mocha** test framework
- **Chai** assertions (use `expect`, not `assert`)
- **Sinon** for stubs/spies/mocks

### Test Organization

- Unit tests: `src/*/test/unit/`
- Integration tests: `src/*/test/integration/`
- Mock dependencies extensively for unit tests

### Running Single Tests

```bash
# Desktop integration test
npm run test-desktop-int -- --grep "test name pattern"

# Unit test
npm run test -- --grep "test name pattern"
```

## Power Platform Specific Patterns

### Power Pages File Extensions

Portal files use specific extensions (see `src/common/constants.ts`):

- `.copy.html` - HTML content
- `.custom_javascript.js` - Custom JavaScript
- `.en-US.customcss.css` - Localized CSS
- File callbacks: `src/client/power-pages/fileSystemCallbacks.ts`

### Power Pages Actions Hub

Tree view provider for managing Power Pages sites:

- Main provider: `src/client/power-pages/actions-hub/ActionsHubTreeDataProvider.ts`
- Tree items: `src/client/power-pages/actions-hub/tree-items/`
- Handlers: `src/client/power-pages/actions-hub/handlers/`
- Current site context: `src/client/power-pages/actions-hub/CurrentSiteContext.ts`

### Metadata Diff Feature

Compare local Power Pages files with environment:

- Implementation: `src/client/power-pages/metadata-diff/`
- Supports multiple comparison operations
- Export/import comparison results
- Tree and list view modes

### Feature Flags

Managed via ECS (Experimentation and Configuration Service):

- Configuration: `src/common/ecs-features/ecsFeatureGates.ts`
- Use feature flags to control rollout of new features
- Example: `enableMetadataDiff`, `enableActionsHub`

## Debugging the Extension

Use VS Code's built-in debugging:

1. Open repository in VS Code
2. Select **"Launch VSCode Extension"** from Run/Debug dropdown
3. Press **F5** to start debugging
4. New VS Code window opens with extension loaded

For web extension debugging, use **"Launch Web Extension"** configuration.

## Common Patterns & Gotchas

### Cross-Platform Considerations

- Extension runs on Windows, macOS, Linux
- PAC CLI has platform-specific binaries (`.exe` on Windows)
- Use `path.join()` for file paths, never hardcode separators
- Test on multiple platforms when dealing with file system operations

### Authentication Flow

- Uses VS Code's built-in authentication API
- Provider ID: `PROVIDER_ID` from `src/common/services/AuthenticationProvider.ts`
- Silent auth attempted first, interactive only when needed
- Multiple cloud support: Public, USGov, USGovHigh, USGovDoD, China

### Webpack Build Quirks

- Known issue: Windows-style paths in localization (fixed with `gulp-replace` in build)
- Webpack externals configured for VS Code API and telemetry dependencies
- Three separate webpack configs for different targets

### Memory Bank System

If you see references to "memory bank" files in `.github/instructions/memory-bank.instructions.md`, this is documentation for GitHub Copilot's memory system. These files contain project context and should be maintained when making architectural changes.

## Dependencies & Version Management

### npm Overrides

The project uses npm `overrides` in package.json to force transitive dependencies to secure versions. When adding dependencies, verify they don't introduce vulnerabilities.

### Major Dependencies

- `vscode` engine: ^1.91.0
- `@microsoft/generator-powerpages` - Yeoman generator for Power Pages
- `puppeteer-core` - PCF debugging
- `fluid-framework` - Collaborative features
- `webpack` - Bundling

### Updating Dependencies

```bash
npm outdated              # Check for updates
npm audit                 # Check for vulnerabilities
npm audit fix             # Auto-fix vulnerabilities (safe)
```

## Pull Request & Commit Guidelines

When creating commits:

- Use descriptive commit messages
- Include Co-Authored-By for pair programming
- Reference issue numbers when applicable
- Run `npm run build` and `npm run test` before committing

Standard commit format:
```
Brief description of change

- Detailed bullet points of changes
- References to related issues

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Name <email>
```

## Resources

- [Power Platform CLI Documentation](https://learn.microsoft.com/power-platform/developer/cli/introduction)
- Issue tracker: https://github.com/microsoft/powerplatform-vscode/issues
- Contributing guidelines: CONTRIBUTING.md
- Security policy: SECURITY.md
