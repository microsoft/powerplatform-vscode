/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";
import { dataverseAuthentication } from "./common/AuthenticationProvider";
import { appTypes, PORTALSURISCHEME, PORTALSWORKSPACENAME } from "./common/Constants";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Activated Power Portal vscode web extension!"); // sample code for testing the webExtension

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            () => {
                vscode.window.showInformationMessage(
                    "Initializing Power Portal vscode web extension!"
                );
            }
        )
    );

    let initialized = false;
    let accessToken = '';
    context.subscriptions.push(vscode.commands.registerCommand('portals.init', async (args: any) => {
        if (initialized) {
            return;
        }
        initialized = true;

        if (!args) {
            return;
        }

        const { appname, entity, entityId, searchParams} = args
        console.log("extension - " + appname + " organization " + entity + entityId + searchParams);


        const queryParams = new Map<string, string>();
        for(const p of searchParams)
        {
            queryParams.set(p[0],p[1]);
        }

        if (appname != undefined){
            switch (appname) {
                case appTypes.portal:
                case appTypes.default:
                    // data verse authentication using vscode FPA
                    accessToken = await dataverseAuthentication(queryParams.get('orgUrl'));
                    break;

                default:
                    vscode.window.showInformationMessage('Unknown app, Please add authentication flow for this app');

            }

        } else {
            vscode.window.showErrorMessage("Please specify appName");
        }

    }));

    context.subscriptions.push(vscode.commands.registerCommand('portals.workspaceInit', async () => {
        vscode.window.showInformationMessage('creating PowerPortals workspace');
        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(`${PORTALSURISCHEME}:/`), name: PORTALSWORKSPACENAME });
    }));
}
