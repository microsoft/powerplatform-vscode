/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { sendAPIFailureTelemetry, sendAPITelemetry } from '../telemetry/webExtensionTelemetry';
import { toBase64 } from '../utility/CommonUtility';
import { getRequestURL } from '../utility/UrlBuilder';
import { getHeader } from './authenticationProvider';
import { BAD_REQUEST, CHARSET, httpMethod, NEW_SCHEMA_NAME } from './constants';
import { showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { entitiesSchemaMap } from './localStore';
import { SaveEntityDetails } from './portalSchemaInterface';
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export function registerSaveProvider(
    accessToken: string,
    portalsFS: PortalsFS,
    dataVerseOrgUrl: string,
    saveDataMap: Map<string, SaveEntityDetails>,
    useBase64Encoding: boolean
) {
    vscode.workspace.onDidSaveTextDocument(async (document) => {
        if (document?.uri?.fsPath) {
            vscode.window.showInformationMessage(localize("microsoft-powerapps-portals.webExtension.save.file.message", "Saving your file ..."));
            const newFileData = portalsFS.readFile(document.uri);
            let stringDecodedValue = new TextDecoder(CHARSET).decode(newFileData);
            if (useBase64Encoding) {
                stringDecodedValue = toBase64(stringDecodedValue);
            }

            const patchRequestUrl = getRequestURL(dataVerseOrgUrl,
                saveDataMap.get(document.uri.fsPath)?.getEntityName as string,
                saveDataMap.get(document.uri.fsPath)?.getEntityId as string,
                entitiesSchemaMap,
                httpMethod.PATCH,
                true);
            await saveData(accessToken, patchRequestUrl, document.uri, saveDataMap, stringDecodedValue);
        }
    });
}

export async function saveData(
    accessToken: string,
    requestUrl: string,
    fileUri: vscode.Uri,
    saveDataMap: Map<string, SaveEntityDetails>,
    value: string
) {
    let requestBody = '';
    const column = saveDataMap.get(fileUri.fsPath)?.getSaveAttribute;

    if (column) {
        const data: { [k: string]: string } = {};
        data[column] = value;
        requestBody = JSON.stringify(data);
    } else {
        sendAPIFailureTelemetry(requestUrl, 0, BAD_REQUEST); // no API request is made in this case since we do not know in which column should we save the value
        showErrorDialog(localize("microsoft-powerapps-portals.webExtension.save.file.error", "Unable to complete the request"), localize("microsoft-powerapps-portals.webExtension.save.file.error.desc", "One or more attribute names have been changed or removed. Contact your admin."));
    }

    if (saveDataMap.get(fileUri.fsPath)?.getSchemaAttribute == NEW_SCHEMA_NAME) {
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.fetch.authorization.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.fetch.authorization.desc", "Try again"));
            throw new Error(response.statusText);
        }

        const result = await response.json();
        const data = result.value;
        for (let counter = 0; counter < data.length; counter++) {
            if (result.value.powerpagecomponentid === saveDataMap.get(fileUri.fsPath)?.getEntityId) {
                result.value.content = value;
            }
        }
        requestBody = JSON.stringify(result);
    }

    if (requestBody) {
        const requestSentAtTime = new Date().getTime();
        try {
            const response = await fetch(requestUrl, {
                method: 'PATCH',
                headers: getHeader(accessToken),
                body: requestBody
            });

            sendAPITelemetry(requestUrl);

            if (!response.ok) {
                sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, response.statusText);
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "There’s a problem on the back end"), localize("microsoft-powerapps-portals.webExtension.retry.desc", "Try again"));
                throw new Error(response.statusText);
            }
        }
        catch (error) {
            const authError = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, authError);
            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
            }
            else {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
            }
        }
    }
}
