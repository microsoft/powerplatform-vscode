/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "./WebExtensionContext";
import {
    PORTALS_URI_SCHEME,
    PUBLIC,
    queryParameters,
    IS_MULTIFILE_FIRST_RUN_EXPERIENCE,
    ARTEMIS_RESPONSE_FAILED,
} from "./common/constants";
import { PortalsFS } from "./dal/fileSystemProvider";
import {
    checkMandatoryParameters,
    removeEncodingFromParameters,
} from "./common/errorHandler";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import { getEnvironmentIdFromUrl, isCoPresenceEnabled, updateFileContentInFileDataMap } from "./utilities/commonUtil";
import { NPSService } from "./services/NPSService";
import { NPSWebView } from "./webViews/NPSWebView";
import {
    getFileEntityId,
    getFileEntityName,
    getFileRootWebPageId,
} from "./utilities/fileAndEntityUtil";
import { IEntityInfo } from "./common/interfaces";
import { webExtensionTelemetryEventNames } from "../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { PowerPagesNavigationProvider } from "./webViews/powerPagesNavigationProvider";
import * as copilot from "../../common/copilot/PowerPagesCopilot";
import { IOrgInfo } from "../../common/copilot/model";
import { copilotNotificationPanel, disposeNotificationPanel } from "../../common/copilot/welcome-notification/CopilotNotificationPanel";
import { COPILOT_NOTIFICATION_DISABLED, EXTENSION_VERSION_KEY } from "../../common/copilot/constants";
import * as Constants from "./common/constants"
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { GeoNames } from "../../common/OneDSLoggerTelemetry/telemetryConstants";
import { sendingMessageToWebWorkerForCoPresence } from "./utilities/collaborationUtils";
import { ECSFeaturesClient } from "../../common/ecs-features/ecsFeatureClient";
import { PowerPagesAppName, PowerPagesClientName } from "../../common/ecs-features/constants";
import { ArtemisService } from "../../common/services/ArtemisService";
import { showErrorDialog } from "../../common/utilities/errorHandlerUtil";
import { EXTENSION_ID } from "../../common/constants";
import { getECSOrgLocationValue } from "../../common/utilities/Utils";
import { authenticateUserInVSCode } from "../../common/services/AuthenticationProvider";

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    oneDSLoggerWrapper.instantiate(GeoNames.US);
    WebExtensionContext.setVscodeWorkspaceState(context.workspaceState);

    WebExtensionContext.telemetry.sendInfoTelemetry("activated");

    await authenticateUserInVSCode(); //Authentication for extension

    const portalsFS = new PortalsFS();
    context.subscriptions.push(
        vscode.workspace.registerFileSystemProvider(
            PORTALS_URI_SCHEME,
            portalsFS,
            { isCaseSensitive: true }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args) => {
                WebExtensionContext.telemetry.sendInfoTelemetry(
                    "StartCommand",
                    {
                        commandId:
                            "microsoft-powerapps-portals.webExtension.init",
                    }
                );

                const { appName, entity, entityId, searchParams } = args;
                const queryParamsMap = new Map<string, string>();

                if (searchParams) {
                    const queryParams = new URLSearchParams(searchParams);
                    for (const pair of queryParams.entries()) {
                        queryParamsMap.set(
                            pair[0].trim().toLowerCase(),
                            pair[1].trim()
                        );
                    }
                }
                if (
                    !checkMandatoryParameters(
                        appName,
                        queryParamsMap
                    )
                ) {
                    return;
                }

                removeEncodingFromParameters(queryParamsMap);
                WebExtensionContext.setWebExtensionContext(
                    entity,
                    entityId,
                    queryParamsMap,
                    context.extensionUri
                );

                const orgId = queryParamsMap.get(queryParameters.ORG_ID) as string;
                await fetchArtemisData(orgId);
                WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_ORG_GEO, { orgId: orgId, orgGeo: WebExtensionContext.geoName });
                oneDSLoggerWrapper.instantiate(WebExtensionContext.geoName, WebExtensionContext.geoLongName);

                WebExtensionContext.telemetry.sendExtensionInitPathParametersTelemetry(
                    appName,
                    entity,
                    entityId
                );

                await showSiteVisibilityDialog();

                if (appName) {
                    switch (appName) {
                        case "portal":
                        case "pages":
                            {
                                WebExtensionContext.telemetry.sendExtensionInitQueryParametersTelemetry(
                                    queryParamsMap
                                );

                                processWalkthroughFirstRunExperience(context);

                                await vscode.window.withProgress(
                                    {
                                        location: vscode.ProgressLocation.Notification,
                                        cancellable: true,
                                        title: vscode.l10n.t("Fetching your file ..."),
                                    },
                                    async () => {
                                        await portalsFS.readDirectory(WebExtensionContext.rootDirectory, true);

                                        // Initialize ECS config in webExtensionContext
                                        await ECSFeaturesClient.init(
                                            {
                                                AppName: PowerPagesAppName,
                                                EnvID: WebExtensionContext.environmentId,
                                                UserID: WebExtensionContext.userId,
                                                TenantID: queryParamsMap.get(queryParameters.TENANT_ID) as string,
                                                Region: queryParamsMap.get(queryParameters.REGION) as string,
                                                Location: queryParamsMap.get(queryParameters.GEO) as string
                                            },
                                            PowerPagesClientName);

                                        registerCopilot(context);
                                        processWillStartCollaboration(context);
                                    }
                                );

                                powerPagesNavigation();

                                await NPSService.setEligibility();
                                if (WebExtensionContext.npsEligibility) {
                                    NPSWebView.createOrShow(
                                        context.extensionUri
                                    );
                                }
                            }
                            break;
                        default:
                            {
                                showErrorDialog(
                                    vscode.l10n.t(
                                        "There was a problem opening the workspace"
                                    ),
                                    vscode.l10n.t("Unable to find that app")
                                );

                                WebExtensionContext.telemetry.sendErrorTelemetry(
                                    webExtensionTelemetryEventNames.WEB_EXTENSION_APP_NAME_NOT_FOUND,
                                    activate.name,
                                    `appName:${appName}`
                                );
                            }
                    }
                } else {
                    showErrorDialog(
                        vscode.l10n.t(
                            "There was a problem opening the workspace"
                        ),
                        vscode.l10n.t("Unable to find that app")
                    );

                    WebExtensionContext.telemetry.sendErrorTelemetry(
                        webExtensionTelemetryEventNames.WEB_EXTENSION_APP_NAME_NOT_FOUND,
                        activate.name,
                        `appName:${appName}`
                    );
                    return;
                }
            }
        )
    );

    processWorkspaceStateChanges(context);

    processWillSaveDocument(context);

    enableFileSearchFunctionality(context, portalsFS);

    enableTextSearchFunctionality(context, portalsFS);

    showWalkthrough(context, WebExtensionContext.telemetry);

    processActiveTextEditorChange(context);
}

