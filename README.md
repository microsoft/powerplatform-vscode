# Power Platform VS Code Extension

**PRE-RELEASE SOFTWARE.** The software is a pre-release version. It may not work the way a final version of the software will.
We may change it for the final, commercial version. We also may not release a commercial version.

[![PullRequest](https://github.com/microsoft/powerplatform-vscode/workflows/PullRequest/badge.svg)](https://github.com/microsoft/powerplatform-vscode/actions?query=workflow%3APullRequest)
[![Official Build](https://dev.azure.com/dynamicscrm/OneCRM/_apis/build/status/DPX-Tools/powerplatform-vscode%20Official%20Build?branchName=release/stable)](https://dev.azure.com/dynamicscrm/OneCRM/_build/latest?definitionId=12152)

The Power Platform extension makes it easy to manage Power Platform environments and allows the
developer to create, build and deploy Power Platform solutions, packages and portals.

Installing this extension will also make the latest Power Platform CLI (aka pac) available in your VSCode terminal.

![VSCode Terminal with pac CLI](https://github.com/microsoft/powerplatform-vscode/blob/main/src/client/assets/pac-CLI-in-terminal.png?raw=true)

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
