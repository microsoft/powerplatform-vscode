# Power Platform VS Code Extension

[![PullRequest](https://github.com/microsoft/powerplatform-vscode/workflows/PullRequest/badge.svg)](https://github.com/microsoft/powerplatform-vscode/actions?query=workflow%3APullRequest)
[![Official Build](https://dev.azure.com/dynamicscrm/OneCRM/_apis/build/status/DPX-Tools/powerplatform-vscode%20Official%20Build?branchName=release/stable)](https://dev.azure.com/dynamicscrm/OneCRM/_build/latest?definitionId=12152)

The Power Platform extension makes it easy to create, build and deploy Power Platform PCF controls, plugins and combine them to solutions and packages.

Installing this extension will also install the latest pac CLI for your OS and will make it available in your VSCode terminal.

![VSCode Terminal with pac CLI](assets\pac-CLI-in-terminal.png)

## Getting Started

Open the VS Code Terminal (Terminal | New Terminal) and type in:

```bash
> pac
Microsoft PowerApps CLI
Version: 1.4.4+g0574e87

Usage: pac [auth] [help] [org] [package] [pcf] [plugin] [solution] [telemetry]

  auth                        Manage how you authenticate to various services
  help                        Show help for the Microsoft PowerApps CLI
  org                         Work with your CDS Organization
  package                     Commands for working with CDS package projects
  pcf                         Commands for working with PowerApps component framework projects
  plugin                      Commands for working with CDS plugin class library
  solution                    Commands for working with CDS solution projects
  telemetry                   Manage telemetry settings
```

The pac CLI will show you the available command nouns with a short description. To get detailed help for each noun, just enter it after ```pac```, e.g.:

```bash
> pac solution list
Microsoft PowerApps CLI
Version: 1.4.4+g0574e87

Error: No profiles were found of kind CDS on this computer. Please run 'pac auth create --kind CDS' to create one.

Usage: list

  This command does not take any arguments.
```

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit <https://cla.opensource.microsoft.com>.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

## Setting Up Local Dev Environment

Windows, macOS or Linux:

- [Node.js LTS (currently v14)](https://nodejs.org/en/download/)
- gulp CLI: ```npm install -g gulp-cli```
- [git](https://git-scm.com/downloads)
- [VS Code](https://code.visualstudio.com/Download) or your different favorite editor
- recommended VSCode extensions:
  - [EditorConfig for VS Code (editorconfig.editorconfig)](https://github.com/editorconfig/editorconfig-vscode)
  - [ESLint (dbaeumer.vscode-eslint)](https://github.com/Microsoft/vscode-eslint)
  - [GitLens (eamodio.gitlens)](https://github.com/eamodio/vscode-gitlens)
  - [markdownlint (davidanson.vscode-markdownlint)](https://github.com/DavidAnson/vscode-markdownlint)

## Build and Run From Repo

Clone, restore modules, build and run:

```bash
git clone https://github.com/microsoft/powerplatform-vscode.git pp-vscode
cd pp-vscode
npm install
gulp ci
```

Open the local repository as folder in VS Code. To locally debug the extension, select the "Launch VSCode Extension" from the run/debug configurations and hit <F5>

### Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

### Security issues

Please report any security concerns or issues as described in this [SECURITY](SECURITY.md) document.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project
must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