export function enableTextSearchFunctionality(context: vscode.ExtensionContext, portalsFS: PortalsFS) {
    const textSearchProvider = vscode.workspace.registerTextSearchProvider(PORTALS_URI_SCHEME, {
        provideTextSearchResults: async (query, options, progress) => {
            return portalsFS.searchTextResults(query, options, progress);
        },
    });

    context.subscriptions.push(vscode.Disposable.from(textSearchProvider));
}

export function enableFileSearchFunctionality(context: vscode.ExtensionContext, portalsFS: PortalsFS) {
    const fileSearchProvider = vscode.workspace.registerFileSearchProvider(PORTALS_URI_SCHEME, {
        provideFileSearchResults: async (query) => {
            return portalsFS.searchFiles(query.pattern);
        },
    });

    context.subscriptions.push(vscode.Disposable.from(fileSearchProvider));
}

export function registerCollaborationView() {
    vscode.window.registerTreeDataProvider('powerpages.collaborationView', WebExtensionContext.userCollaborationProvider);
    vscode.commands.registerCommand(
        "powerpages.collaboration.openTeamsChat",
        (event) => {
            WebExtensionContext.openTeamsChat(event.id)
        }
    );
    vscode.commands.registerCommand(
        "powerpages.collaboration.openMail",
        (event) => {
            WebExtensionContext.openMail(event.id)
        }
    );
}

export function powerPagesNavigation() {
    const powerPagesNavigationProvider = new PowerPagesNavigationProvider();
    vscode.window.registerTreeDataProvider('powerpages.powerPagesFileExplorer', powerPagesNavigationProvider);
    vscode.commands.registerCommand('powerpages.powerPagesFileExplorer.powerPagesRuntimePreview', () => powerPagesNavigationProvider.previewPowerPageSite());
    vscode.commands.registerCommand('powerpages.powerPagesFileExplorer.backToStudio', () => powerPagesNavigationProvider.backToStudio());
    WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_POWER_PAGES_WEB_VIEW_REGISTERED);
}

