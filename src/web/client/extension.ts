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
} from "./common/constants";
import { PortalsFS } from "./dal/fileSystemProvider";
import {
    checkMandatoryParameters,
    removeEncodingFromParameters,
    showErrorDialog,
} from "./common/errorHandler";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import { convertContentToString, isCoPresenceEnabled } from "./utilities/commonUtil";
import { NPSService } from "./services/NPSService";
import { vscodeExtAppInsightsResourceProvider } from "../../common/telemetry-generated/telemetryConfiguration";
import { NPSWebView } from "./webViews/NPSWebView";
import {
    updateFileDirtyChanges,
    updateEntityColumnContent,
    getFileEntityId,
    getFileEntityName,
} from "./utilities/fileAndEntityUtil";
import { IContainerData ,IEntityInfo } from "./common/interfaces";
import { telemetryEventNames } from "./telemetry/constants";
import { TreeWebViewProvider } from "./webViews/TreeWebViewProvider";
import * as Constants from "./common/constants";

export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    // TODO: Determine how to determine the user's dataBoundary
    const dataBoundary = undefined;
    const appInsightsResource =
        vscodeExtAppInsightsResourceProvider.GetAppInsightsResourceForDataBoundary(
            dataBoundary
        );
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
                    queryParamsMap
                );
                WebExtensionContext.setVscodeWorkspaceState(context.workspaceState);
                WebExtensionContext.telemetry.sendExtensionInitPathParametersTelemetry(
                    appName,
                    entity,
                    entityId
                );

                await showSiteVisibilityDialog();

                if (appName) {
                    switch (appName) {
                        case "portal":
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
                                    }
                                );

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
        vscode.workspace.onDidOpenTextDocument((textDocument) => {
            const entityInfo: IEntityInfo = {
                entityId: getFileEntityId(textDocument.uri.fsPath),
                entityName: getFileEntityName(textDocument.uri.fsPath)
            };
            context.workspaceState.update(textDocument.uri.fsPath, entityInfo);
            WebExtensionContext.updateVscodeWorkspaceState(textDocument.uri.fsPath, entityInfo);
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((textDocument) => {
            context.workspaceState.update(textDocument.uri.fsPath, undefined);
            WebExtensionContext.updateVscodeWorkspaceState(textDocument.uri.fsPath, undefined);
        })
    );
}

export function processWillSaveDocument(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument(async (e) => {
            const fileFsPath = e.document.fileName;

            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (isActiveDocument(fileFsPath)) {
                const fileData =
                    WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath);

                // Update the latest content in context
                if (fileData?.entityId && fileData.attributePath) {
                    let fileContent = e.document.getText();
                    fileContent = convertContentToString(fileContent, fileData.encodeAsBase64 as boolean);
                    updateEntityColumnContent(
                        fileData?.entityId,
                        fileData.attributePath,
                        fileContent
                    );
                    updateFileDirtyChanges(fileFsPath, true);
                }
            }
        })
    );
}

let copresenceWorker: Worker;

export function processWillStartCollaboartion(
    context: vscode.ExtensionContext
) {
    if (isCoPresenceEnabled()) {
        const treeWebView: TreeWebViewProvider = new TreeWebViewProvider();
        processOpenActiveTextEditor(context);
        createCopresenceWorkerInstance(context, treeWebView);
    }
}

export function createCopresenceWorkerInstance(
    context: vscode.ExtensionContext,
    treeWebView: TreeWebViewProvider
) {
    // Create a worker for the copresence feature
    const copresenceMain = vscode.Uri.joinPath(
        context.extensionUri,
        "dist/web/copresenceWorker.worker.js"
    );

    const workerUrl = new URL(copresenceMain.toString());
    fetch(workerUrl)
        .then((response) => response.text())
        .then((workerScript) => {
            const workerBlob = new Blob([workerScript], {
                type: "application/javascript",
            });

            const workerUrl = URL.createObjectURL(workerBlob);

            copresenceWorker = new Worker(workerUrl);

            copresenceWorker.onmessage = (event) => {
                const { data } = event;

                WebExtensionContext.containerId = event.data.containerId;

                if (data.type === "member-removed") {
                    WebExtensionContext.removeConnectedUserInContext(
                        data.userId
                    );

                    treeWebView.refresh();
                }
                if (data.type === "client-data") {
                    WebExtensionContext.updateConnectedUsersInContext(
                        data.containerId,
                        data.fileName,
                        data.filePath,
                        data.userName,
                        data.userId
                    );

                    treeWebView.refresh();
                }
            };
        })
        .catch((error) =>
            WebExtensionContext.telemetry.sendErrorTelemetry(
                telemetryEventNames.WEB_EXTENSION_CO_PRESENCE_WORKER_ERROR,
                createCopresenceWorkerInstance.name,
                error
            )
        );
}

export function processOpenActiveTextEditor(context: vscode.ExtensionContext) {
    try {
        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(async () => {
                const activeEditor = vscode.window.activeTextEditor;

                const swpId = WebExtensionContext.sharedWorkSpaceMap.get(
                    Constants.sharedWorkspaceParameters.SHAREWORKSPACE_ID
                ) as string;

                const swptenantId = WebExtensionContext.sharedWorkSpaceMap.get(
                    Constants.sharedWorkspaceParameters.TENANT_ID
                ) as string;

                const swpAccessToken =
                    WebExtensionContext.sharedWorkSpaceMap.get(
                        Constants.sharedWorkspaceParameters.ACCESS_TOKEN
                    ) as string;

                const discoveryendpoint =
                    WebExtensionContext.sharedWorkSpaceMap.get(
                        Constants.sharedWorkspaceParameters.DISCOVERY_ENDPOINT
                    ) as string;

                if (activeEditor) {
                    const entityId =
                        WebExtensionContext.fileDataMap.getFileMap.get(
                            activeEditor.document.uri.fsPath
                        )?.entityId as string;
                    const fileName =
                        WebExtensionContext.fileDataMap.getFileMap.get(
                            activeEditor.document.uri.fsPath
                        )?.fileName;

                    if (entityId) {
                        copresenceWorker.postMessage({
                            afrConfig: {
                                swpId,
                                swptenantId,
                                discoveryendpoint,
                                swpAccessToken,
                            },
                            file: {
                                fileName: fileName,
                                filePath: activeEditor.document.uri.fsPath,
                            },
                            containerId: WebExtensionContext.containerId,
                        } as IContainerData);
                    }
                }
            })
        );
    } catch (error) {
        let message = "unknown error";

        if (error instanceof Error) {
            message = error.message;
        }

        WebExtensionContext.telemetry.sendErrorTelemetry(
            telemetryEventNames.WEB_EXTENSION_PROCESS_OPEN_ACTIVE_EDITOR_ERROR,
            processOpenActiveTextEditor.name,
            message
        );
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

export async function deactivate(): Promise<void> {
    const telemetry = WebExtensionContext.telemetry;
    if (telemetry) {
        telemetry.sendInfoTelemetry("End");
    }
}

function isActiveDocument(fileFsPath: string): boolean {
    return (
        vscode.workspace.workspaceFolders !== undefined &&
        WebExtensionContext.isContextSet &&
        WebExtensionContext.fileDataMap.getFileMap.has(fileFsPath)
    );
}
