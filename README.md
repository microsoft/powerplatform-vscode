# Power Platform Extension

[![PullRequest](https://github.com/microsoft/powerplatform-vscode/workflows/PullRequest/badge.svg)](https://github.com/microsoft/powerplatform-vscode/actions?query=workflow%3APullRequest)
[![Official Build](https://dev.azure.com/dynamicscrm/OneCRM/_apis/build/status/DPX-Tools/powerplatform-vscode%20Official%20Build?branchName=release/stable)](https://dev.azure.com/dynamicscrm/OneCRM/_build/latest?definitionId=12152)

The Power Platform extension makes it easy to manage Power Platform environments and allows the
developer to create, build and deploy Power Platform solutions, packages and portals.

Installing this extension will also make the latest Power Platform CLI (aka pac) available in your VSCode terminal.

![VSCode Terminal with pac CLI](https://github.com/microsoft/powerplatform-vscode/blob/main/src/client/assets/pac-CLI-in-terminal.png?raw=true)

## Release Notes
1.1.5:
 - pac CLI 1.19.4 (QFE for Sept refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

1.1.4:
 - pac CLI 1.19.3 (Sept refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - fixes to Power Pages editing when hosted in vscode.dev (running as web extension)

1.1.2:
 - pac CLI 1.18.3 (Aug refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - added support for Power Pages editing when hosted in vscode.dev (running as web extension, no pac CLI supported)

1.0.21:
  - hotfix in pac CLI `pac paportal *` for #255

1.0.20:
 - PCF control debugging support in VS Code's debugger;
   see for early details: https://github.com/microsoft/powerplatform-vscode/pull/231
 - pac CLI 1.17.4 (July refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - when running on macOS on Apple Silicon (ARM M1/M2 CPU): make sure to also have the x64 version of the [.NET6 SDK](https://dotnet.microsoft.com/en-us/download) installed as well

1.0.16:
 - pac CLI 1.16.6 (May refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - the Power Platform panel now supports the new UNIVERSAL authentication kind that pac CLI 1.16.x introduced

1.0.9:
 - pac CLI 1.15.3 (April refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

1.0.5:
 - pac CLI 1.14.4 (March refresh QFE: pac admin backup: --notes parameter deprecated)

1.0.4:
 - pac CLI 1.14.1 (March refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

1.0.2:
 - pac CLI 1.13.6 (February refresh plus 2 fixes, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

1.0.1:
 - Extension is now released with General Availability
 - New Activity Pane for this extension that lets user managed PowerPlatform credentials and shows visible PP environments
 - pac CLI 1.13.4 (February refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

0.2.35:
 - pac CLI 1.12.2 (Dec/Jan refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

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
- macOS/Linux/WSL: dotnetCore SDK 5.x or 6.x

## Getting Started

Open the VS Code Terminal (Terminal | New Terminal) and type in:

```bash
> pac
Microsoft PowerPlatform CLI

Usage: pac [admin] [application] [auth] [canvas] [help] [org] [package] [paportal] [pcf] [plugin] [solution] [telemetry]

  admin                       Work with your PowerPlatform Admin Account
  application                 Commands for listing and installing available DataVerse applications from AppSource
  auth                        Manage how you authenticate to various services
  canvas                      Operating with Power Apps .msapp files
  help                        Show help for the Microsoft PowerPlatform CLI
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
> pac solution help
Microsoft PowerApps CLI

Usage: pac solution [init] [add-reference] [list] [delete] [online-version] [version] [import] [export] [clone] [publish] [upgrade] [add-license] [check] [create-settings] [pack] [unpack]

  init                        Initializes a directory with a new Dataverse solution project
  add-reference               Adds a reference from the project in the current directory to the project at 'path'
  list                        List all Solutions from the current Dataverse Organization
  delete                      Delete Dataverse Solution from the current Dataverse Environment
  online-version              Sets version for solution loaded in Dataverse environment.
  version                     Update build or revision version for solution
  import                      Import the Dataverse Solution into the current Dataverse Environment
  export                      Export a Dataverse Solution from the current Dataverse Environment
  clone                       Create a solution project based on an existing solution in your Organization
  publish                     Publishes all customizations
  upgrade                     Option to stage the Dataverse solution for upgrade
  add-license                 Add license and plan info to solution
  check                       Upload a Dataverse Solution project to run against the PowerApps Checker Service
  create-settings             Create a settings file from solution zip or solution folder.
  pack                        Package solution components on local filesystem into solution.zip (SolutionPackager)
  unpack                      Extract solution components from solution.zip onto local filesystem (SolutionPackager)
```

To then view all solutions installed in the selected environment:

```bash
> pac solution list
Connected to...vscode-test
Listing all Solutions from the current Dataverse Organization...

 Index      Unique Name                                        Friendly Name                                                Version


 [1]        Cr4323c                                            Common Data Services Default Solution                        1.0.0.0
```

## Feedback & Questions

Please use the issues tracker in the home repo: <https://github.com/microsoft/powerplatform-vscode/issues>

## Contributing

This project will welcome contributions in the near future. At this stage, we're not ready for contributions,
but do welcome your suggestions via this repository's issue tracker.

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