export function processWalkthroughFirstRunExperience(context: vscode.ExtensionContext) {
    const isMultifileFirstRun = context.globalState.get(
        IS_MULTIFILE_FIRST_RUN_EXPERIENCE,
        true
    );
    if (isMultifileFirstRun && WebExtensionContext.showMultifileInVSCode) {
        vscode.commands.executeCommand(
            `workbench.action.openWalkthrough`,
            `microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted-multiFile`,
            false
        );
        context.globalState.update(
            IS_MULTIFILE_FIRST_RUN_EXPERIENCE,
            false
        );
        WebExtensionContext.telemetry.sendInfoTelemetry(
            "StartCommand",
            {
                commandId:
                    "workbench.action.openWalkthrough",
                walkthroughId:
                    "microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted-multiFile",
            }
        );
    }
}

export function processWorkspaceStateChanges(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.tabGroups.onDidChangeTabs((event) => {
            event.opened.concat(event.changed).forEach(tab => {
                if (tab.input instanceof vscode.TabInputCustom || tab.input instanceof vscode.TabInputText) {
                    const document = tab.input;
                    const entityInfo: IEntityInfo = {
                        entityId: getFileEntityId(document.uri.fsPath),
                        entityName: getFileEntityName(document.uri.fsPath),
                        rootWebPageId: getFileRootWebPageId(document.uri.fsPath),
                    };
                    if (entityInfo.entityId && entityInfo.entityName) {
                        context.workspaceState.update(document.uri.fsPath, entityInfo);
                        WebExtensionContext.updateVscodeWorkspaceState(document.uri.fsPath, entityInfo);

                        if (isCoPresenceEnabled() && tab.input instanceof vscode.TabInputCustom) {
                            // sending message to webworker event listener for Co-Presence feature
                            sendingMessageToWebWorkerForCoPresence(entityInfo);
                            WebExtensionContext.quickPickProvider.refresh();
                        }
                    }
                }
            });

            event.closed.forEach(tab => {
                if (tab.input instanceof vscode.TabInputCustom || tab.input instanceof vscode.TabInputText) {
                    const document = tab.input;
                    context.workspaceState.update(document.uri.fsPath, undefined);
                    WebExtensionContext.updateVscodeWorkspaceState(document.uri.fsPath, undefined);
                }
            });
        })
    );
}

export function processActiveTextEditorChange(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor((editor) => {
            if (editor) {
                const document = editor.document;
                const entityInfo: IEntityInfo = {
                    entityId: getFileEntityId(document.uri.fsPath),
                    entityName: getFileEntityName(document.uri.fsPath),
                    rootWebPageId: getFileRootWebPageId(document.uri.fsPath),
                };
                if (entityInfo.entityId && entityInfo.entityName && isCoPresenceEnabled()) {
                    // sending message to webworker event listener for Co-Presence feature
                    sendingMessageToWebWorkerForCoPresence(entityInfo);
                }

                WebExtensionContext.quickPickProvider.refresh();
            }
        })
    );
}

// This function will not be triggered for image file content update
// Image file content write to images needs to be handled in writeFile call directly
export function processWillSaveDocument(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument(async (e) => {
            const fileFsPath = e.document.fileName;

            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (isActiveDocument(fileFsPath)) {
                updateFileContentInFileDataMap(fileFsPath, e.document.getText());
            }
        })
    );
}

export function processWillStartCollaboration(context: vscode.ExtensionContext) {
    if (isCoPresenceEnabled()) {
        registerCollaborationView();
        vscode.commands.registerCommand('powerPlatform.previewCurrentActiveUsers', () => WebExtensionContext.quickPickProvider.showQuickPick());
        createWebWorkerInstance(context);
    }
}

