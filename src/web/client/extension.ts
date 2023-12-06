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
    showErrorDialog,
} from "./common/errorHandler";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import { isCoPresenceEnabled, updateFileContentInFileDataMap } from "./utilities/commonUtil";
import { NPSService } from "./services/NPSService";
import { vscodeExtAppInsightsResourceProvider } from "../../common/telemetry-generated/telemetryConfiguration";
import { NPSWebView } from "./webViews/NPSWebView";
import {
    getFileEntityId,
    getFileEntityName,
} from "./utilities/fileAndEntityUtil";
import { IEntityInfo } from "./common/interfaces";
import { telemetryEventNames } from "./telemetry/constants";
import { PowerPagesNavigationProvider } from "./webViews/powerPagesNavigationProvider";
import * as copilot from "../../common/copilot/PowerPagesCopilot";
import { IOrgInfo } from "../../common/copilot/model";
import { copilotNotificationPanel, disposeNotificationPanel } from "../../common/copilot/welcome-notification/CopilotNotificationPanel";
import { COPILOT_NOTIFICATION_DISABLED } from "../../common/copilot/constants";
import * as Constants from "./common/constants"
import { fetchArtemisResponse } from "../../common/ArtemisService";

export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    // TODO: Determine how to determine the user's dataBoundary
    const dataBoundary = undefined;
    const appInsightsResource =
        vscodeExtAppInsightsResourceProvider.GetAppInsightsResourceForDataBoundary(
            dataBoundary
        );
    WebExtensionContext.setVscodeWorkspaceState(context.workspaceState);
    WebExtensionContext.telemetry.setTelemetryReporter(
        context.extension.id,
        context.extension.packageJSON.version,
        appInsightsResource
    );
    context.subscriptions.push(
        WebExtensionContext.telemetry.getTelemetryReporter()
    );

    WebExtensionContext.telemetry.sendInfoTelemetry("activated");
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
                        entity,
                        entityId,
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

                                powerPagesNavigation();

                                await vscode.window.withProgress(
                                    {
                                        location: vscode.ProgressLocation.Notification,
                                        cancellable: true,
                                        title: vscode.l10n.t("Fetching your file ..."),
                                    },
                                    async () => {
                                        await portalsFS.readDirectory(WebExtensionContext.rootDirectory, true);
                                        registerCopilot(context);
                                    }
                                );

                                await NPSService.setEligibility();
                                if (WebExtensionContext.npsEligibility) {
                                    NPSWebView.createOrShow(
                                        context.extensionUri
                                    );
                                }

                                await logArtemisTelemetry();
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
                                    telemetryEventNames.WEB_EXTENSION_APP_NAME_NOT_FOUND,
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
                        telemetryEventNames.WEB_EXTENSION_APP_NAME_NOT_FOUND,
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

    processWillStartCollaboartion(context);

    showWalkthrough(context, WebExtensionContext.telemetry);
}

