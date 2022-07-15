/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import { AI_KEY } from '../../client/constants';
import { dataverseAuthentication } from "./common/authenticationProvider";
import { setContext } from "./common/localStore";
import { ORG_URL, PORTALS_URI_SCHEME } from "./common/constants";
import { PortalsFS } from "./common/fileSystemProvider";
import { checkMandatoryPathParameters, checkMandatoryQueryParameters, checkParameters, ERRORS, showErrorDialog } from "./common/errorHandler";
let _telemetry: TelemetryReporter;

/* eslint-disable @typescript-eslint/no-explicit-any */
export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    _telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, AI_KEY);
    context.subscriptions.push(_telemetry);
    _telemetry.sendTelemetryEvent("Start");
    _telemetry.sendTelemetryEvent("activated");
    const portalsFS = new PortalsFS();
    context.subscriptions.push(vscode.workspace.registerFileSystemProvider(PORTALS_URI_SCHEME, portalsFS, { isCaseSensitive: true }));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args: any) => {
                _telemetry.sendTelemetryEvent("StartCommand", { 'commandId': 'microsoft-powerapps-portals.webExtension.init' });
                vscode.window.showInformationMessage(
                    "Initializing Power Platform web extension!"
                );
                if (!args) {
                    vscode.window.showErrorMessage(ERRORS.BACKEND_ERROR); // this should never happen, the check is done by vscode.dev server
                    return;
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { appName, entity, entityId, searchParams } = args;

                const queryParamsMap = new Map<string, string>();
                try {
                    if (searchParams) {
                        const queryParams = new URLSearchParams(searchParams);
                        for (const pair of queryParams.entries()) {
                            queryParamsMap.set(pair[0], pair[1]);
                        }
                    }
                }
                catch (error) {
                    vscode.window.showErrorMessage("Error encountered in query parameters fetch");
                }
                let accessToken: string;
                if (appName) {
                    switch (appName) {
                        case 'portal':
                            try {
                                if (!checkMandatoryPathParameters(appName, entity, entityId)) return;
                                if (!checkMandatoryQueryParameters(appName, queryParamsMap)) return;
                                checkParameters(queryParamsMap, entity);
                                accessToken = await dataverseAuthentication(queryParamsMap.get(ORG_URL) as string);
                                if (!accessToken) {
                                    {
                                        showErrorDialog(ERRORS.VSCODE_INITIAL_LOAD, ERRORS.AUTHORIZATION_FAILED);
                                        return;
                                    }
                                }
                                setContext(accessToken, entity, entityId, queryParamsMap, portalsFS);
                            } catch {
                                showErrorDialog(ERRORS.SERVICE_ERROR, ERRORS.BAD_VALUE);
                                return;
                            }
                            break;
                        case 'default':
                        default:
                            vscode.window.showInformationMessage(ERRORS.UNKNOWN_APP);
                    }
                } else {
                    vscode.window.showErrorMessage(ERRORS.APP_NAME_NOT_AVAILABLE);
                    throw new Error(ERRORS.APP_NAME_NOT_AVAILABLE);
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
