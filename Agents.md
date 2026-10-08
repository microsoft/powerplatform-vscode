# Agents Instructions

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

### User-facing content generation and review

Use the [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/) as the source of truth for user-facing writing style and terminology. Apply it when generating or reviewing text across this repository, including command titles, labels, tooltips, dialogs, notifications, errors, validation messages, progress and status text, accessibility text, documentation, and agent-authored explanations. Consult the relevant guide section when a wording choice is unclear.

#### Content generation

- **Voice and clarity:** Follow the [Microsoft style and voice tips](https://learn.microsoft.com/en-us/style-guide/top-10-tips-style-voice). Use short, clear sentences, everyday words, active voice, and direct instructions. Lead with the important information or action. Address the reader as "you" where appropriate, and use natural contractions when they improve readability. Remove filler and explain unfamiliar acronyms or technical terms.
- **Tone:** Be conversational, respectful, and helpful. Match the tone to the situation; keep errors calm and factual, without blame, jokes, or unnecessary enthusiasm.
- **Capitalization and punctuation:** Use [sentence-style capitalization](https://learn.microsoft.com/en-us/style-guide/capitalization) for headings, titles, and labels, preserving proper nouns, product names, and acronyms. Omit terminal punctuation from headings and short UI labels; use normal sentence punctuation in explanatory messages, following the [punctuation guidance](https://learn.microsoft.com/en-us/style-guide/punctuation/periods). Use the serial comma and one space between sentences.
- **Messages and next steps:** Identify the operation and its actual outcome. For errors and validation, explain the problem and provide a supported next step when one is known. Do not invent causes or recovery actions, or imply that an operation succeeded before success is confirmed.
- **Terminology:** Use one consistent term for each concept. Preserve official names such as Power Platform, Power Pages, and Visual Studio Code, and match existing UI names exactly when referring to them. Do not rename command IDs, API names, telemetry identifiers, paths, or localization keys solely to improve prose.
- **Inclusive language:** Follow the [bias-free communication guidance](https://learn.microsoft.com/en-us/style-guide/bias-free-communication). Avoid stereotypes, assumptions about the reader, and language that excludes or demeans people.
- **Accessible content:** Follow the [writing for all abilities guidance](https://learn.microsoft.com/en-us/style-guide/accessibility/writing-all-abilities). Use descriptive link text and meaningful accessibility labels. Do not rely on color, icons, or directions alone to convey meaning. Prefer input-neutral verbs such as "select" unless describing a specific input method.
- **Global readability:** Follow the [global writing tips](https://learn.microsoft.com/en-us/style-guide/global-communications/writing-tips). Avoid slang, idioms, culture-specific references, and ambiguous sentence structures. Keep wording consistent and easy to translate.
- **Localization:** For runtime strings, retain the externalization requirements above and use existing localization and placeholder conventions. Localize complete messages instead of concatenating sentence fragments. Preserve placeholder meaning and required technical identifiers, and follow the translations-export workflow below when localization strings change.

Examples of applying these rules:

| Context | Avoid | Prefer |
| --- | --- | --- |
| UI label | Select Environment | Select environment |
| Validation when a website ID is missing | Missing ID | The website ID is missing. Enter a website ID to continue. |

#### Required content review

Before completing work, and when reviewing changes, review every new or changed user-facing string or passage, including manifest text and localization resources. Confirm that:

- The wording is concise, clear, conversational, and appropriate to the situation.
- Capitalization, punctuation, product names, and terminology follow the guide and remain consistent across related surfaces.
- Messages accurately reflect behavior and outcomes, with clear, supported next steps where applicable.
- Content is inclusive, accessible, and understandable to worldwide audiences.
- Runtime strings remain externalized, complete messages are localizable, placeholders retain their meaning, and technical identifiers are unchanged by prose-only edits.

Flag wording violations with concrete replacement text and cite the relevant guide section when needed. When implementing changes, correct in-scope wording issues before finishing; do not expand the task into an unrelated rewrite of existing messages or a change in application behavior.

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

