---
applyTo: "**/src/web/**"
description: Web Extension Setup and Contribution Instructions
---

# Web Extension Instructions

This document provides setup, architecture, coding, and testing instructions for the web extension located in `src/web`. It is designed to help both humans and AI agents contribute effectively.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Development](#development)
- [Folder Structure](#folder-structure)
- [Coding Guidelines](#coding-guidelines)
- [Building the Extension](#building-the-extension)
- [Testing](#testing)
- [Power Platform Patterns](#power-platform-patterns)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Overview

The web extension extends Visual Studio Code for Power Platform scenarios. All source code for the web extension is located in the `src/web` directory.

## Architecture

- **Client (`src/web/client/`)**: Main VS Code web extension logic and UI components.
- **Common (`src/common/`)**: Shared utilities, telemetry, and services.
- **Multi-Target Build**: Uses webpack for desktop, web, and language servers.
- **Telemetry**: Uses OneDSLogger for web telemetry (`src/common/OneDSLoggerTelemetry/`).
- **Service Architecture**: Core services in `src/common/services/`.
- **Entrypoint**: `src/web/client/extension.ts` is the main entry point for the web extension.

## Installation

1. Ensure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed.
2. Navigate to the project root directory:

   ```sh
   cd /path/to/powerplatform-vscode
   ```

3. Install dependencies:

   ```sh
   npm install
   ```

## Development

- Main code for the web extension is inside `src/web/client/`.
- Open the project in Visual Studio Code.
- Make changes in the `src/web/client/` directory as needed.
- For CLI operations, use the `PacWrapper` abstraction.

## Folder Structure

```text
src/
└── web/
    └── client/
```

- `client/`: Contains the client-side code for the web extension.

## Coding Guidelines

- **Indentation**: 4 spaces, no tabs.
- **Arrow functions**: Prefer `=>` over anonymous functions.
- **Braces**: Always use braces for loops/conditionals, on the same line.
- **Naming**: PascalCase for types/enums, camelCase for functions/properties/variables, UPPER_CASE for constants.
- **Strings**: "double quotes" for user-facing strings (externalized via `vscode-nls`), 'single quotes' for internal strings.
- **Comments**: Use JSDoc style for functions, interfaces, enums, and classes.
- **Localization**: All user-visible strings must be externalized.

## Building the Extension

To build the web extension, run:

```sh
gulp ci
```

This will compile the extension and output the necessary files.

## Testing

- **Unit tests**: Located in `src/web/client/test/unit/`
- **Integration tests**: Located in `src/web/client/test/integration/`
- **Frameworks**: Mocha (describe/it), Chai (expect), Sinon (stubs/spies)
- **Running tests**:

  ```sh
  npm run test-web-integration
  ```

- Mock dependencies extensively for unit tests.

## Power Platform Patterns

- **Telemetry**: Use `oneDSLoggerWrapper` for all events, defined in `src/common/OneDSLoggerTelemetry/telemetryConstants.ts`.

## Contributing

1. Fork the repository and create a new branch for your feature or bugfix.
2. Make your changes in `src/web/client/` and, if needed, in `src/common/` for shared utilities and services which can be used across web and desktop.
3. Follow coding and testing guidelines above.
4. Submit a pull request with a clear description of your changes.
5. The main difference between web and desktop extension is that desktop extension runs in a Node.js environment, while the web extension runs in a browser-like environment. This affects how certain APIs and modules can be used.

## Troubleshooting

- Ensure your Node.js and npm versions are up to date.
- Check for missing dependencies in `package.json`.
- Review error messages in the terminal for guidance.
- For build/test issues, consult architecture and coding guidelines above.
