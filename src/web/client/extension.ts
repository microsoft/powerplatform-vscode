/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();

import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import { AI_KEY } from '../../client/constants';
import { dataverseAuthentication } from "./common/authenticationProvider";
import { setContext } from "./common/localStore";
import { ORG_URL, PORTALS_URI_SCHEME, telemetryEventNames, SITE_VISIBILITY, PUBLIC } from "./common/constants";
import { PortalsFS } from "./common/fileSystemProvider";
import { checkMandatoryParameters, removeEncodingFromParameters, ERRORS, showErrorDialog } from "./common/errorHandler";
import { sendErrorTelemetry, sendExtensionInitPathParametersTelemetry, sendExtensionInitQueryParametersTelemetry, sendPerfTelemetry, setTelemetryReporter } from "./telemetry/webExtensionTelemetry";
let _telemetry: TelemetryReporter;
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    _telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, AI_KEY);
    context.subscriptions.push(_telemetry);

    setTelemetryReporter(_telemetry);
    _telemetry.sendTelemetryEvent("Start");
    _telemetry.sendTelemetryEvent("activated");
    const portalsFS = new PortalsFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(PORTALS_URI_SCHEME, portalsFS, { isCaseSensitive: true }));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args) => {
                _telemetry.sendTelemetryEvent("StartCommand", { 'commandId': 'microsoft-powerapps-portals.webExtension.init' });

                vscode.window.showInformationMessage("Opening VS Code for the web ...");
                const { appName, entity, entityId, searchParams } = args;
                sendExtensionInitPathParametersTelemetry(appName, entity, entityId);
                const queryParamsMap = new Map<string, string>();

                if (searchParams) {
                    const queryParams = new URLSearchParams(searchParams);
                    for (const pair of queryParams.entries()) {
                        queryParamsMap.set(pair[0], pair[1]);
                    }
                }

                if (queryParamsMap.get(SITE_VISIBILITY) === PUBLIC) {
                    const edit: vscode.MessageItem = { isCloseAffordance: true, title: "Edit the site" };
                    const siteMessage = "Be careful making changes. Anyone can see changes you make right away. To edit in private, go to Set up to change the site visibility to private";
                    const options = { detail: siteMessage, modal: true };
                    vscode.window.showWarningMessage("You are editing a live, public site ", options, edit);
                }

                let accessToken: string;
                if (appName) {
                    switch (appName) {
                        case 'portal': {
                            sendExtensionInitQueryParametersTelemetry(searchParams);
                            if (!checkMandatoryParameters(appName, entity, entityId, queryParamsMap)) return;
                            removeEncodingFromParameters(queryParamsMap);

                            accessToken = await dataverseAuthentication(queryParamsMap.get(ORG_URL) as string);
                            if (!accessToken) {
                                {
                                    showErrorDialog(localize("microsoft-powerapps-portals.webExtension.init.error", "There was a problem opening the workspace"), localize("microsoft-powerapps-portals.webExtension.init.error.desc", "Try refreshing the browser"));
                                    sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
                                    return;
                                }
                            }
                            const timeStampBeforeSettingContext = new Date().getTime();
                            await setContext(accessToken, entity, entityId, queryParamsMap, portalsFS);
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
}

export async function deactivate(): Promise<void> {
    if (_telemetry) {
        _telemetry.sendTelemetryEvent("End");
        _telemetry.dispose();
    }
}
