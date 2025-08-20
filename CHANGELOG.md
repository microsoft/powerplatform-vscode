# Change Log - Power Platform Extension

## 2.0.94
- pac CLI 1.47.1, (see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Bug Fixes
  - Fixed issue where active sites appeared as inactive in Power Pages Actions for Sovereign Clouds.
  - Fixed duplicate webpage handling bug in VS Code web.

## 2.0.89
- pac CLI 1.44.2, (see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Reactivate inactive site support in Power Pages Actions (Desktop)

## 2.0.86
- pac CLI 1.43.6, (see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Bug Fixes
  - Fixed authentication flow for Copilot experiences on desktop.

## 2.0.84
- pac CLI 1.42.1, (see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Download/Upload support for code sites in Actions hub.
- Accessibility enhancements
- Improved efficiency of @powerpages calls.
- Bug Fixes
  - Updated authentication flow for VS Code desktop.

## 2.0.82
- pac CLI 1.41.1, (March 2025 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Accessibility enhancements
- Power Pages Actions for VS Code desktop.
- Bug Fixes
  - Fixed HTML document preview in VS Code desktop.


## 2.0.78
- pac CLI 1.39.3, (January 2025 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Bug Fixes
  - Accessibility enhancements
  - Fixed a minor content snippets related bug

## 2.0.76
- pac CLI 1.37.4, (November 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 2.0.74
- pac CLI 1.35.1, (September 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Bug Fixes
  - Copilot for Power Pages: "Not yet available in your region." [Issue #1046](https://github.com/microsoft/powerplatform-vscode/issues/1046) [Fix #1044](https://github.com/microsoft/powerplatform-vscode/pull/1044)
  - Power Pages generator installation issue [Issue #1018](https://github.com/microsoft/powerplatform-vscode/issues/1018) [Fix #1049](https://github.com/microsoft/powerplatform-vscode/pull/1049)

## 2.0.66
- pac CLI 1.34.4, (August 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Power Pages Chat participant release in GitHub Copilot Chat for Visual Studio Code
- Web extension updates
  - Bug Fixes
    - Dual authentication on Web extension

## 2.0.63
- pac CLI 1.33.5, (July 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Bug Fixes
  - HTML/YML server crash issue
- Web extension updates
  - Bug Fixes
    - Form steps not displayed for any Advanced form issue

## 2.0.59
- pac CLI 1.32.8, (May 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Web extension updates
  - Copilot available in public regions that has " Move data across regions" option enabled per [Turn on copilots and generative AI features](https://learn.microsoft.com/en-us/power-platform/admin/geographical-availability-copilot#turn-on-copilots-and-generative-ai-features-1)

## 2.0.49
- Web extension updates
  - Copresence support - Find out who's working on a site (Power Pages Studio and Power Pages VS Code for the Web) at the same time as you with copresence

## 2.0.41
- pac CLI 1.31.6, (February 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
- Web Extension updates:
  - Copilot available in United Kingdom, Europe and Australia regions
  - Copilot prompt response improved accuracy for Forms scenario
  - Text search functionality

## 2.0.31
  - pac CLI 1.30.7, (January 2024 refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Moved release notes to *CHANGELOG.md* file, per VS Code's [Marketplace integration](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#marketplace-integration) guidelines.
- Web Extension updates:
  - (Preview) Added AI Explain code assistance with Power Pages Copilot
  - File search is now supported based on file name
  - Power Pages - Fix for Enhanced data model multiple language webpage and content-snippet file load

## 2.0.25
  - pac CLI 1.29.11, (Update to October refresh to fix data import/export and paportal upload/download commands. See release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 2.0.21
  - pac CLI 1.29.6 (October refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 2.0.13
  - pac CLI 1.28.3 (September refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Web Extension updates:
    - Now Supporting image edit capability using Vscode extensions for Image editing (supported file extensions are png, jpg, webp, bmp, tga, ico, dib, jif, jpe, tpic, jpe, jpeg) #733
    - File explorer now supports Power Pages actions for "Going back to Power pages Studio" and "Preview" of site's runtime instance. #697
    - On browser refresh, Improved support for pre-emptive loading of image files active in editor. #736

## 2.0.11
  - pac CLI 1.27.5 (August refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - (Preview) Added 'Copilot in Power Pages' to Web Extension

## 2.0.7
  - QFE for styling files load for new data model schema

## 2.0.6
  - QFE for styles rendering of power pages sites

## 2.0.4
  - pac CLI 1.26.6 (QFE for `pac paportal bootstrap-migrate`)

## 2.0.3
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

## 2.0.0
  - pac CLI 1.25.2 (June refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Power Pages site code edit support - in VScode web extension - for components like forms, content snippets, lists, and more
  - Enhanced Power Pages (paportal) download to have CSS, JS and HTML files as placeholders always.
  - Power Pages (paportal) commands to have better error handling for deployment profiles and unsupported web-files.

## 1.1.28
  - pac CLI 1.24.3 (May refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Linux and Mac - PAC switched to the [CrossPlat Dotnet Tool version](https://www.nuget.org/packages/Microsoft.PowerApps.CLI.Tool) from the x64 architectured  [Linux x64](https://www.nuget.org/packages/Microsoft.PowerApps.CLI.Core.linux-x64) and [OSx x64](https://www.nuget.org/packages/Microsoft.PowerApps.CLI.Core.osx-x64) versions
    - Apple Silicon arm64 machines (M1/M2) should no longer need the x64 version of the net6.0 SDK, just the ARM version
    - Windows still uses the [Windows-only net48 version](https://www.nuget.org/packages/Microsoft.PowerApps.CLI), as there are still some verbs such as `pac data` which have full .NET Framework dependencies
  - Optimized conflict detection for co-edits in VS Code for web

## 1.1.27
  - pac CLI 1.23.3 (Apr refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - Conflict resolution support for co-edits in VS Code for web

## 1.1.25
  - pac CLI 1.22.4 (see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 1.1.24
  - hotfix to pac CLI 1.22.3 for `pac solution unpack` placing AppModule files in invalid directory

## 1.1.23
 - pac CLI 1.22.2 (Mar refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - Improved Paportal manifest generation by maintaining a consistent order

## 1.1.19
 - pac CLI 1.21.13 (Feb refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - Desktop extension now supports create, delete and rename for power pages site entities like webpage, webfile, templates and content-snippets
 - Enhanced intellisense support - Auto-complete for Dataverse entity tags, template tags, filters, portal-specific liquid objects & their attributes

## 1.1.16
 - pac CLI 1.21.8 (Dec refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 1.1.14
 - pac CLI 1.21.4 (Nov refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - support for new data model for Power Pages in Studio web extension

## 1.1.9
 - pac CLI 1.20.3 (Oct refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 1.1.4
 - pac CLI 1.19.3 (Sept refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - fixes to Power Pages editing when hosted in vscode.dev (running as web extension)

## 1.1.2
 - pac CLI 1.18.3 (Aug refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - added support for Power Pages editing when hosted in vscode.dev (running as web extension, no pac CLI supported)

## 1.0.21
  - hotfix in pac CLI `pac paportal *` for #255

## 1.0.20
 - PCF control debugging support in VS Code's debugger;
   see for early details: https://github.com/microsoft/powerplatform-vscode/pull/231
 - pac CLI 1.17.4 (July refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - when running on macOS on Apple Silicon (ARM M1/M2 CPU): make sure to also have the x64 version of the [.NET6 SDK](https://dotnet.microsoft.com/en-us/download) installed as well

## 1.0.16
 - pac CLI 1.16.6 (May refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - the Power Platform panel now supports the new UNIVERSAL authentication kind that pac CLI 1.16.x introduced

## 1.0.9
 - pac CLI 1.15.3 (April refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 1.0.5
 - pac CLI 1.14.4 (March refresh QFE: pac admin backup: --notes parameter deprecated)

## 1.0.4
 - pac CLI 1.14.1 (March refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 1.0.2
 - pac CLI 1.13.6 (February refresh plus 2 fixes, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 1.0.1
 - Extension is now released with General Availability
 - New Activity Pane for this extension that lets user managed PowerPlatform credentials and shows visible PP environments
 - pac CLI 1.13.4 (February refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 0.2.35
 - pac CLI 1.12.2 (Dec/Jan refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))

## 0.2.32
 - pac CLI 1.11.8 (Fixes a regression in `pac solution check`)

## 0.2.31
 - pac CLI 1.11.6 (Dec/Jan refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
 - fixed installation issue for Windows 11 Insider builds due to deprecation of WMIC

## 0.2.27
 - pac CLI 1.10.4 (November refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - .NET 6 on Apple M1: pac CLI is targeting dotnetCore 5 for intel, but the .NET6 amd64 installer removes the net5 and x64 support.  Users who have installed .NET 6 will need to uninstall all existing .NET bits and then install **both** the amd64 (Apple M1) and the x64 .NET 6 SDKs side by side.
    - Documentation on this .NET issue can be found at [.NET Support for macOS 11 and Windows 11 for Arm64 and x64](https://github.com/dotnet/sdk/issues/22380)
    - Users who only have .NET 5.0 installed do not need to take any action.

## 0.2.23
  - pac CLI 1.9.8 (August refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - added pac CLI Linux support in terminal: on Windows 10, remote connect to WSL terminal (<https://code.visualstudio.com/docs/remote/wsl>)

## 0.2.19
  - shortened the extension's friendly name
  - pac CLI 1.9.4 (July refresh, see release notes on [nuget.org](https://www.nuget.org/packages/Microsoft.PowerApps.CLI/))
  - macOS: 'pac auth create' interactive login now works

## 0.2.14
 - pac CLI 1.8.6 (pcf-scripts npm pkg hot fix for June refresh)

## 0.2.13
 - pac CLI 1.8.5 (June refresh)
 - added more Power Platform CLI command palette entries
 - PA Portal editing support:
   - Enhanced grammar to support include and editable tags
   - Support multiple portal root folders for multi-rooted VSCode workspaces

## 0.2.9
 - pac CLI 1.7.x, same as installed/updated via MSI/nuget.org

## 0.2.8
- initial public preview:
  - pac CLI installed and runnable in VSCode terminal (cmd, PS, pwsh, git bash, any macOS shell like zsh, fish)
  - PA Portal language services and auto complete
- known issues:
  - macOS: no good check if the required separate install of dotnetCore 3.x or 5.x is present