export function createWebWorkerInstance(
    context: vscode.ExtensionContext
) {
    try {
        const webworkerMain = vscode.Uri.joinPath(
            context.extensionUri,
            "dist",
            "web",
            "webworker.worker.js"
        );

        const workerUrl = new URL(webworkerMain.toString());

        WebExtensionContext.getWorkerScript(workerUrl)
            .then((workerScript) => {
                const workerBlob = new Blob([workerScript], {
                    type: "application/javascript",
                });

                const urlObj = URL.createObjectURL(workerBlob);

                WebExtensionContext.setWorker(new Worker(urlObj));

                if (WebExtensionContext.worker !== undefined) {
                    WebExtensionContext.worker.onmessage = (event) => {
                        const { data } = event;

                        WebExtensionContext.containerId = event.data.containerId;

                        if (data.type === Constants.workerEventMessages.REMOVE_CONNECTED_USER) {
                            WebExtensionContext.removeConnectedUserInContext(
                                data.userId,
                                data.removeConnectionData
                            );
                            WebExtensionContext.userCollaborationProvider.refresh();
                            WebExtensionContext.quickPickProvider.refresh();
                        }
                        if (data.type === Constants.workerEventMessages.UPDATE_CONNECTED_USERS) {
                            WebExtensionContext.updateConnectedUsersInContext(
                                data.containerId,
                                data.userName,
                                data.userId,
                                data.connectionData
                            );

                            if (data.currentConnectionId) {
                                WebExtensionContext.setCurrentConnectionId(data.currentConnectionId);
                            }

                            WebExtensionContext.userCollaborationProvider.refresh();
                            WebExtensionContext.quickPickProvider.refresh();
                        }
                        if (data.type === Constants.workerEventMessages.SEND_INFO_TELEMETRY) {
                            WebExtensionContext.telemetry.sendInfoTelemetry(
                                data.eventName,
                                data?.userId ? { userId: data.userId } : {}
                            );
                        }
                        if (data.type === Constants.workerEventMessages.SEND_ERROR_TELEMETRY) {
                            WebExtensionContext.telemetry.sendErrorTelemetry(
                                data.eventName,
                                data.methodName,
                                data?.errorMessage,
                                data?.error
                            );
                        }
                    };
                }

                const entityInfo = context.workspaceState.get(vscode.window.activeTextEditor?.document.uri.fsPath as string) as IEntityInfo;
                if (entityInfo.rootWebPageId === undefined || entityInfo.rootWebPageId === "" || entityInfo.rootWebPageId === " ") {
                    entityInfo.rootWebPageId = getFileRootWebPageId(vscode.window.activeTextEditor?.document.uri.fsPath as string);
                }

                // sending message to webworker for initial workspace
                sendingMessageToWebWorkerForCoPresence(entityInfo);
            })

        WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_WEB_WORKER_REGISTERED);
    } catch (error) {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_WEB_WORKER_REGISTRATION_FAILED,
            createWebWorkerInstance.name,
            Constants.WEB_EXTENSION_WEB_WORKER_REGISTRATION_FAILED,
            error as Error);
    }
}

export async function showSiteVisibilityDialog() {
    if (
        WebExtensionContext.urlParametersMap.get(
            queryParameters.SITE_VISIBILITY
        ) === PUBLIC
    ) {
        const edit: vscode.MessageItem = {
            isCloseAffordance: true,
            title: vscode.l10n.t("Edit the site"),
        };
        const siteMessage = vscode.l10n.t(
            "Be careful making changes. Anyone can see the changes you make immediately. Choose Edit the site to make edits, or close the editor tab to cancel without editing."
        );
        const options = { detail: siteMessage, modal: true };
        await vscode.window.showWarningMessage(
            vscode.l10n.t("You are editing a live, public site "),
            options,
            edit
        );
    }
}

