/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from "vscode";
import { dataverseAuthentication } from "./common/AuthenticationProvider";
import { appTypes, PORTALSURISCHEME, PORTALSWORKSPACENAME } from "./common/Constants";
import { expBackoff } from "./common/ErrorHandler";
import { PortalsFS } from "./common/FileSystemProvider";
import { languageIdtoCodeMap, webpagestowebpagesIdMap, websiteIdtoLanguageMap } from "./common/PortalLanguageProvider";
import { GetCustomDetails, getfoldername, loadschema } from "./common/PortalSchemaReader";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Activated Power Portal vscode web extension!"); // sample code for testing the webExtension
    const portalsFS = new PortalsFS();
    let initialized = false;
    let accessToken = '';
    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            async (args: any) => {
                vscode.window.showInformationMessage(
                    "Initializing Power Portal vscode web extension!"
                );

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
                for(const p of Object.keys(queryParams))
                {
                    if(!p)
                    queryParams.set(p,queryParams.get(p) as string);
                    console.log(p + " " + queryParams.get(p) as string)
                }

                 // load the fetch xml for the specified entity
                let fetchQueryEntityMap = new Map();
                ({fetchQueryEntityMap} = loadschema());

                // get portal name and other details to create the base directory
                const portalsFolderName = expBackoff(getfoldername(fetchQueryEntityMap, entity), {});
                console.log(portalsFolderName);
                portalsFS.createDirectory(vscode.Uri.parse(`${PORTALSURISCHEME}:/${portalsFolderName}/`, true));

                if (appname != undefined){
                    switch (appname) {
                        case appTypes.portal:
                        case appTypes.default:
                            // data verse authentication using vscode FPA
                            accessToken = await dataverseAuthentication(queryParams.get('orgUrl'));
                            if(!accessToken)
                            {
                                vscode.window.showErrorMessage("Authentication to dataverse failed!, Please retry...");
                            }
                            break;

                        default:
                            vscode.window.showInformationMessage('Unknown app, Please add authentication flow for this app');

                    }

                } else {
                    vscode.window.showErrorMessage("Please specify appName");
                }

                // fetch portal languages
                vscode.window.showInformationMessage('fetching portal language data')
                let websiteIdtoLanguage = new Map();
                let languageIdCodeMap = new Map();
                const orgUrl = queryParams.get('orgUrl')|| 'testurl';
                let schemadetails = new Map();
                schemadetails = GetCustomDetails(fetchQueryEntityMap, schemadetails);
                console.log(schemadetails);
                const api = schemadetails.get('api');
                const data = schemadetails.get('data');
                const version = schemadetails.get('version');

                ({websiteIdtoLanguage} = await websiteIdtoLanguageMap(accessToken, orgUrl, api, data, version, entity, fetchQueryEntityMap));
                console.log(websiteIdtoLanguage);
                vscode.window.showInformationMessage('fetching website language data');
                ({languageIdCodeMap} = await languageIdtoCodeMap(accessToken, orgUrl, api, data, version,entity, fetchQueryEntityMap ));
                console.log(languageIdCodeMap);
                let webpagestowebpagesId = new Map();
                ({ webpagestowebpagesId} = await webpagestowebpagesIdMap(accessToken, orgUrl, api, data, version, entity, fetchQueryEntityMap));
                console.log(webpagestowebpagesId);

                // create workspace init
                vscode.window.showInformationMessage('creating PowerPortals workspace');
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(`${PORTALSURISCHEME}:/`), name: PORTALSWORKSPACENAME });
            }
        )
    );
}