export function powerPagesNavigation() {
    const powerPagesNavigationProvider = new PowerPagesNavigationProvider();
    vscode.window.registerTreeDataProvider('powerpages.powerPagesFileExplorer', powerPagesNavigationProvider);
    vscode.commands.registerCommand('powerpages.powerPagesFileExplorer.powerPagesRuntimePreview', () => powerPagesNavigationProvider.previewPowerPageSite());
    vscode.commands.registerCommand('powerpages.powerPagesFileExplorer.backToStudio', () => powerPagesNavigationProvider.backToStudio());
    WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_POWER_PAGES_WEB_VIEW_REGISTERED);
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
                        rootWebPageId: WebExtensionContext.entityDataMap.getEntityMap.get(getFileEntityId(document.uri.fsPath))?.rootWebPageId as string
                    };
                    if (entityInfo.entityId && entityInfo.entityName) {
                        context.workspaceState.update(document.uri.fsPath, entityInfo);
                        WebExtensionContext.updateVscodeWorkspaceState(document.uri.fsPath, entityInfo);

                        // sending message to webworker event listener for Co-Presence feature
                        if (isCoPresenceEnabled()) {
                            if (WebExtensionContext.worker !== undefined) {
                                WebExtensionContext.worker.postMessage({
                                    afrConfig: {
                                        swpId: WebExtensionContext.sharedWorkSpaceMap.get(
                                            Constants.sharedWorkspaceParameters.SHAREWORKSPACE_ID
                                        ) as string,
                                        swptenantId: WebExtensionContext.sharedWorkSpaceMap.get(
                                            Constants.sharedWorkspaceParameters.TENANT_ID
                                        ) as string,
                                        discoveryendpoint: WebExtensionContext.sharedWorkSpaceMap.get(
                                            Constants.sharedWorkspaceParameters.DISCOVERY_ENDPOINT
                                        ) as string,
                                        swpAccessToken: WebExtensionContext.sharedWorkSpaceMap.get(
                                            Constants.sharedWorkspaceParameters.ACCESS_TOKEN
                                        ) as string,
                                    },
                                    entityInfo
                                });
                            }
                            WebExtensionContext.quickPickProvider.updateQuickPickItems(entityInfo);
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

export function processWillStartCollaboartion(context: vscode.ExtensionContext) {
    // feature in progress, hence disabling it
    if (isCoPresenceEnabled()) {
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
                                data.userId
                            );
                        }
                        if (data.type === Constants.workerEventMessages.UPDATE_CONNECTED_USERS) {
                            WebExtensionContext.updateConnectedUsersInContext(
                                data.containerId,
                                data.userName,
                                data.userId,
                                data.entityId
                            );
                        }
                    };
                }
            })

        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_WEB_WORKER_REGISTERED);
    } catch (error) {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_WEB_WORKER_REGISTRATION_FAILED,
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
            environmentName: "",
            activeOrgUrl: WebExtensionContext.urlParametersMap.get(queryParameters.ORG_URL) as string,
            tenantId: WebExtensionContext.urlParametersMap.get(queryParameters.TENANT_ID) as string,
        } as IOrgInfo;

        const copilotPanel = new copilot.PowerPagesCopilot(context.extensionUri,
            context,
            WebExtensionContext.telemetry.getTelemetryReporter(),
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
            telemetryEventNames.WEB_EXTENSION_WEB_COPILOT_REGISTRATION_FAILED,
            registerCopilot.name,
            (error as Error)?.message,
            error as Error);
    }
}

function showNotificationForCopilot(context: vscode.ExtensionContext, orgId: string) {
    if (vscode.workspace.getConfiguration('powerPlatform').get('experimental.enableWebCopilot') === false) {
        return;
    }

    const isCopilotNotificationDisabled = context.globalState.get(COPILOT_NOTIFICATION_DISABLED, false);
    if (!isCopilotNotificationDisabled) {
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_WEB_COPILOT_NOTIFICATION_SHOWN,
            { orgId: orgId });

        const telemetryData = JSON.stringify({ orgId: orgId });
        copilotNotificationPanel(context, WebExtensionContext.telemetry.getTelemetryReporter(), telemetryData);
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

async function logArtemisTelemetry() {

    try {
        const orgId = WebExtensionContext.urlParametersMap.get(
            queryParameters.ORG_ID
        ) as string

        const artemisResponse = await fetchArtemisResponse(orgId, WebExtensionContext.telemetry.getTelemetryReporter());

        if (!artemisResponse) {
            return;
        }

        const { geoName } = artemisResponse[0];
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_ARTEMIS_RESPONSE,
            { orgId: orgId, geoName: String(geoName) });
    } catch (error) {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_ARTEMIS_RESPONSE_FAILED,
            logArtemisTelemetry.name,
            ARTEMIS_RESPONSE_FAILED);
    }
}
