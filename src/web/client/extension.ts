/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import * as vscode from "vscode";
import TelemetryReporter from "@vscode/extension-telemetry";
import { AI_KEY } from '../../common/telemetry/generated/telemetryConfiguration';
import PowerPlatformExtensionContextManager from "./powerPlatformExtensionContext";
import { PORTALS_URI_SCHEME, PUBLIC, IS_FIRST_RUN_EXPERIENCE, queryParameters } from "./common/constants";
import { PortalsFS } from "./dal/fileSystemProvider";
import { checkMandatoryParameters, removeEncodingFromParameters, ERRORS } from "./common/errorHandler";
import { sendExtensionInitPathParametersTelemetry, sendExtensionInitQueryParametersTelemetry, sendInfoTelemetry, setTelemetryReporter } from "./telemetry/webExtensionTelemetry";
let _telemetry: TelemetryReporter;
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import jwt_decode from 'jwt-decode';

export function getCesHeader(accessToken: string) {
    return {
        authorization: "Bearer " + accessToken,
        Accept: 'application/json',
       'Content-Type': 'application/json',
    };
}

export function activate(context: vscode.ExtensionContext): void {
    // setup telemetry
    _telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, AI_KEY);
    context.subscriptions.push(_telemetry);

    setTelemetryReporter(_telemetry);
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
                        queryParamsMap.set(pair[0].trim().toLowerCase(), pair[1].trim());
                    }
                }

                if (!checkMandatoryParameters(appName, entity, entityId, queryParamsMap)) return;

                removeEncodingFromParameters(queryParamsMap);
                await PowerPlatformExtensionContextManager.setPowerPlatformExtensionContext(entity, entityId, queryParamsMap);

                sendExtensionInitPathParametersTelemetry(appName, entity, entityId);

                if (queryParamsMap.get(queryParameters.SITE_VISIBILITY) === PUBLIC) {
                    const edit: vscode.MessageItem = { isCloseAffordance: true, title: localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit", "Edit the site") };
                    const siteMessage = localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.desc", "Be careful making changes. Anyone can see the changes you make immediately. Choose Edit the site to make edits, or close the editor tab to cancel without editing.");
                    const options = { detail: siteMessage, modal: true };
                    await vscode.window.showWarningMessage(localize("microsoft-powerapps-portals.webExtension.init.sitevisibility.edit.title", "You are editing a live, public site "), options, edit);
                }

                if (appName) {
                    switch (appName) {
                        case 'portal': {
                            sendExtensionInitQueryParametersTelemetry(queryParamsMap);

                            const isFirstRun = context.globalState.get(IS_FIRST_RUN_EXPERIENCE, true);
                            if (isFirstRun) {
                                vscode.commands.executeCommand(`workbench.action.openWalkthrough`, `microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted`, false);
                                context.globalState.update(IS_FIRST_RUN_EXPERIENCE, false);
                                sendInfoTelemetry("StartCommand", { 'commandId': 'workbench.action.openWalkthrough', 'walkthroughId': 'microsoft-IsvExpTools.powerplatform-vscode#PowerPage-gettingStarted' });
                            }

                            await vscode.window.withProgress({
                                location: vscode.ProgressLocation.Notification,
                                cancellable: true,
                                title: localize("microsoft-powerapps-portals.webExtension.fetch.file.message", "Fetching your file ...")
                            }, async () => {
                                await vscode.workspace.fs.readDirectory(PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext().rootDirectory);
                            });
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
        npsAuthentication();
        // sendInfoTelemetry("StartCommand", { 'commandId': 'powerplatform-walkthrough.overview-learn-more' });
        // vscode.env.openExternal(vscode.Uri.parse("https://go.microsoft.com/fwlink/?linkid=2207914"));
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

export async function npsAuthentication() {
    let accessToken = '';
    try {

        const session = await vscode.authentication.getSession('microsoft', ['https://microsoft.onmicrosoft.com/cessurvey/user'], { createIfNone: true });

       
        accessToken = session?.accessToken ?? '';
        const baseApiUrl = "https://ces-int.microsoftcloud.com/api/v1";
        const teamName = "PowerPages"; //Each onboarding team has a unique team name which is used across all API calls
        const surveyName = "PowerPages-NPS";
        // const userId = '5bb097a9-d3e9-48b6-8e37-3b384e04fa9b';
        // const tenantId = '72f988bf-86f1-41af-91ab-2d7cd011db47';
        const eventName = 'visitHomepage';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedToken = jwt_decode(accessToken) as any;
        const apiEndpoint = `${baseApiUrl}/${teamName}/Eligibilities/${surveyName}?userId=${parsedToken?.oid}&eventName=${eventName}&tenantId=${parsedToken.tid}`;
        const requestInitPost: RequestInit = {
            method: 'POST',
            body:'{}',
            headers:getCesHeader(accessToken)
        };
        const response = await fetch(apiEndpoint, requestInitPost);
        if (!accessToken) {
        //    sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
        }
        const result = await response?.json();
            console.log("respo-->"+result);
            
            if (result){
               // if(result.eligibility){
                    const panel = vscode.window.createWebviewPanel(
                        'testCESSurvey',
                        'Test CES Survey',
                        vscode.ViewColumn.Nine,
                        {enableScripts:true}
                      );
                      panel.webview.html = getWebviewContent();
                //    }
            }
        //sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED, { "userId": session?.account.id.split('/').pop() ?? session?.account.id ?? '' });
    } catch (error) {
        // const authError = (error as Error)?.message;
        // sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }
}

function getWebviewContent() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Test CES Survey</title>
    </head>
    <body>
        <div id="surveyDiv" style="height:800px; width:500px;"></div>
        <script src="https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.js" type="text/javascript"></script><link rel="stylesheet" type="text/css" href="https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.css" /><script type = "text/javascript" >function renderSurvey(parentElementId,FirstName, LastName, locale, environmentId, geo, UserId, TenantId, prompted){var se = new SurveyEmbed("v4j5cvGGr0GRqy180BHbRzXjbn7jdBpBl5IXVzWMNmFUOTU4WEwzMFJBMDNQUlBJN1IyVUw3WExLNS4u","https://customervoice.microsoft.com/","https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/","true");var context = {"First Name": FirstName,"Last Name": LastName,"locale": locale,"environmentId": environmentId,"geo": geo,"UserId": UserId,"TenantId": TenantId,"prompted": prompted,};se.renderInline(parentElementId, context);}</script>
        <script>
        window.addEventListener('load', function () {
            renderSurvey("surveyDiv", "Bert", "Hair", "en-US", "123", "IND", "bert.hair@contoso.com", "12345", "Product Overview");
           }, false);
        </script>
    </body>
    </html>`;
}