/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import { AI_KEY } from '../../client/constants';
import { dataverseAuthentication } from "./common/authenticationProvider";
import { setContext } from "./common/localStore";
import { ORG_URL, PORTALS_URI_SCHEME, telemetryEventNames } from "./common/constants";
import { PortalsFS } from "./common/fileSystemProvider";
import { checkMandatoryParameters, removeEncodingFromParameters, ERRORS, showErrorDialog } from "./common/errorHandler";
import { sendErrorTelemetry, sendExtensionInitPathParametersTelemetry, sendExtensionInitQueryParametersTelemetry, sendPerfTelemetry, setTelemetryReporter } from "./telemetry/webExtensionTelemetry";
import { INFO } from "./common/resources/Info";
let _telemetry: TelemetryReporter;

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
                vscode.window.showInformationMessage(INFO.WORKSPACE_INITIAL_LOAD);
                const { appName, entity, entityId, searchParams } = args;
                sendExtensionInitPathParametersTelemetry(appName, entity, entityId);
                const queryParamsMap = new Map<string, string>();

                if (searchParams) {
                    const queryParams = new URLSearchParams(searchParams);
                    for (const pair of queryParams.entries()) {
                        queryParamsMap.set(pair[0], pair[1]);
                    }
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
                                    showErrorDialog(ERRORS.WORKSPACE_INITIAL_LOAD, ERRORS.WORKSPACE_INITIAL_LOAD_DESC);
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
                            vscode.window.showInformationMessage(ERRORS.UNKNOWN_APP);
                    }
                } else {
                    vscode.window.showErrorMessage(ERRORS.UNKNOWN_APP);
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
