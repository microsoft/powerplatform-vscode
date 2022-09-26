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
import { PORTALS_URI_SCHEME, telemetryEventNames, SITE_VISIBILITY, PUBLIC } from "./common/constants";
import { PortalsFS } from "./common/fileSystemProvider";
import { checkMandatoryParameters, removeEncodingFromParameters, ERRORS } from "./common/errorHandler";
import { sendExtensionInitPathParametersTelemetry, sendExtensionInitQueryParametersTelemetry, sendPerfTelemetry, setTelemetryReporter } from "./telemetry/webExtensionTelemetry";
let _telemetry: TelemetryReporter;
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // setup telemetry
    _telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, AI_KEY);
    context.subscriptions.push(_telemetry);

    setTelemetryReporter(_telemetry);
    _telemetry.sendTelemetryEvent("Start");
    _telemetry.sendTelemetryEvent("activated");
    // await vscode.commands.executeCommand('workbench.action.closeAllEditors');
    const portalsFS = new PortalsFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(PORTALS_URI_SCHEME, portalsFS, { isCaseSensitive: true }));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args) => {
                _telemetry.sendTelemetryEvent("StartCommand", { 'commandId': 'microsoft-powerapps-portals.webExtension.init' });

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

                //let accessToken: string;
                if (appName) {
                    switch (appName) {
                        case 'portal': {
                            sendExtensionInitQueryParametersTelemetry(searchParams);

                            const timeStampBeforeSettingContext = new Date().getTime();
                            const timeTakenToSetContext = new Date().getTime() - timeStampBeforeSettingContext;
                            sendPerfTelemetry(telemetryEventNames.WEB_EXTENSION_SET_CONTEXT_PERF, timeTakenToSetContext);
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
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2207914"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-documentation', async () => {
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206616"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.fileSystem-open-folder', async () => {
        vscode.commands.executeCommand("workbench.view.explorer");
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-learn-more', async () => {
        vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2206366"));
    }));

    context.subscriptions.push(vscode.commands.registerCommand('powerplatform-walkthrough.advancedCapabilities-start-coding', async () => {
        vscode.window.showTextDocument(PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext().defaultFileUri);
    }));
}

export async function deactivate(): Promise<void> {
    if (_telemetry) {
        _telemetry.sendTelemetryEvent("End");
        _telemetry.dispose();
    }
}