export function showWalkthrough(
    context: vscode.ExtensionContext,
    telemetry: WebExtensionTelemetry
) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "powerplatform-walkthrough.overview-learn-more",
            async () => {
                telemetry.sendInfoTelemetry("StartCommand", {
                    commandId: "powerplatform-walkthrough.overview-learn-more",
                });
                vscode.env.openExternal(
                    vscode.Uri.parse(
                        "https://go.microsoft.com/fwlink/?linkid=2207914"
                    )
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "powerplatform-walkthrough.fileSystem-documentation",
            async () => {
                telemetry.sendInfoTelemetry("StartCommand", {
                    commandId:
                        "powerplatform-walkthrough.fileSystem-documentation",
                });
                vscode.env.openExternal(
                    vscode.Uri.parse(
                        "https://go.microsoft.com/fwlink/?linkid=2206616"
                    )
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "powerplatform-walkthrough.fileSystem-open-folder",
            async () => {
                telemetry.sendInfoTelemetry("StartCommand", {
                    commandId:
                        "powerplatform-walkthrough.fileSystem-open-folder",
                });
                vscode.commands.executeCommand("workbench.view.explorer");
            }
        )
    );


    context.subscriptions.push(
        vscode.commands.registerCommand(
            "powerplatform-walkthrough.saveConflict-learn-more",
            async () => {
                telemetry.sendInfoTelemetry("StartCommand", {
                    commandId:
                        "powerplatform-walkthrough.saveConflict-learn-more",
                });
                vscode.env.openExternal(
                    vscode.Uri.parse(
                        "https://go.microsoft.com/fwlink/?linkid=2241221"
                    )
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "powerplatform-walkthrough.advancedCapabilities-learn-more",
            async () => {
                telemetry.sendInfoTelemetry("StartCommand", {
                    commandId:
                        "powerplatform-walkthrough.advancedCapabilities-learn-more",
                });
                vscode.env.openExternal(
                    vscode.Uri.parse(
                        "https://go.microsoft.com/fwlink/?linkid=2206366"
                    )
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "powerplatform-walkthrough.advancedCapabilities-start-coding",
            async () => {
                telemetry.sendInfoTelemetry("StartCommand", {
                    commandId:
                        "powerplatform-walkthrough.advancedCapabilities-start-coding",
                });
                vscode.window.showTextDocument(
                    WebExtensionContext.defaultFileUri
                );
            }
        )
    );
}

export function registerCopilot(context: vscode.ExtensionContext) {
    try {
        const orgInfo = {
            orgId: WebExtensionContext.urlParametersMap.get(
                queryParameters.ORG_ID
            ) as string,
            environmentId: getEnvironmentIdFromUrl(),
            environmentName: "",
            activeOrgUrl: WebExtensionContext.urlParametersMap.get(queryParameters.ORG_URL) as string,
            tenantId: WebExtensionContext.urlParametersMap.get(queryParameters.TENANT_ID) as string,
        } as IOrgInfo;

        const copilotPanel = new copilot.PowerPagesCopilot(context.extensionUri,
            context,
            undefined,
            orgInfo);

        context.subscriptions.push(vscode.window.registerWebviewViewProvider(copilot.PowerPagesCopilot.viewType, copilotPanel, {
            webviewOptions: {
                retainContextWhenHidden: true,
            }
        }));

        showNotificationForCopilot(context, orgInfo.orgId);
    } catch (error) {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_WEB_COPILOT_REGISTRATION_FAILED,
            registerCopilot.name,
            (error as Error)?.message,
            error as Error);
    }
}

function showNotificationForCopilot(context: vscode.ExtensionContext, orgId: string) {
    if (vscode.workspace.getConfiguration('powerPlatform').get('experimental.enableWebCopilot') === false) {
        return;
    }

    const currentVersion = vscode.extensions.getExtension(EXTENSION_ID)?.packageJSON.version;
    const storedVersion = context.globalState.get(EXTENSION_VERSION_KEY);

    if (!storedVersion || storedVersion !== currentVersion) {
        // Show notification panel for the first load or after an update
        WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_WEB_COPILOT_NOTIFICATION_SHOWN,
            { orgId: orgId });
        const telemetryData = JSON.stringify({ orgId: orgId });
        copilotNotificationPanel(context, telemetryData);

        // Update the stored version to the current version
        context.globalState.update(EXTENSION_VERSION_KEY, currentVersion);
        return;
    }

    const isCopilotNotificationDisabled = context.globalState.get(COPILOT_NOTIFICATION_DISABLED, false);
    if (!isCopilotNotificationDisabled) {
        WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_WEB_COPILOT_NOTIFICATION_SHOWN,
            { orgId: orgId });
        const telemetryData = JSON.stringify({ orgId: orgId });
        copilotNotificationPanel(context, telemetryData);
    }
}

export async function deactivate(): Promise<void> {
    const telemetry = WebExtensionContext.telemetry;
    if (telemetry) {
        telemetry.sendInfoTelemetry("End");
    }
    disposeNotificationPanel();
}

function isActiveDocument(fileFsPath: string): boolean {
    return (
        vscode.workspace.workspaceFolders !== undefined &&
        WebExtensionContext.isContextSet &&
        WebExtensionContext.fileDataMap.getFileMap.has(fileFsPath)
    );
}

async function fetchArtemisData(orgId: string) {
    const artemisResponse = await ArtemisService.getArtemisResponse(orgId, "");
    if (artemisResponse === null || artemisResponse.response === null) {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_ARTEMIS_RESPONSE_FAILED,
            fetchArtemisData.name,
            ARTEMIS_RESPONSE_FAILED
        );
        return;
    }

    WebExtensionContext.geoName = artemisResponse.response.geoName;
    WebExtensionContext.geoLongName = artemisResponse.response.geoLongName;
    WebExtensionContext.serviceEndpointCategory = artemisResponse.stamp;
    WebExtensionContext.clusterLocation = getECSOrgLocationValue(artemisResponse.response.clusterName, artemisResponse.response.clusterNumber);
}
