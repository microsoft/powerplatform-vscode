/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { telemetryEventNames } from '../telemetry/constants';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import { sendErrorTelemetry, sendInfoTelemetry } from '../telemetry/webExtensionTelemetry';
import { PROVIDER_ID } from './constants';
import jwt_decode from 'jwt-decode';

export function getHeader(accessToken: string, useOctetStreamContentType?: boolean) {
    return {
        authorization: "Bearer " + accessToken,
        'content-type': useOctetStreamContentType ? 'application/octet-stream' : "application/json; charset=utf-8",
        accept: "application/json",
        'OData-MaxVersion': "4.0",
        'OData-Version': "4.0",
    };
}

export function getCesHeader(accessToken: string) {
    return {
        authorization: "Bearer " + accessToken,
        Accept: 'application/json',
       'Content-Type': 'application/json',
    };
}

export async function dataverseAuthentication(dataverseOrgURL: string): Promise<string> {
    let accessToken = '';
    try {

        let session = await vscode.authentication.getSession(PROVIDER_ID, [`${dataverseOrgURL}//.default`, 'offline_access'], { silent: true });

        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, [`${dataverseOrgURL}//.default`, 'offline_access'], { createIfNone: true });
        }

        accessToken = session?.accessToken ?? '';
        if (!accessToken) {
            sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_NO_ACCESS_TOKEN);
        }
        sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED, { "userId": session?.account.id.split('/').pop() ?? session?.account.id ?? '' });
    } catch (error) {
        const authError = (error as Error)?.message;
        sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }
    return accessToken;
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

function getWebviewContent(_extensionUri: vscode.Uri,webview: vscode.Webview) {
    const scriptPathOnDisk = vscode.Uri.joinPath(_extensionUri, 'media', 'main.js');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    const nonce = getNonce();
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src 'nonce-${nonce}';">
        <title>Test CES Survey</title>
    </head>
    <body>
        <div id="surveyDiv" style="height:800px; width:500px;"></div>
        <script src="${scriptUri}" nonce="${nonce}"></script>
    </body>
    </html>`;
}

export async function npsAuthentication(extensionUri: vscode.Uri) {
    let accessToken = '';
    try {

        let session = await vscode.authentication.getSession(PROVIDER_ID, ['https://microsoft.onmicrosoft.com/cessurvey/user'], { silent: true });

        if (!session) {
            session = await vscode.authentication.getSession(PROVIDER_ID, ['https://microsoft.onmicrosoft.com/cessurvey/user'], { createIfNone: true });
        }       
        accessToken = session?.accessToken ?? '';
        const baseApiUrl = "https://ces-int.microsoftcloud.com/api/v1";
        const teamName = "PowerPages"; //Each onboarding team has a unique team name which is used across all API calls
        const surveyName = "PowerPages-NPS";
        // const userId = '5bb097a9-d3e9-48b6-8e37-3b384e04fa9b';
        // const tenantId = '72f988bf-86f1-41af-91ab-2d7cd011db47';
        const eventName = 'vsCodeWeb';
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
                    //   const onDiskPath = vscode.Uri.file(
                    //             path.join(context.extensionPath, 'media', 'main.js')
                    //           );
                    //         const catGifSrc = panel.webview.asWebviewUri(onDiskPath);
                      panel.webview.html = getWebviewContent(extensionUri,panel.webview);
                //    }
            }
        //sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED, { "userId": session?.account.id.split('/').pop() ?? session?.account.id ?? '' });
    } catch (error) {
        // const authError = (error as Error)?.message;
        // sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED, authError);
    }
}
