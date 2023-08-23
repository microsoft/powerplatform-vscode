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
import * as Constants from "./common/constants";
import { DecorationManager } from "./webViews/DecorationCursor";
import { UserTreeViewProvider } from "./webViews/UsersTreeProvider";
// import { dataverseAuthentication } from "../../web/client/common/authenticationProvider";

export interface IContainerData {
    containerId: string;
    lineNumber: number;
    columnNumber: number;
}
let myStatusBarItem: vscode.StatusBarItem;
let copresenceWorker: Worker;
let userViewProvider: UserTreeViewProvider;

export function activate(context: vscode.ExtensionContext): void {
    console.log("VSCODE WORKER vscode extension activate function start");

    // setup telemetry
    // TODO: Determine how to determine the user's dataBoundary

    // const treeViewProvider = new WorkspaceTreeViewProvider();

    // vscode.workspace.onDidChangeWorkspaceFolders(() => {
    //     treeViewProvider.refresh();
    // });

    const userIcon = vscode.Uri.joinPath(
        context.extensionUri,
        "resources/green-circle-svgrepo-com.svg"
    );

    userViewProvider = new UserTreeViewProvider(userIcon);

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

    //WebExtensionContext.myWebView.setMyWebViews(context.extensionUri);
    // const rootPath =
    //     vscode.workspace.workspaceFolders &&
    //     vscode.workspace.workspaceFolders.length > 0
    //         ? vscode.workspace.workspaceFolders[0].uri.fsPath
    //         : undefined;

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args) => {
                // const input = await vscode.window.showInputBox({
                //     prompt: "What is your name ",
                // });

                // const answer = await vscode.window.showInformationMessage(
                //     "Who are you ?",
                //     "nidhi",
                //     "amit"
                // );
                // const treeprovider = new MyTreeDataProvider();
                // // vscode.window.registerTreeDataProvider(
                // //     "coPresenceView",
                // //     treeprovider
                // // );
                // vscode.window.createTreeView("testView", {
                //     treeDataProvider: treeprovider,
                //     // showCollapseAll: true,
                // });

                // WebExtensionContext.setUsername(input);
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

    console.log(
        "VSCODE WORKER vscode extension activate registerCommand success"
    );
    // showTreeView(context);

    processWillSaveDocument(context);
    console.log(
        "VSCODE WORKER vscode extension activate processWillSaveDocument success"
    );

    processOpenActiveTextEditor(context);
    console.log(
        "VSCODE WEBVIEW vscode extension activate processOpenActiveTextEditor success"
    );

    // WebExtensionContext.myWebView.panel.webview.onDidReceiveMessage(
    //     (message) => {
    //         console.log(
    //             `VSCODE WEBVIEW Received hello from webview: ${JSON.stringify(
    //                 message
    //             )}`
    //         );
    //         WebExtensionContext.containerId = message.containerId;
    //     }
    // );

    createCopresenceWorkerInstance(context);
    // bottom status bar config
    const statusBarCmd = "sample.showSelectionCount";
    myStatusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    myStatusBarItem.command = statusBarCmd;

    context.subscriptions.push(myStatusBarItem);

    showWalkthrough(context, WebExtensionContext.telemetry);
    console.log("VSCODE WORKER vscode extension activate function end");
}

