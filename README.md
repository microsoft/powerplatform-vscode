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

Please report any security concerns or issues as described in [SECURITY](SECURITY.md) document.

## Trademarks

This project may contain trademarks or logos for projects, products, or services. Authorized use of Microsoft
trademarks or logos is subject to and must follow [Microsoft's Trademark & Brand Guidelines](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks/usage/general).
Use of Microsoft trademarks or logos in modified versions of this project
must not cause confusion or imply Microsoft sponsorship.
Any use of third-party trademarks or logos are subject to those third-party's policies.
