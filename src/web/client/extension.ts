/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "./WebExtensionContext";
import {
    PORTALS_URI_SCHEME,
    PUBLIC,
    IS_FIRST_RUN_EXPERIENCE,
    queryParameters,
} from "./common/constants";
import { PortalsFS } from "./dal/fileSystemProvider";
import {
    checkMandatoryParameters,
    removeEncodingFromParameters,
    showErrorDialog,
} from "./common/errorHandler";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import { convertStringtoBase64 } from "./utilities/commonUtil";
import { NPSService } from "./services/NPSService";
import { vscodeExtAppInsightsResourceProvider } from "../../common/telemetry-generated/telemetryConfiguration";
import { NPSWebView } from "./webViews/NPSWebView";
import { MyWebview } from "./webViews/MyWebView";
import { IContainerData } from "./utilities/copresenceUtil";

export function activate(context: vscode.ExtensionContext): void {
    console.log("vscode extension activate function start");
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
                )
                    return;

                removeEncodingFromParameters(queryParamsMap);
                WebExtensionContext.setWebExtensionContext(
                    entity,
                    entityId,
                    queryParamsMap
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
                            {
                                WebExtensionContext.telemetry.sendExtensionInitQueryParametersTelemetry(
                                    queryParamsMap
                                );

                                const isFirstRun = context.globalState.get(
                                    IS_FIRST_RUN_EXPERIENCE,
                                    true
                                );
                                if (isFirstRun) {
                                    vscode.commands.executeCommand(
                                        `workbench.action.openWalkthrough`,
                                        `microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted`,
                                        false
                                    );
                                    context.globalState.update(
                                        IS_FIRST_RUN_EXPERIENCE,
                                        false
                                    );
                                    WebExtensionContext.telemetry.sendInfoTelemetry(
                                        "StartCommand",
                                        {
                                            commandId:
                                                "workbench.action.openWalkthrough",
                                            walkthroughId:
                                                "microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted",
                                        }
                                    );
                                }
                                await vscode.window.withProgress(
                                    {
                                        location:
                                            vscode.ProgressLocation
                                                .Notification,
                                        cancellable: true,
                                        title: vscode.l10n.t(
                                            "Fetching your file ..."
                                        ),
                                    },
                                    async () => {
                                        await portalsFS.readDirectory(
                                            WebExtensionContext.rootDirectory
                                        );
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
                            showErrorDialog(
                                vscode.l10n.t(
                                    "There was a problem opening the workspace"
                                ),
                                vscode.l10n.t("Unable to find that app")
                            );
                    }
                } else {
                    showErrorDialog(
                        vscode.l10n.t(
                            "There was a problem opening the workspace"
                        ),
                        vscode.l10n.t("Unable to find that app")
                    );
                    return;
                }
            }
        )
    );
    console.log("vscode extension activate registerCommand success");

    processWillSaveDocument(context);
    console.log("vscode extension activate processWillSaveDocument success");

    // Create a webview panel
    const view = new MyWebview(context.extensionUri);
    view.show();

    processOpenActiveTextEditor(context, view.panel);
    console.log(
        "vscode extension activate processOpenActiveTextEditor success"
    );

    showWalkthrough(context, WebExtensionContext.telemetry);
    console.log("vscode extension activate function end");
}

export function processOpenActiveTextEditor(
    context: vscode.ExtensionContext,
    panel: vscode.WebviewPanel
) {
    console.log("Inside processOpenActiveTextEditor");
    try {
        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(async (event) => {
                const selection = event.selections[0];
                const line = selection.active.line;
                const column = selection.active.character;
                console.log("Inside onDidChangeTextEditorSelection");

                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor) {
                    const entityId =
                        WebExtensionContext.fileDataMap.getFileMap.get(
                            activeEditor.document.uri.fsPath
                        )?.entityId as string;
                    if (entityId) {
                        panel.webview.onDidReceiveMessage((message) => {
                            if (message.type === "hello") {
                                console.log(
                                    `Received hello from webview: ${message.payload}`
                                );
                                // Send a greeting back to the webview
                                panel.webview.postMessage({
                                    type: "greeting",
                                    payload: "Hello, webview!",
                                });
                            }
                        });

                        // send data to webview
                        panel.webview.postMessage({
                            containerId: WebExtensionContext.containerId,
                            lineNumber: line,
                            columnNumber: column,
                        } as IContainerData);

                        console.log(`Line: ${line}`);
                        console.log(`Column: ${column}`);
                    }
                }
            })
        );
    } catch (error) {
        console.log("caught error in processOpenActiveTextEditor", error);
    }
}

export function processWillSaveDocument(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument((e) => {
            const fileName = e.document.fileName;
            if (vscode.window.activeTextEditor === undefined) {
                return;
            } else if (isActiveDocument(fileName)) {
                const fileData =
                    WebExtensionContext.fileDataMap.getFileMap.get(fileName);
                // Update the latest content in context
                if (fileData?.entityId && fileData.attributePath) {
                    let fileContent = e.document.getText();
                    if (fileData.encodeAsBase64 as boolean) {
                        fileContent = convertStringtoBase64(fileContent);
                    }
                    WebExtensionContext.entityDataMap.updateEntityColumnContent(
                        fileData?.entityId,
                        fileData.attributePath,
                        fileContent
                    );
                    WebExtensionContext.fileDataMap.updateDirtyChanges(
                        fileName,
                        true
                    );
                }
            }
        })
    );
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

function isActiveDocument(fileName: string): boolean {
    return (
        vscode.workspace.workspaceFolders !== undefined &&
        WebExtensionContext.isContextSet &&
        WebExtensionContext.fileDataMap.getFileMap.has(fileName)
    );
}
