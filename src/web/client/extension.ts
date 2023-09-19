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
import { IEntityInfo } from "./common/interfaces";
import { telemetryEventNames } from "./telemetry/constants";
import { PowerPagesNavigationProvider } from "./webViews/powerPagesNavigationProvider";
import * as copilot from "../../common/copilot/PowerPagesCopilot";
import { IOrgInfo } from "../../common/copilot/model";
import { copilotNotificationPanel, disposeNotificationPanel } from "../../common/copilot/welcome-notification/CopilotNotificationPanel";
import { COPILOT_NOTIFICATION_DISABLED } from "../../common/copilot/constants";

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

    processWillStartCollaboartion();

    showWalkthrough(context, WebExtensionContext.telemetry);
}

export function powerPagesNavigation() {
    const powerPagesNavigationProvider = new PowerPagesNavigationProvider();
    vscode.window.registerTreeDataProvider('powerPagesFileExplorer', powerPagesNavigationProvider);
    vscode.commands.registerCommand('powerPagesFileExplorer.previewPowerPages', () => powerPagesNavigationProvider.previewPowerPageSite());
    vscode.commands.registerCommand('powerPagesFileExplorer.backToStudio', () => powerPagesNavigationProvider.backToStudio());
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

export function processWillStartCollaboartion() {
    if (isCoPresenceEnabled()) {
        // TODO: Add copresence logic
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
            activeOrgUrl: WebExtensionContext.urlParametersMap.get(queryParameters.ORG_URL) as string
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