export function createCopresenceWorkerInstance(
    context: vscode.ExtensionContext
) {
    // Create a worker. The worker main file implements the language server.
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

                if (data.type === "members-changed") {
                    updateStatusBarItem(data.totalUsers);
                }

                // WebExtensionContext.removeConnectedUserInContext(
                //     "d7de15c8-5037-ee11-bdf5-00224809038f"
                // );
                // userViewProvider.refresh();

                console.log("recived data", data);

                console.log(
                    `VSCODE WORKER Received hello from webworker: ${(JSON.stringify(event),
                        event.data,
                        event.data.containerId)
                    }`
                );

                // async function Temp() {
                //     console.log("Trying to fetch data from dataverse")
                //     const dataverseToken = await dataverseAuthentication('https://ritiktest.crm.dynamics.com/');

                //     fetch('https://ritiktest.crm.dynamics.com/api/data/v9.2/sharedworkspaces?$select=sharedworkspaceid', {
                //         method: 'GET',
                //         headers: {
                //             'Content-Type': 'application/json',
                //             'Authorization': 'Bearer ' + dataverseToken,
                //         }
                //     })
                //         .then(response => response.json())
                //         .then(data => {
                //             // console.log("Hello from the other side")
                //             // console.log(data);
                //             if (data.value && data.value.length > 0) {
                //                 const firstSharedWorkspaceId = data.value[0].sharedworkspaceid;
                //                 console.log("First shareworespaceid")
                //                 console.log(firstSharedWorkspaceId);
                //             } else {
                //                 console.log("No shared workspaces found in the response.");
                //             }
                //         })
                //         .catch(error => {
                //             console.error('Error fetching data:', error);
                //         });
                // }
                // Temp()


                WebExtensionContext.containerId = event.data.containerId;
                const otherUsercursor = DecorationManager.getInstance(
                    data.userId,
                    data.userName
                );
                console.log("other user cursor", otherUsercursor);
                const activeEditor = vscode.window.activeTextEditor;
                if (data.type === "member-removed") {
                    WebExtensionContext.removeConnectedUserInContext(
                        data.userId
                    );
                    userViewProvider.refresh();

                    activeEditor?.setDecorations(otherUsercursor, []);
                }
                if (data.type === "client-data") {
                    WebExtensionContext.updateConnectedUsersInContext(
                        data.lineNumber,
                        data.columnNumber,
                        data.containerId,
                        data.fileName,
                        data.filePath,
                        data.userName,
                        data.userId
                    );
                    userViewProvider.refresh();

                    if (activeEditor) {
                        const startPos = new vscode.Position(
                            data.lineNumber,
                            data.columnNumber
                        );
                        const endPos = new vscode.Position(
                            data.lineNumber,
                            data.columnNumber + 10
                        );

                        // const position = activeEditor.selection.active.line; // Current line position
                        const decoration = {
                            range: new vscode.Range(startPos, endPos),
                        };
                        activeEditor.setDecorations(otherUsercursor, []);

                        // activeEditor.setDecorations(otherUsercursor, [
                        //     decoration,
                        // ]);
                        // activeEditor.setDecorations(
                        //     vscode.window.createTextEditorDecorationType({}),
                        //     [decoration]
                        // );
                    }

                    if (event.data.lineNumber !== undefined && event.data.columnNumber !== undefined) {
                        vscode.window.showInformationMessage(
                            event.data.userName +
                            " new position is " +
                            event.data.lineNumber +
                            " " +
                            event.data.columnNumber +
                            " " +
                            "on page " +
                            event.data.fileName
                        );
                    } else {
                        vscode.window.showInformationMessage(
                            "Some one join at studio side"
                        );
                    }
                }
            };
        })
        .catch((error) => console.error(error));
}

export function processOpenActiveTextEditor(context: vscode.ExtensionContext) {
    console.log("VSCODE WORKER Inside processOpenActiveTextEditor");
    try {
        context.subscriptions.push(
            vscode.window.onDidChangeTextEditorSelection(async (event) => {
                console.log("It ran again");
                const selection = event.selections[0];
                const line = selection.active.line;
                const column = selection.active.character;
                console.log(
                    "VSCODE WORKER Inside onDidChangeTextEditorSelection"
                );

                console.log(`VSCODE WORKER  Line: ${line}`);
                console.log(`VSCODE WORKER  Column: ${column}`);

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
                // console.log("website id", websiteId);
                // let currentUserCursor;
                // if (WebExtensionContext.username !== undefined)
                //     currentUserCursor = DecorationManager.getInstance(
                //         WebExtensionContext.username
                //     );
                if (activeEditor) {
                    // console.log("active editor", activeEditor);
                    // const startPos = activeEditor.selection.active;
                    // const endPos = activeEditor.selection.active;

                    // const decoration = {
                    //     range: new vscode.Range(startPos, endPos),
                    // };

                    // if (currentUserCursor !== undefined) {
                    //     activeEditor.setDecorations(currentUserCursor, []);
                    //     activeEditor.setDecorations(currentUserCursor, [
                    //         decoration,
                    //     ]);
                    // }

                    const entityId =
                        WebExtensionContext.fileDataMap.getFileMap.get(
                            activeEditor.document.uri.fsPath
                        )?.entityId as string;
                    const fileName =
                        WebExtensionContext.fileDataMap.getFileMap.get(
                            activeEditor.document.uri.fsPath
                        )?.fileName;

                    if (entityId) {
                        // send data to webview
                        console.log("entity id", entityId);

                        console.log("VSCODE WORKER Sending message to worker");

                        // await WebExtensionContext.myWebView.panel.webview.postMessage(
                        //     {
                        //         containerId: WebExtensionContext.containerId,
                        //         lineNumber: line,
                        //         columnNumber: column,
                        //     } as IContainerData
                        // );

                        // const username = WebExtensionContext.username;
                        copresenceWorker.postMessage({
                            // username,

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

                            lineNumber: line,
                            columnNumber: column,
                        } as IContainerData);
                    }
                }
            })
        );
    } catch (error) {
        console.log(
            "VSCODE WORKER caught error in processOpenActiveTextEditor",
            error
        );
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

    copresenceWorker.terminate();
}

function isActiveDocument(fileName: string): boolean {
    return (
        vscode.workspace.workspaceFolders !== undefined &&
        WebExtensionContext.isContextSet &&
        WebExtensionContext.fileDataMap.getFileMap.has(fileName)
    );
}

export function updateStatusBarItem(n: number): void {
    console.log(n, "no of users connected");
    if (n > 0) {
        myStatusBarItem.text = `${n} users connected`;
        myStatusBarItem.show();
    } else {
        myStatusBarItem.hide();
    }
}
