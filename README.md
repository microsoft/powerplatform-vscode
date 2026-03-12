# Power Platform Tools for VS Code

[![PullRequest](https://github.com/microsoft/powerplatform-vscode/workflows/PullRequest/badge.svg)](https://github.com/microsoft/powerplatform-vscode/actions?query=workflow%3APullRequest)
[![Official Build](https://dev.azure.com/dynamicscrm/OneCRM/_apis/build/status/DPX-Tools/powerplatform-vscode%20Official%20Build?branchName=release/stable)](https://dev.azure.com/dynamicscrm/OneCRM/_build/latest?definitionId=12152)

The **Power Platform Tools** extension brings the full Power Platform development experience into VS Code. Create, build, and deploy Power Platform solutions, packages, and Power Pages sites — with the Power Platform CLI (pac) integrated directly into your terminal.

## Features

### Power Platform CLI (pac)

Installing this extension automatically provides the latest Power Platform CLI in your VS Code terminal. Use it to manage authentication, solutions, environments, PCF controls, packages, and more.

![VSCode Terminal with pac CLI](https://github.com/microsoft/powerplatform-vscode/blob/main/src/client/assets/pac-CLI-in-terminal.png?raw=true)

### Authentication & Environment Management

- **Auth Panel** — Create, select, and manage authentication profiles for your Power Platform environments directly from the Activity Bar.
- **Environment & Solutions Panel** — Browse connected environments, view installed solutions, and quickly copy environment details (URL, IDs, version numbers).

### Power Pages Development

- **Actions Hub** — A centralized tree view for managing Power Pages sites: download, upload, preview, and open sites in Power Pages Studio.
- **Site Comparison** — Compare local site files against the cloud environment with a full metadata diff view (tree or list), including HTML report generation and import/export.
- **File Creation Wizards** — Scaffold new webpages, web templates, content snippets, page templates, and web files from the command palette.
- **Bootstrap Diff** — Identify differences between your portal templates and the latest bootstrap updates.
- **Server Logic Debugging** — Debug and run Power Pages server logic files with mock SDK and custom mock data support.
- **CodeQL Security Screening** — Run CodeQL security analysis on your Power Pages sites directly from the Actions Hub.

### Copilot for Power Pages

An integrated VS Code chat participant (`@powerpages`) that helps you write code by describing your expected behavior in natural language. Generate JavaScript for form validation, Web API queries, Liquid templates, and more.

### PCF Control Debugging

Debug Power Apps component framework (PCF) controls with a built-in debugger that launches an Edge browser session connected to your Dataverse environment. Supports custom launch configurations, full-screen rendering mode, and browser profile management.

### Language Server Support

- **HTML/Liquid Language Server** — IntelliSense, autocompletion, and diagnostics for Liquid template files used in Power Pages.
- **YAML Language Server** — Schema validation and editing support for Power Platform YAML files.
- **Liquid Snippets** — Code snippets for common Liquid template patterns.

### VS Code for Web

The extension supports VS Code for the Web with a tailored experience including a Power Pages file explorer, real-time collaboration view (see who's editing the site), and a getting-started walkthrough.

## Requirements

- VS Code **1.91.0** or later
- [.NET 6.0+ SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0) (used to install the pac CLI as a dotnet tool)

## Getting Started

1. Install the extension from the [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=microsoft-IsvExpTools.powerplatform-vscode).
2. Open the **Power Platform** panel in the Activity Bar.
3. Create an authentication profile to connect to your environment.
4. Open the VS Code terminal and start using `pac`:

```
pac help
```

Use the built-in help for any command group:

```
pac solution help
pac power-pages help
pac auth help
```

## Extension Pack

This extension bundles the following extensions:

- [CodeQL](https://marketplace.visualstudio.com/items?itemName=github.vscode-codeql) — Security analysis for Power Pages sites
- [SARIF Viewer](https://marketplace.visualstudio.com/items?itemName=ms-sarifvscode.sarif-viewer) — View CodeQL and other analysis results

## Configuration

Key settings (available under `powerPlatform.*` in VS Code settings):

| Setting | Description |
|---|---|
| `powerPlatform.auth.cloud` | Target cloud environment (Public, USGov, USGovHigh, USGovDoD, China) |
| `powerPlatform.experimental.copilotEnabled` | Enable/disable Copilot for Power Pages (default: true) |
| `powerPlatform.experimental.enablePcfDebuggingFeatures` | Enable PCF debugging capabilities |
| `powerPlatform.experimental.defaultUrl` | Default PowerApps instance URL for debugging |
| `powerPlatform.experimental.browserFlavor` | Edge browser version for PCF debugging (Stable, Beta, Dev, Canary) |

## Feedback & Questions

Please file issues on the [GitHub issue tracker](https://github.com/microsoft/powerplatform-vscode/issues).

## Contributing

Contributions and suggestions are welcome. Most contributions require you to agree to a Contributor License Agreement (CLA). See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and details.

### Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

### Security

Please report security concerns as described in [SECURITY.md](SECURITY.md).

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project
must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
