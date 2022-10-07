/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();

import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import { AI_KEY } from '../../common/telemetry/generated/telemetryConfiguration';
import PowerPlatformExtensionContextManager from "./common/localStore";
import { PORTALS_URI_SCHEME, SITE_VISIBILITY, PUBLIC, IS_FIRST_RUN_EXPERIENCE } from "./common/constants";
import { PortalsFS } from "./common/fileSystemProvider";
import { checkMandatoryParameters, removeEncodingFromParameters, ERRORS } from "./common/errorHandler";
import { sendExtensionInitPathParametersTelemetry, sendExtensionInitQueryParametersTelemetry, sendInfoTelemetry, setTelemetryReporter } from "./telemetry/webExtensionTelemetry";
let _telemetry: TelemetryReporter;
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    _telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, AI_KEY);
    context.subscriptions.push(_telemetry);

    setTelemetryReporter(_telemetry);
    sendInfoTelemetry("Start");
    sendInfoTelemetry("activated");
    const portalsFS = new PortalsFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(PORTALS_URI_SCHEME, portalsFS, { isCaseSensitive: true }));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args) => {
                sendInfoTelemetry("StartCommand", { 'commandId': 'microsoft-powerapps-portals.webExtension.init' });

                const { appName, entity, entityId, searchParams } = args;
                const queryParamsMap = new Map<string, string>();

                if (searchParams) {
                    const queryParams = new URLSearchParams(searchParams);
                    for (const pair of queryParams.entries()) {
                        queryParamsMap.set(pair[0], pair[1]);
                    }
                }

                if (!checkMandatoryParameters(appName, entity, entityId, queryParamsMap)) return;

                removeEncodingFromParameters(queryParamsMap);
                await PowerPlatformExtensionContextManager.setPowerPlatformExtensionContext(entity, entityId, queryParamsMap);

                sendExtensionInitPathParametersTelemetry(appName, entity, entityId);

                if (queryParamsMap.get(SITE_VISIBILITY) === PUBLIC) {
                    const edit: vscode.MessageItem = { isCloseAffordance: true, title: localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit", "Edit the site") };
                    const siteMessage = localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.desc", "Be careful making changes. Anyone can see the changes you make immediately. Choose Edit the site to make edits, or close the editor tab to cancel without editing.");
                    const options = { detail: siteMessage, modal: true };
                    await vscode.window.showWarningMessage(localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.title", "You are editing a live, public site "), options, edit);
                }

                if (appName) {
                    switch (appName) {
                        case 'portal': {
                            sendExtensionInitQueryParametersTelemetry(searchParams);

                            const isFirstRun = context.globalState.get(IS_FIRST_RUN_EXPERIENCE, true);
                            if (isFirstRun) {
                                vscode.commands.executeCommand(`workbench.action.openWalkthrough`,`microsoft-IsvExpTools.powerplatform-vscode-preview#PowerPage-gettingStarted`, false);
                                context.globalState.update(IS_FIRST_RUN_EXPERIENCE, false);
                                sendInfoTelemetry("StartCommand", { 'commandId': 'workbench.action.openWalkthrough', 'walkthroughId': 'microsoft-IsvExpTools.powerplatform-vscode-preview#PowerPage-gettingStarted' });
                            }

                            await vscode.workspace.fs.readDirectory(PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext().rootDirectory);
                        }
                            break;
                        case 'default':
                        default:
                            vscode.window.showInformationMessage(localize("microsoft-powerapps-portals.webExtension.init.app-not-found", "Unable to find that app"));
                    }
                } else {
                    vscode.window.showErrorMessage(localize("microsoft-powerapps-portals.webExtension.init.app-not-found", "Unable to find that app"));
                    throw new Error(ERRORS.UNKNOWN_APP);
                }
            }
        )
    );
    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.overview-learn-more', async () => {
        sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.overview-learn-more' });
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2207914"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-documentation', async () => {
        sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.fileSystem-documentation' });
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206616"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-open-folder', async () => {
        sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.fileSystem-open-folder' });
        vscode.commands.executeCommand("workbench.view.explorer");
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-learn-more', async () => {
        sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.advancedCapabilities-learn-more' });
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206366"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-start-coding', async () => {
        sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.advancedCapabilities-start-coding' });
        vscode.window.showTextDocument(PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext().defaultFileUri);
    }));
}

export async function deactivate(): Promise<void> {
    if (_telemetry) {
        sendInfoTelemetry("End");
        _telemetry.dispose();
    }
}
