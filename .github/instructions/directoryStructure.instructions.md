---
applyTo: "**"
description: Directory Structure Overview
---
Provide a brief overview of the directory structure for the Power Platform VS Code extension. This will help in understanding where to find specific components and how the project is organized.

## Directory Structure Overview

Directory structure:
└── microsoft-powerplatform-vscode/
    ├── README.md
    ├── CHANGELOG.md
    ├── CODE_OF_CONDUCT.md
    ├── COMMUNITY.md
    ├── CONTRIBUTING.md
    ├── gulpfile.mjs
    ├── LICENSE
    ├── NOTICE.txt
    ├── package.json
    ├── package.nls.cs.json
    ├── package.nls.de.json
    ├── package.nls.es.json
    ├── package.nls.fr.json
    ├── package.nls.it.json
    ├── package.nls.ja.json
    ├── package.nls.json
    ├── package.nls.ko.json
    ├── package.nls.pt-br.json
    ├── package.nls.ru.json
    ├── package.nls.tr.json
    ├── package.nls.zh-cn.json
    ├── package.nls.zh-tw.json
    ├── PRIVACY.md
    ├── scorch
    ├── scorch.cmd
    ├── SECURITY.md
    ├── serve.json
    ├── tsconfig.json
    ├── webpack.config.js
    ├── .editorconfig
    ├── .eslintrc.js
    ├── .release-it.yaml
    ├── .vscodeignore
    ├── l10n/
    │   ├── bundle.l10n.cs.json
    │   ├── bundle.l10n.de.json
    │   ├── bundle.l10n.es.json
    │   ├── bundle.l10n.fr.json
    │   ├── bundle.l10n.it.json
    │   ├── bundle.l10n.ja.json
    │   ├── bundle.l10n.json
    │   ├── bundle.l10n.ko.json
    │   ├── bundle.l10n.pt-br.json
    │   ├── bundle.l10n.ru.json
    │   ├── bundle.l10n.tr.json
    │   ├── bundle.l10n.zh-cn.json
    │   └── bundle.l10n.zh-tw.json
    ├── loc/
    │   ├── translations-export/
    │   │   └── vscode-powerplatform.xlf
    │   └── translations-import/
    │       ├── vscode-powerplatform.cs.xlf
    │       ├── vscode-powerplatform.de.xlf
    │       ├── vscode-powerplatform.es.xlf
    │       ├── vscode-powerplatform.fr.xlf
    │       ├── vscode-powerplatform.it.xlf
    │       ├── vscode-powerplatform.ja.xlf
    │       ├── vscode-powerplatform.ko.xlf
    │       ├── vscode-powerplatform.pt-BR.xlf
    │       ├── vscode-powerplatform.ru.xlf
    │       ├── vscode-powerplatform.tr.xlf
    │       ├── vscode-powerplatform.zh-CN.xlf
    │       └── vscode-powerplatform.zh-TW.xlf
    ├── media/
    │   └── main.js
    ├── src/
    │   ├── client/
    │   │   ├── ArtemisContext.ts
    │   │   ├── extension.ts
    │   │   ├── OrgChangeNotifier.ts
    │   │   ├── PortalWebView.ts
    │   │   ├── uriHandler.ts
    │   │   ├── lib/
    │   │   │   ├── AuthPanelView.ts
    │   │   │   ├── CliAcquisition.ts
    │   │   │   ├── CliAcquisitionContext.ts
    │   │   │   ├── EnvAndSolutionTreeView.ts
    │   │   │   ├── GeneratorAcquisition.ts
    │   │   │   ├── PacActivityBarUI.ts
    │   │   │   └── PacTerminal.ts
    │   │   ├── pac/
    │   │   │   ├── PacContext.ts
    │   │   │   ├── PacTypes.ts
    │   │   │   ├── PacWrapper.ts
    │   │   │   └── PacWrapperContext.ts
    │   │   ├── portal_fileicons/
    │   │   │   ├── portals-icon-theme.json
    │   │   │   └── seti.woff
    │   │   ├── power-pages/
    │   │   │   ├── commonUtility.ts
    │   │   │   ├── constants.ts
    │   │   │   ├── fileSystemCallbacks.ts
    │   │   │   ├── fileSystemUpdatesUtility.ts
    │   │   │   ├── validationDiagnostics.ts
    │   │   │   ├── actions-hub/
    │   │   │   │   ├── ActionsHub.ts
    │   │   │   │   ├── ActionsHubCommandHandlers.ts
    │   │   │   │   ├── ActionsHubTreeDataProvider.ts
    │   │   │   │   ├── Constants.ts
    │   │   │   │   ├── CurrentSiteContext.ts
    │   │   │   │   ├── TelemetryHelper.ts
    │   │   │   │   ├── models/
    │   │   │   │   │   ├── IEnvironmentInfo.ts
    │   │   │   │   │   ├── IPowerPagesConfig.ts
    │   │   │   │   │   ├── IWebsiteInfo.ts
    │   │   │   │   │   ├── SiteVisibility.ts
    │   │   │   │   │   └── WebsiteStatus.ts
    │   │   │   │   └── tree-items/
    │   │   │   │       ├── ActionsHubTreeItem.ts
    │   │   │   │       ├── ActiveGroupTreeItem.ts
    │   │   │   │       ├── EnvironmentGroupTreeItem.ts
    │   │   │   │       ├── InactiveGroupTreeItem.ts
    │   │   │   │       ├── NoSitesTreeItem.ts
    │   │   │   │       ├── OtherSitesGroupTreeItem.ts
    │   │   │   │       └── SiteTreeItem.ts
    │   │   │   ├── bootstrapdiff/
    │   │   │   │   └── BootstrapDiff.ts
    │   │   │   ├── create/
    │   │   │   │   ├── Contentsnippet.ts
    │   │   │   │   ├── CreateCommandWrapper.ts
    │   │   │   │   ├── CreateOperationConstants.ts
    │   │   │   │   ├── CreateTypes.ts
    │   │   │   │   ├── PageTemplate.ts
    │   │   │   │   ├── Webfile.ts
    │   │   │   │   ├── Webpage.ts
    │   │   │   │   ├── WebTemplate.ts
    │   │   │   │   └── utils/
    │   │   │   │       ├── CommonUtils.ts
    │   │   │   │       └── DesktopFS.ts
    │   │   │   └── preview-site/
    │   │   │       ├── Constants.ts
    │   │   │       └── PreviewSite.ts
    │   │   ├── snippets/
    │   │   │   └── paportal-liquid.code-snippets
    │   │   ├── telemetry/
    │   │   │   ├── appdata.ts
    │   │   │   ├── batchedTelemetryAgent.ts
    │   │   │   └── localfileusersettings.ts
    │   │   └── test/
    │   │       ├── runTest.ts
    │   │       ├── Integration/
    │   │       │   ├── CliAcquisition.test.ts
    │   │       │   ├── CliAcquisitionContext.test.ts
    │   │       │   ├── commonUtility.test.ts
    │   │       │   ├── fakeFile.test.ts
    │   │       │   ├── index.ts
    │   │       │   ├── MockValidationDiagnosticsTextDoc.txt
    │   │       │   ├── PacWrapper.test.ts
    │   │       │   ├── validationDiagnostics.test.ts
    │   │       │   ├── WebsiteUtil.test.ts
    │   │       │   ├── pac/
    │   │       │   │   └── PacContext.test.ts
    │   │       │   └── power-pages/
    │   │       │       ├── actions-hub/
    │   │       │       │   ├── ActionsHub.test.ts
    │   │       │       │   ├── ActionsHubCommandHandlers.test.ts
    │   │       │       │   ├── ActionsHubTreeDataProvider.test.ts
    │   │       │       │   ├── TelemetryHelper.test.ts
    │   │       │       │   └── tree-items/
    │   │       │       │       ├── ActionsHubTreeItem.test.ts
    │   │       │       │       ├── ActiveGroupTreeItem.test.ts
    │   │       │       │       ├── EnvironmentGroupTreeItem.test.ts
    │   │       │       │       ├── InactiveGroupTreeItem.test.ts
    │   │       │       │       ├── NoSitesTreeItem.test.ts
    │   │       │       │       ├── OtherSitesGroupTreeItem.test.ts
    │   │       │       │       └── SiteTreeItem.test.ts
    │   │       │       ├── preview-site/
    │   │       │       │   └── PreviewSite.test.ts
    │   │       │       └── services/
    │   │       │           └── PPAPIServices.test.ts
    │   │       └── unit/
    │   │           └── BlockingQueue.test.ts
    │   ├── common/
    │   │   ├── constants.ts
    │   │   ├── ErrorConstants.ts
    │   │   ├── ErrorReporter.ts
    │   │   ├── TelemetryData.ts
    │   │   ├── chat-participants/
    │   │   │   ├── ChatParticipantUtils.ts
    │   │   │   ├── CommandRegistry.ts
    │   │   │   └── powerpages/
    │   │   │       ├── PowerPagesChatParticipant.ts
    │   │   │       ├── PowerPagesChatParticipantConstants.ts
    │   │   │       ├── PowerPagesChatParticipantTelemetryConstants.ts
    │   │   │       ├── PowerPagesChatParticipantTypes.ts
    │   │   │       ├── PowerPagesChatParticipantUtils.ts
    │   │   │       └── commands/
    │   │   │           └── create-site/
    │   │   │               ├── CreateSiteCommand.ts
    │   │   │               ├── CreateSiteConstants.ts
    │   │   │               ├── CreateSiteHelper.ts
    │   │   │               ├── CreateSiteTypes.ts
    │   │   │               ├── Nl2PageService.ts
    │   │   │               └── Nl2SiteService.ts
    │   │   ├── copilot/
    │   │   │   ├── constants.ts
    │   │   │   ├── dataverseMetadata.ts
    │   │   │   ├── IntelligenceApiService.ts
    │   │   │   ├── model.ts
    │   │   │   ├── PowerPagesCopilot.ts
    │   │   │   ├── assets/
    │   │   │   │   ├── scripts/
    │   │   │   │   │   └── copilot.js
    │   │   │   │   ├── styles/
    │   │   │   │   │   ├── codicon.css
    │   │   │   │   │   ├── codicon.ttf
    │   │   │   │   │   └── copilot.css
    │   │   │   │   └── walkthrough/
    │   │   │   │       └── Copilot-In-PowerPages.md
    │   │   │   ├── telemetry/
    │   │   │   │   ├── copilotTelemetry.ts
    │   │   │   │   ├── ITelemetry.ts
    │   │   │   │   └── telemetryConstants.ts
    │   │   │   ├── user-feedback/
    │   │   │   │   ├── CESSurvey.ts
    │   │   │   │   ├── constants.ts
    │   │   │   │   ├── feedback.css
    │   │   │   │   └── feedback.js
    │   │   │   ├── utils/
    │   │   │   │   └── copilotUtil.ts
    │   │   │   └── welcome-notification/
    │   │   │       ├── copilotNotification.css
    │   │   │       ├── copilotNotification.js
    │   │   │       └── CopilotNotificationPanel.ts
    │   │   ├── ecs-features/
    │   │   │   ├── constants.ts
    │   │   │   ├── ecsFeatureClient.ts
    │   │   │   ├── ecsFeatureFlagFilters.ts
    │   │   │   ├── ecsFeatureGates.ts
    │   │   │   ├── ecsFeatureProperties.ts
    │   │   │   ├── ecsFeatureUtil.ts
    │   │   │   └── ecsTelemetryConstants.ts
    │   │   ├── OneDSLoggerTelemetry/
    │   │   │   ├── EventContants.ts
    │   │   │   ├── IEventTypes.ts
    │   │   │   ├── ITelemetryLogger.ts
    │   │   │   ├── oneDSLogger.ts
    │   │   │   ├── oneDSLoggerWrapper.ts
    │   │   │   ├── shortNameMappingToAzureRegion.ts
    │   │   │   ├── telemetryConstants.ts
    │   │   │   ├── client/
    │   │   │   │   └── desktopExtensionTelemetryEventNames.ts
    │   │   │   ├── telemetry/
    │   │   │   │   └── telemetry.ts
    │   │   │   └── web/
    │   │   │       └── client/
    │   │   │           ├── webExtensionTelemetryEvents.ts
    │   │   │           └── webExtensionTelemetryInterface.ts
    │   │   ├── services/
    │   │   │   ├── ArtemisService.ts
    │   │   │   ├── AuthenticationProvider.ts
    │   │   │   ├── BAPService.ts
    │   │   │   ├── Constants.ts
    │   │   │   ├── Interfaces.ts
    │   │   │   ├── PPAPIService.ts
    │   │   │   └── TelemetryConstants.ts
    │   │   ├── telemetry/
    │   │   │   ├── buildRegionProd.ts
    │   │   │   └── buildRegionTip.ts
    │   │   └── utilities/
    │   │       ├── BlockingQueue.ts
    │   │       ├── EditableFileSystemProvider.ts
    │   │       ├── errorHandlerUtil.ts
    │   │       ├── MultiStepInput.ts
    │   │       ├── OrgHandlerUtils.ts
    │   │       ├── PacAuthUtil.ts
    │   │       ├── PathFinderUtil.ts
    │   │       ├── Utils.ts
    │   │       ├── WebsiteUtil.ts
    │   │       └── WorkspaceInfoFinderUtil.ts
    │   ├── debugger/
    │   │   ├── Readme.md
    │   │   ├── BundleLoader.ts
    │   │   ├── extension.ts
    │   │   ├── FileWatcher.ts
    │   │   ├── index.ts
    │   │   ├── RequestInterceptor.ts
    │   │   ├── SourceMapValidator.ts
    │   │   ├── utils.ts
    │   │   ├── browser/
    │   │   │   ├── BrowserArgsBuilder.ts
    │   │   │   ├── BrowserLocator.ts
    │   │   │   ├── BrowserManager.ts
    │   │   │   ├── index.ts
    │   │   │   └── types/
    │   │   │       ├── BrowserFlavor.ts
    │   │   │       ├── IBrowserPath.ts
    │   │   │       ├── index.ts
    │   │   │       └── Platform.ts
    │   │   ├── configuration/
    │   │   │   ├── ConfigurationManager.ts
    │   │   │   ├── index.ts
    │   │   │   ├── LaunchDebugProvider.ts
    │   │   │   ├── LaunchJsonConfigManager.ts
    │   │   │   ├── UserSettingsConfigManager.ts
    │   │   │   └── types/
    │   │   │       ├── DebugConfiguration.ts
    │   │   │       ├── FlattenType.ts
    │   │   │       ├── IDevToolsSettings.ts
    │   │   │       ├── index.ts
    │   │   │       ├── IPcfLaunchConfig.ts
    │   │   │       ├── IUserSettings.ts
    │   │   │       ├── LaunchDebugConfiguration.ts
    │   │   │       └── UserDataDir.ts
    │   │   ├── controlLocation/
    │   │   │   ├── ControlLocation.ts
    │   │   │   ├── ControlLocator.ts
    │   │   │   └── index.ts
    │   │   ├── debugAdaptor/
    │   │   │   ├── DebugAdaptorFactory.ts
    │   │   │   ├── Debugger.ts
    │   │   │   ├── DebugProtocolMessage.ts
    │   │   │   └── index.ts
    │   │   └── test/
    │   │       ├── helpers.ts
    │   │       ├── runTest.ts
    │   │       ├── integration/
    │   │       │   ├── BrowserArgsBuilder.test.ts
    │   │       │   ├── BrowserManager.test.ts
    │   │       │   ├── BundleLoader.test.ts
    │   │       │   ├── ControlLocator.test.ts
    │   │       │   ├── Debugger.test.ts
    │   │       │   ├── index.ts
    │   │       │   └── RequestInterceptor.test.ts
    │   │       └── unit/
    │   │           ├── SourceMapValidator.test.ts
    │   │           └── utils.test.ts
    │   ├── server/
    │   │   ├── HtmlServer.ts
    │   │   ├── YamlServer.ts
    │   │   ├── constants/
    │   │   │   ├── AutoComplete.ts
    │   │   │   └── PortalEnums.ts
    │   │   ├── lib/
    │   │   │   ├── LineReader.ts
    │   │   │   ├── LiquidAutoCompleteRule.ts
    │   │   │   ├── LiquidAutoCompleteRuleEngine.ts
    │   │   │   └── PortalManifestReader.ts
    │   │   ├── telemetry/
    │   │   │   └── ServerTelemetry.ts
    │   │   └── test/
    │   │       ├── Integration/
    │   │       │   └── LiquidAutoCompleteRuleEngine.test.ts
    │   │       └── unit/
    │   │           └── LineReader.test.ts
    │   ├── typings/
    │   │   ├── vscode.proposed.fileSearchProvider.d.ts
    │   │   └── vscode.proposed.textSearchProvider.d.ts
    │   └── web/
    │       └── client/
    │           ├── extension.ts
    │           ├── WebExtensionContext.ts
    │           ├── common/
    │           │   ├── constants.ts
    │           │   ├── DataverseTokenProvider.ts
    │           │   ├── errorHandler.ts
    │           │   ├── interfaces.ts
    │           │   └── worker/
    │           │       └── webworker.js
    │           ├── context/
    │           │   ├── entityData.ts
    │           │   ├── entityDataMap.ts
    │           │   ├── entityForeignKeyDataMap.ts
    │           │   ├── fileData.ts
    │           │   ├── fileDataMap.ts
    │           │   └── userDataMap.ts
    │           ├── dal/
    │           │   ├── concurrencyHandler.ts
    │           │   ├── fileSystemProvider.ts
    │           │   ├── remoteFetchProvider.ts
    │           │   └── remoteSaveProvider.ts
    │           ├── schema/
    │           │   ├── constants.ts
    │           │   ├── portalSchema.ts
    │           │   └── portalSchemaReader.ts
    │           ├── services/
    │           │   ├── etagHandlerService.ts
    │           │   ├── graphClientService.ts
    │           │   └── NPSService.ts
    │           ├── telemetry/
    │           │   └── webExtensionTelemetry.ts
    │           ├── test/
    │           │   ├── runTest.ts
    │           │   ├── integration/
    │           │   │   ├── AuthenticationProvider.test.ts
    │           │   │   ├── commonUtil.test.ts
    │           │   │   ├── errorHandler.test.ts
    │           │   │   ├── fileSystemProvider.test.ts
    │           │   │   ├── index.ts
    │           │   │   ├── portalSchemaReader.test.ts
    │           │   │   ├── remoteFetchProvider.test.ts
    │           │   │   ├── remoteSaveProvider.test.ts
    │           │   │   ├── schemaHelperUtil.test.ts
    │           │   │   ├── urlBuilderUtil.test.ts
    │           │   │   ├── WebExtensionContext.test.ts
    │           │   │   └── webExtensionTelemetry.test.ts
    │           │   └── unit/
    │           │       └── extension.test.ts
    │           ├── utilities/
    │           │   ├── collaborationUtils.ts
    │           │   ├── commonUtil.ts
    │           │   ├── dataBoundary.ts
    │           │   ├── deviceType.ts
    │           │   ├── fileAndEntityUtil.ts
    │           │   ├── folderHelperUtility.ts
    │           │   ├── schemaHelperUtil.ts
    │           │   └── urlBuilderUtil.ts
    │           └── webViews/
    │               ├── NPSWebView.ts
    │               ├── powerPagesNavigationProvider.ts
    │               ├── QuickPickProvider.ts
    │               └── userCollaborationProvider.ts
    ├── .azure-pipelines/
    │   └── OfficialBuild.yml
    └── .github/
        ├── CODEOWNERS
        ├── copilot-instructions.md
        └── workflows/
            ├── PullRequest.yml
            └── Snapshot.yml
