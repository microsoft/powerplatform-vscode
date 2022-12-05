/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { sendAPIFailureTelemetry, sendAPISuccessTelemetry, sendAPITelemetry } from '../telemetry/webExtensionTelemetry';
import { getHeader } from '../common/authenticationProvider';
import { BAD_REQUEST, MIMETYPE } from '../common/constants';
import { showErrorDialog } from '../common/errorHandler';
import { SaveEntityDetails } from '../schema/portalSchemaInterface';
import { httpMethod } from '../common/constants';
import * as nls from 'vscode-nls';
import { getAttributeParts, isWebFileV2OctetStream } from '../utilities/schemaHelperUtil';
import { getPatchRequestUrl } from '../utilities/urlBuilderUtil';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function saveData(
    accessToken: string,
    requestUrl: string,
    entityName: string,
    fileUri: vscode.Uri,
    saveDataMap: Map<string, SaveEntityDetails>,
    newFileContent: string
) {
    const requestInit: RequestInit = {
        method: httpMethod.PATCH
    };
    const column = saveDataMap.get(fileUri.fsPath)?.getSaveAttribute;

    if (column) {
        const attributeParts = getAttributeParts(column);
        const data: { [k: string]: string } = {};
        const mimeType = saveDataMap.get(fileUri.fsPath)?.getMimeType;
        const isWebFileV2 = isWebFileV2OctetStream(entityName, column);

        if (mimeType) {
            data[MIMETYPE] = mimeType
        }

        if (attributeParts.relativePath.length) {
            const originalAttributeContent = saveDataMap.get(fileUri.fsPath)?.getOriginalAttributeContent ?? '';
            const jsonFromOriginalContent = JSON.parse(originalAttributeContent);

            jsonFromOriginalContent[attributeParts.relativePath] = newFileContent;
            newFileContent = JSON.stringify(jsonFromOriginalContent);
        }
        data[attributeParts.source] = newFileContent;

        requestInit.body = isWebFileV2 ? newFileContent : JSON.stringify(data);
        requestInit.headers = getHeader(accessToken, isWebFileV2);
        requestUrl = getPatchRequestUrl(entityName, column, requestUrl);
    } else {
        sendAPIFailureTelemetry(requestUrl, entityName, httpMethod.PATCH, 0, BAD_REQUEST); // no API request is made in this case since we do not know in which column should we save the value
        showErrorDialog(localize("microsoft-powerapps-portals.webExtension.save.file.error", "Unable to complete the request"), localize("microsoft-powerapps-portals.webExtension.save.file.error.desc", "One or more attribute names have been changed or removed. Contact your admin."));
    }

    if (requestInit.body) {
        const requestSentAtTime = new Date().getTime();
        try {

            const response = await fetch(requestUrl, requestInit);

            sendAPITelemetry(requestUrl, entityName, httpMethod.PATCH, saveDataMap.get(fileUri.fsPath)?.getEntityFileExtensionType);

            if (!response.ok) {
                sendAPIFailureTelemetry(requestUrl, entityName, httpMethod.PATCH, new Date().getTime() - requestSentAtTime, JSON.stringify(response));
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "There’s a problem on the back end"), localize("microsoft-powerapps-portals.webExtension.retry.desc", "Try again"));
                throw new Error(response.statusText);
            }

            sendAPISuccessTelemetry(requestUrl, entityName, httpMethod.PATCH, new Date().getTime() - requestSentAtTime);
        }
        catch (error) {
            const authError = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, entityName, httpMethod.PATCH, new Date().getTime() - requestSentAtTime, authError);
            if (typeof error === "string" && error.includes("Unauthorized")) {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
            }
            else {
                showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
            }
        }
    }
}
