/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import { AI_KEY } from '../../client/constants';
import { dataverseAuthentication } from "./common/authenticationProvider";
import { setContext } from "./common/localStore";
let _telemetry: TelemetryReporter;


/* eslint-disable @typescript-eslint/no-explicit-any */

export function activate(context: vscode.ExtensionContext): void {
    console.log("Activated web extension!");
    // setup telemetry
    _telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, AI_KEY);
    context.subscriptions.push(_telemetry);
    _telemetry.sendTelemetryEvent("Start");
    _telemetry.sendTelemetryEvent("activated");

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args: any) => {
                _telemetry.sendTelemetryEvent("StartCommand", { 'commandId': 'microsoft-powerapps-portals.webExtension.init' });
                vscode.window.showInformationMessage(
                    "Initializing Power Platform web extension!"
                );
                if (!args) {
                    vscode.window.showErrorMessage('Appname and query params missing, Please retry...');
                    return;
                }

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { appName, entity, entityId, searchParams } = args
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
                let accessToken;
                if (appName) {
                    switch (appName) {
                        case 'portal':
                        case 'default':
                            accessToken = await dataverseAuthentication(queryParamsMap.get('orgUrl'));
                            if (!accessToken) {
                                vscode.window.showErrorMessage("Authentication to dataverse failed!, Please retry...");
                            }
                            // set local storage for language and website data
                            setContext(accessToken, queryParamsMap.get('orgUrl'))
                            break;
setContext
                        default:
                            vscode.window.showInformationMessage('Unknown app, Please add authentication flow for this app');
                    }

                } else {
                    vscode.window.showErrorMessage("Please specify the appName");
                }
            }
        )
    );
}

export async function deactivate(): Promise<void> {
    if (_telemetry) {
        _telemetry.sendTelemetryEvent("End");

        // dispose() will flush any events not sent
        // Note, while dispose() returns a promise, we don't await it so that we can unblock the rest of unloading logic
        _telemetry.dispose();
    }
}
