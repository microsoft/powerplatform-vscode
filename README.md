# Power Platform Extension

[![PullRequest](https://github.com/microsoft/powerplatform-vscode/workflows/PullRequest/badge.svg)](https://github.com/microsoft/powerplatform-vscode/actions?query=workflow%3APullRequest)
[![Official Build](https://dev.azure.com/dynamicscrm/OneCRM/_apis/build/status/DPX-Tools/powerplatform-vscode%20Official%20Build?branchName=release/stable)](https://dev.azure.com/dynamicscrm/OneCRM/_build/latest?definitionId=12152)

The Power Platform extension makes it easy to manage Power Platform environments and allows the
developer to create, build and deploy Power Platform solutions, packages and portals.

Installing this extension will also make the latest Power Platform CLI (aka pac) available in your VSCode terminal.

![VSCode Terminal with pac CLI](https://github.com/microsoft/powerplatform-vscode/blob/main/src/client/assets/pac-CLI-in-terminal.png?raw=true)

## "Power Platform CLI Exposed" Series

[Daniel Laskewitz](https://github.com/Laskewitz) talks with members of our team about PAC CLI, Solutions, Power Pages, Data & Tool, Pipelines, and PCF

[![Power Platform CLI Exposed](https://img.youtube.com/vi/NkoWGF8a4aQ/0.jpg)](https://www.youtube.com/playlist?list=PLlrxD0HtieHhEdLHxQOU96ySSZpMCyAxf)

[Power Platform CLI Exposed](https://www.youtube.com/playlist?list=PLlrxD0HtieHhEdLHxQOU96ySSZpMCyAxf)

## Release Notes

2.0.25:
  - pac CLI 1.30.3, (January 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

2.0.25:
  - pac CLI 1.29.11, (Update to October refresh to fix data import/export and paportal upload/download commands. See release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

2.0.21:
  - pac CLI 1.29.6 (October refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

2.0.13:
  - pac CLI 1.28.3 (September refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Web Extension updates:
    - Now Supporting image edit capability using Vscode extensions for Image editing (supported file extensions are png, jpg, webp, bmp, tga, ico, dib, jif, jpe, tpic, jpe, jpeg) #733
    - File explorer now supports Power Pages actions for "Going back to Power pages Studio" and "Preview" of site's runtime instance. #697
    - On browser refresh, Improved support for pre-emptive loading of image files active in editor. #736

2.0.11:
  - pac CLI 1.27.5 (August refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - (Preview) Added 'Copilot in Power Pages' to Web Extension

2.0.7:
  - QFE for styling files load for new data model schema

2.0.6:
  - QFE for styles rendering of power pages sites

2.0.4:
  - pac CLI 1.26.6 (QFE for `pac paportal bootstrap-migrate`)

2.0.3:
  - pac CLI 1.26.5 (July refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Authentication Settings - Can now choose other Azure clouds for the "New Auth Profile" button to target [#619](https://github.com/microsoft/powerplatform-vscode/pull/619)
  - Environments & Solutions panel improvements:
    - Environments now display an icon for the active environment, and button added to select a different environment [#629](https://github.com/microsoft/powerplatform-vscode/pull/629)
    - Solutions now have tooltip and icon to indicated managed vs. unmanaged solutions [#618](https://github.com/microsoft/powerplatform-vscode/pull/618)
  - (Preview) Added AI code generation assistance with Power Pages Copilot
    - Only supports vscode on the desktop currently, not available in the web extension
  - Web Extension updates:
    - Conflict resolution optimization for incoming changes accept scenario [#664](https://github.com/microsoft/powerplatform-vscode/pull/664)
    - Optimized load of webfiles for old data model - media files are now loaded only on view a specific file action [#662](https://github.com/microsoft/powerplatform-vscode/pull/662)
    - Performance optimizations and better support for revisit sessions file load [#646](https://github.com/microsoft/powerplatform-vscode/pull/646) [#668](https://github.com/microsoft/powerplatform-vscode/pull/668) [#669](https://github.com/microsoft/powerplatform-vscode/pull/669)

2.0.0:
  - pac CLI 1.25.2 (June refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Power Pages site code edit support - in VScode web extension - for components like forms, content snippets, lists, and more
  - Enhanced Power Pages (paportal) download to have CSS, JS and HTML files as placeholders always.
  - Power Pages (paportal) commands to have better error handling for deployment profiles and unsupported web-files.

1.1.28:
  - pac CLI 1.24.3 (May refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Linux and Mac - PAC switched to the [CrossPlat Dotnet Tool version](https://www.nuget.org/packages/Microsoft.PowerApps.CLI.Tool) from the x64 architectured  [Linux x64](https://www.nuget.org/packages/Microsoft.PowerApps.CLI.Core.linux-x64) and [OSx x64](https://www.nuget.org/packages/Microsoft.PowerApps.CLI.Core.osx-x64) versions
    - Apple Silicon arm64 machines (M1/M2) should no longer need the x64 version of the net6.0 SDK, just the ARM version
    - Windows still uses the [Windows-only net48 version](https://www.nuget.org/packages/Microsoft.PowerApps.CLI), as there are still some verbs such as `pac data` which have full .NET Framework dependencies
  - Optimized conflict detection for co-edits in VS Code for web

1.1.27:
  - pac CLI 1.23.3 (Apr refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Conflict resolution support for co-edits in VS Code for web

1.1.25:
  - pac CLI 1.22.4 (see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

1.1.24:
  - hotfix to pac CLI 1.22.3 for `pac solution unpack` placing AppModule files in invalid directory

1.1.23:
 - pac CLI 1.22.2 (Mar refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - Improved Paportal manifest generation by maintaining a consistent order

1.1.19:
 - pac CLI 1.21.13 (Feb refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - Desktop extension now supports create, delete and rename for power pages site entities like webpage, webfile, templates and content-snippets
 - Enhanced intellisense support - Auto-complete for Dataverse entity tags, template tags, filters, portal-specific liquid objects & their attributes

1.1.16:
 - pac CLI 1.21.8 (Dec refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

1.1.14:
 - pac CLI 1.21.4 (Nov refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - support for new data model for Power Pages in Studio web extension

1.1.9:
 - pac CLI 1.20.3 (Oct refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

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

- VSCode >= 1.73.0
- Windows: .NET 4.8
- macOS/Linux/WSL: [.NET 6.0+ SDK](https://dotnet.microsoft.com/en-us/download/dotnet/6.0)

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
