# Power Platform Extension

**PRE-RELEASE SOFTWARE.** The software is a pre-release version. It may not work the way a final version of the software will.
We may change it for the final, commercial version. We also may not release a commercial version.

[![PullRequest](https://github.com/microsoft/powerplatform-vscode/workflows/PullRequest/badge.svg)](https://github.com/microsoft/powerplatform-vscode/actions?query=workflow%3APullRequest)
[![Official Build](https://dev.azure.com/dynamicscrm/OneCRM/_apis/build/status/DPX-Tools/powerplatform-vscode%20Official%20Build?branchName=release/stable)](https://dev.azure.com/dynamicscrm/OneCRM/_build/latest?definitionId=12152)

The Power Platform extension makes it easy to manage Power Platform environments and allows the
developer to create, build and deploy Power Platform solutions, packages and portals.

Installing this extension will also make the latest Power Platform CLI (aka pac) available in your VSCode terminal.

![VSCode Terminal with pac CLI](https://github.com/microsoft/powerplatform-vscode/blob/main/src/client/assets/pac-CLI-in-terminal.png?raw=true)

## Release Notes
0.2.33:
 - pac CLI 1.12.1 (February refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

0.2.32:
 - pac CLI 1.11.8 (Fixes a regression in `pac solution check`)

0.2.31:
 - pac CLI 1.11.6 (Dec/Jan refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - fixed installation issue for Windows 11 Insider builds due to deprecation of WMIC

0.2.27:
 - pac CLI 1.10.4 (November refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - .NET 6 on Apple M1: pac CLI is targeting dotnetCore 5 for intel, but the .NET6 amd64 installer removes the net5 and x64 support.  Users who have installed .NET 6 will need to uninstall all existing .NET bits and then install **both** the amd64 (Apple M1) and the x64 .NET 6 SDKs side by side.
    - Documentation on this .NET issue can be found at [.NET Support for macOS 11 and Windows 11 for Arm64 and x64](https://github.com/dotnet/sdk/issues/22380)
    - Users who only have .NET 5.0 installed do not need to take any action.

0.2.23:
  - pac CLI 1.9.8 (August refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - added pac CLI Linux support in terminal: on Windows 10, remote connect to WSL terminal (<https://code.visualstudio.com/docs/remote/wsl>)

0.2.19:
  - shortened the extension's friendly name
  - pac CLI 1.9.4 (July refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - macOS: 'pac auth create' interactive login now works

0.2.14:
 - pac CLI 1.8.6 (pcf-scripts npm pkg hot fix for June refresh)

0.2.13:
 - pac CLI 1.8.5 (June refresh)
 - added more Power Platform CLI command palette entries
 - PA Portal editing support:
   - Enhanced grammar to support include and editable tags
   - Support multiple portal root folders for multi-rooted VSCode workspaces

0.2.9:
 - pac CLI 1.7.x, same as installed/updated via MSI/nuget.org

0.2.8:

- initial public preview:
  - pac CLI installed and runnable in VSCode terminal (cmd, PS, pwsh, git bash, any macOS shell like zsh, fish)
  - PA Portal language services and auto complete
- known issues:
  - macOS: no good check if the required separate install of dotnetCore 3.x or 5.x is present


## Requirements

- VSCode >= 1.5x
- .NET Windows 4.x
- macOS: dotnetCore SDK 3.x or 5.x

## Getting Started

Open the VS Code Terminal (Terminal | New Terminal) and type in:

```bash
> pac
Microsoft PowerApps CLI
Version: 1.6.6+g0d22892

Usage: pac [admin] [auth] [canvas] [help] [org] [package] [paportal] [pcf] [plugin] [solution] [telemetry]

  admin                       Work with your PowerPlatform Admin Account
  auth                        Manage how you authenticate to various services
  canvas                      Operating with Power Apps .msapp files
  help                        Show help for the Microsoft PowerApps CLI
  org                         Work with your Dataverse Organization
  package                     Commands for working with Dataverse package projects
  paportal                    Commands for working with PowerApps portal website
  pcf                         Commands for working with PowerApps component framework projects
  plugin                      Commands for working with Dataverse plugin class library
  solution                    Commands for working with Dataverse solution projects
  telemetry                   Manage telemetry settings
```

The pac CLI will show you the available command nouns with a short description. To get detailed help for each noun, use the built-int help screens for each command, e.g.:

```bash
> pac solution
Microsoft PowerApps CLI
Version: 1.6.6+g0d22892

Error: You are missing a sub-command.

Usage: pac solution [init] [add-reference] [list] [version] [import] [export] [clone] [publish] [upgrade] [add-license] [check]

  init                        Initializes a directory with a new Dataverse solution project
  add-reference               Adds a reference from the project in the current directory to the project at 'path'
  list                        List all Solutions from the current Dataverse Organization
  version                     Patch version for solution
  import                      Import the Dataverse Solution project output into the current Dataverse Organization
  export                      Export a Dataverse Solution project from the current Dataverse Organization
  clone                       Create a solution project based on an existing solution in your Organization
  publish                     Publishes all customizations
  upgrade                     Option to stage the Dataverse solution for upgrade
  add-license                 Add license and plan info to solution
  check                       Upload a Dataverse Solution project to run against the PowerApps Checker Service

```

To then view all solutions installed in the selected environment:

```bash
> pac solution list
Connected to...gintonic
Listing all Solutions from the current Dataverse Organization...

 Index   Unique Name                    Friendly Name                                    Version

 [1]     Crd854a                        Common Data Services Default Solution            1.0.0.0
 [2]     imgDecode                      imgDecode                                        0.1.0
 [3]     acctpluginSample               acct-pluginSample                                1.0.0.4
 [4]     imgTest2                       imgTest2                                         0.1
 [5]     MicrosoftPortalDependencies    Dynamics 365 Portals - Portal dependencies       9.2.2103.0
```

## Feedback & Questions

Please use the issues tracker in the home repo: <https://github.com/microsoft/powerplatform-vscode/issues>

## Contributing

**PRE-RELEASE SOFTWARE.**

This project will welcome contributions and suggestions in the near future. But in this early preview stage, we're not ready for contributions.

See details in [CONTRIBUTING](CONTRIBUTING.md)

### Code of Conduct

See details in [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md)

### Security issues

Please report any security concerns or issues as described in this [SECURITY](SECURITY.md) document.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project
must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
