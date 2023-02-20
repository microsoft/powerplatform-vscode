/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import * as vscode from "vscode";
import WebExtensionContext from "./WebExtensionContext";
import { PORTALS_URI_SCHEME, PUBLIC, IS_FIRST_RUN_EXPERIENCE, queryParameters } from "./common/constants";
import { PortalsFS } from "./dal/fileSystemProvider";
import { checkMandatoryParameters, removeEncodingFromParameters } from "./common/errorHandler";
import { WebExtensionTelemetry } from './telemetry/webExtensionTelemetry';
import { convertStringtoBase64 } from './utilities/commonUtil';
import {NPSService} from './services/NPSService'
import { vscodeExtAppInsightsResourceProvider } from '../../common/telemetry-generated/telemetryConfiguration';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    // TODO: Determine how to determine the user's dataBoundary
    const dataBoundary = undefined;
    const appInsightsResource = vscodeExtAppInsightsResourceProvider.GetAppInsightsResourceForDataBoundary(dataBoundary);
    WebExtensionContext.telemetry.setTelemetryReporter(context.extension.id, context.extension.packageJSON.version, appInsightsResource);
    context.subscriptions.push(WebExtensionContext.telemetry.getTelemetryReporter());

    WebExtensionContext.telemetry.sendInfoTelemetry("activated");
    // TODO Bidisha: As of now kept here for testing. In subsequent PR will be fixed
    NPSService.getEligibility();
    const portalsFS = new PortalsFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(PORTALS_URI_SCHEME, portalsFS, { isCaseSensitive: true }));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args) => {
                WebExtensionContext.telemetry.sendInfoTelemetry("StartCommand", { 'commandId': 'microsoft-powerapps-portals.webExtension.init' });

                const { appName, entity, entityId, searchParams } = args;
                const queryParamsMap = new Map<string, string>();

                if (searchParams) {
                    const queryParams = new URLSearchParams(searchParams);
                    for (const pair of queryParams.entries()) {
                        queryParamsMap.set(pair[0].trim().toLowerCase(), pair[1].trim());
                    }
                }

                if (!checkMandatoryParameters(appName, entity, entityId, queryParamsMap)) return;

                removeEncodingFromParameters(queryParamsMap);
                WebExtensionContext.setWebExtensionContext(entity, entityId, queryParamsMap);

                WebExtensionContext.telemetry.sendExtensionInitPathParametersTelemetry(appName, entity, entityId);

                if (queryParamsMap.get(queryParameters.SITE_VISIBILITY) === PUBLIC) {
                    const edit: vscode.MessageItem = { isCloseAffordance: true, title: localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit", "Edit the site") };
                    const siteMessage = localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.desc", "Be careful making changes. Anyone can see the changes you make immediately. Choose Edit the site to make edits, or close the editor tab to cancel without editing.");
                    const options = { detail: siteMessage, modal: true };
                    await vscode.window.showWarningMessage(localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.title", "You are editing a live, public site "), options, edit);
                }

                if (appName) {
                    switch (appName) {
                        case 'portal': {
                            WebExtensionContext.telemetry.sendExtensionInitQueryParametersTelemetry(queryParamsMap);

                            const isFirstRun = context.globalState.get(IS_FIRST_RUN_EXPERIENCE, true);
                            if (isFirstRun) {
                                vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted`, false);
                                context.globalState.update(IS_FIRST_RUN_EXPERIENCE, false);
                                WebExtensionContext.telemetry.sendInfoTelemetry("StartCommand", { 'commandId': 'workbench.action.openWalkthrough', 'walkthroughId': 'microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted' });
                            }

                            await vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                                cancellable: true,
                                title: localize("microsoft-powerapps-portals.webExtension.fetch.file.message", "Fetching your file ...")
                            }, async () => {
                                await vscode.workspace.fs.readDirectory(WebExtensionContext.rootDirectory);
                                console.log("data-->"+vscode.workspace);
                                // eslint-disable-next-line no-debugger
                                debugger;
                              
                            });
                        }
                            break;
                        default:
                            vscode.window.showErrorMessage(localize("microsoft-powerapps-portals.webExtension.init.app-not-found", "Unable to find that app"));
                    }
                } else {
                    vscode.window.showErrorMessage(localize("microsoft-powerapps-portals.webExtension.init.app-not-found", "Unable to find that app"));
                    return;
                }
            }
        )
    );

    processWillSaveDocument(context);

    showWalkthrough(context, WebExtensionContext.telemetry);
}

export function processWillSaveDocument(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument((e) => {
            const fileName = e.document.fileName;
            if (vscode.workspace === undefined) {
                return;
            } else if (
                isActiveDocument(fileName)
            ) {
                const fileData = WebExtensionContext.fileDataMap.getFileMap.get(fileName);
                // Update the latest content in context
                if (fileData?.entityId && fileData.attributePath) {
                    let fileContent = e.document.getText();
                    if (fileData.encodeAsBase64 as boolean) {
                        fileContent = convertStringtoBase64(fileContent);
                    }
                    WebExtensionContext.entityDataMap
                        .updateEntityColumnContent(fileData?.entityId, fileData.attributePath, fileContent);
                    WebExtensionContext.fileDataMap
                        .updateDirtyChanges(fileName, true);
                }
            }
        })
    );
}

export function showWalkthrough(context: vscode.ExtensionContext, telemetry: WebExtensionTelemetry) {
    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.overview-learn-more', async () => {
        telemetry.sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.overview-learn-more' });
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2207914"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-documentation', async () => {
        telemetry.sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.fileSystem-documentation' });
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206616"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-open-folder', async () => {
        telemetry.sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.fileSystem-open-folder' });
        vscode.commands.executeCommand("workbench.view.explorer");
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-learn-more', async () => {
        telemetry.sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.advancedCapabilities-learn-more' });
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206366"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-start-coding', async () => {
        telemetry.sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.advancedCapabilities-start-coding' });
        vscode.window.showTextDocument(WebExtensionContext.defaultFileUri);
    }));
}

export async function deactivate(): Promise<void> {
    const telemetry = WebExtensionContext.telemetry;
    if (telemetry) {
        telemetry.sendInfoTelemetry("End");
    }
}

function isActiveDocument(fileName: string): boolean {
    return (vscode.workspace.workspaceFolders !== undefined) &&
        WebExtensionContext.isContextSet &&
        WebExtensionContext.fileDataMap.getFileMap.has(fileName);
}
