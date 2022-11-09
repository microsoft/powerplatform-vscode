/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import {
    sendAPIFailureTelemetry,
    sendAPISuccessTelemetry,
    sendAPITelemetry,
    sendErrorTelemetry,
    sendInfoTelemetry
} from '../telemetry/webExtensionTelemetry';
import { fromBase64, GetFileNameWithExtension, useBase64 } from '../utility/CommonUtility';
import {
    getRequestURL,
    updateEntityId
} from '../utility/UrlBuilder';
import { getHeader } from './authenticationProvider';
import * as Constants from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { SaveEntityDetails } from './portalSchemaInterface';
import PowerPlatformExtensionContextManager from "./localStore";
import { getAttributeParts, getEntity } from '../utility/schemaHelper';

export async function fetchDataFromDataverseAndUpdateVFS(
    accessToken: string,
    entity: string,
    entityId: string,
    queryParamsMap: Map<string, string>,
    languageIdCodeMap: Map<string, string>,
    portalFs: PortalsFS,
    websiteIdToLanguage: Map<string, string>
) {
    console.log("remoteFetchProvider", "reached in Fetch from dataverse");
    let requestUrl = '';
    let requestSentAtTime = new Date().getTime();
    try {
        const dataverseOrgUrl = queryParamsMap.get(Constants.queryParameters.ORG_URL) as string;

        requestUrl = getRequestURL(dataverseOrgUrl, entity, entityId, Constants.httpMethod.GET, false);
        console.log("remoteFetchProvider requestUrl", requestUrl);
        sendAPITelemetry(requestUrl, entity, Constants.httpMethod.GET);

        requestSentAtTime = new Date().getTime();
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.fetch.authorization.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.fetch.authorization.desc", "Try again"));
            sendAPIFailureTelemetry(requestUrl, entity, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response.json.toString());
            throw new Error(response.statusText);
        }

        sendAPISuccessTelemetry(requestUrl, entity, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);

        const result = await response.json();
        const data = result.value;

        if (!data) {
            vscode.window.showErrorMessage(ERRORS.EMPTY_RESPONSE);
        }

        for (let counter = 0; counter < data.length; counter++) {
            await createContentFiles(data[counter], entity, queryParamsMap, languageIdCodeMap, portalFs, entityId, websiteIdToLanguage);
        }
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        if (typeof error === "string" && error.includes("Unauthorized")) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
        }
        else {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
        }
        sendAPIFailureTelemetry(requestUrl, entity, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
    }
    console.log("remoteFetchProvider", "ended in Fetch from dataverse");
}

async function createContentFiles(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    entity: string,
    queryParamsMap: Map<string, string>,
    languageIdCodeMap: Map<string, string>,
    portalsFS: PortalsFS,
    entityId: string,
    websiteIdToLanguage: Map<string, string>
) {
    console.log("remoteFetchProvider", "create content file");
    let lcid: string | undefined = websiteIdToLanguage.get(queryParamsMap.get(Constants.queryParameters.WEBSITE_ID) as string) ?? '';
    sendInfoTelemetry(Constants.telemetryEventNames.WEB_EXTENSION_EDIT_LCID, { 'lcid': (lcid ? lcid.toString() : '') });

    const entityDetails = getEntity(entity);
    const attributes = entityDetails?.get('_attributes');
    const attributeExtension = entityDetails?.get(Constants.schemaEntityKey.ATTRIBUTES_EXTENSION);
    const exportType = entityDetails?.get('_exporttype');
    const portalFolderName = queryParamsMap.get(Constants.queryParameters.WEBSITE_NAME) as string;
    const subUri = entityDetails?.get(Constants.schemaEntityKey.FILE_FOLDER_NAME);
    console.log("remoteFetchProvider values", entityDetails, attributes, exportType, portalFolderName, subUri);

    let filePathInPortalFS = '';
    if (exportType && (exportType === Constants.exportType.SubFolders || exportType === Constants.exportType.SingleFolder)) {
        filePathInPortalFS = `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
        await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
    }

    if (attributes && attributeExtension) {
        let fileName = Constants.EMPTY_FILE_NAME;
        const fetchedFileName = entityDetails?.get(Constants.schemaEntityKey.FILE_NAME_FIELD);

        if (fetchedFileName) {
            fileName = result[fetchedFileName];
        }
        console.log("remoteFetchProvider fileName", fileName);

        if (fileName === Constants.EMPTY_FILE_NAME) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.file-not-found.error", "That file is not available"), localize("microsoft-powerapps-portals.webExtension.file-not-found.desc", "The metadata may have changed on the Dataverse side. Contact your admin."));
            sendErrorTelemetry(Constants.telemetryEventNames.WEB_EXTENSION_EMPTY_FILE_NAME);
            return;
        }
        console.log("remoteFetchProvider exportType", exportType);

        if (exportType && (exportType === Constants.exportType.SubFolders)) {
            filePathInPortalFS = `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/`;
            await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
        }

        const languageCodeAttribute = entityDetails?.get(Constants.schemaEntityKey.LANGUAGE_FIELD);

        if (languageCodeAttribute && result[languageCodeAttribute]) {
            lcid = websiteIdToLanguage.get(result[languageCodeAttribute]) ?? '';
        }

        let languageCode: string = Constants.DEFAULT_LANGUAGE_CODE;
        if (languageIdCodeMap?.size && lcid) {
            languageCode = languageIdCodeMap.get(lcid) as string ?? Constants.DEFAULT_LANGUAGE_CODE;
        }
        sendInfoTelemetry(Constants.telemetryEventNames.WEB_EXTENSION_EDIT_LANGUAGE_CODE, { 'languageCode': (languageCode ? languageCode.toString() : '') });
        console.log("remoteFetchProvider languageCode", languageCode, lcid);

        const attributeArray = attributes.split(',');
        const attributeExtensionMap = attributeExtension as unknown as Map<string, string>;
        let counter = 0;

        let fileUri = '';
        for (counter; counter < attributeArray.length; counter++) {
            const useBase64Encoding = useBase64(entity, attributeArray[counter]); // update func for webfiles for V2

            const attributeParts = getAttributeParts(attributeArray[counter]);
            console.log("remoteFetchProvider getAttributeParts", attributeParts.source, attributeParts.relativePath);
            let fileContent = result[attributeParts.source] ?? Constants.NO_CONTENT;
            console.log("remoteFetchProvider fileContent", fileContent);
            const originalAttributeContent = result[attributeParts.source] ?? Constants.NO_CONTENT;
            console.log("remoteFetchProvider originalAttributeContent", originalAttributeContent);
            if (result[attributeParts.source] && attributeParts.relativePath.length) {
                console.log("remoteFetchProvider attributeParts.relativePath", attributeParts.relativePath);
                console.log("remoteFetchProvider JSON.parse(result[attributeParts.source])", JSON.parse(result[attributeParts.source]));
                fileContent = JSON.parse(result[attributeParts.source])[attributeParts.relativePath];
                console.log("remoteFetchProvider fileContent", fileContent);
            }
            console.log("remoteFetchProvider fileNameWithExtension", counter, attributeArray.length);
            console.log("remoteFetchProvider fileNameWithExtension", counter, attributeArray.length, attributeArray[counter] as string);

            const fileNameWithExtension = GetFileNameWithExtension(entity,
                fileName,
                languageCode,
                attributeExtensionMap?.get(attributeArray[counter]) as string);
            console.log("remoteFetchProvider fileNameWithExtension", fileNameWithExtension);
            fileUri = filePathInPortalFS + fileNameWithExtension;
            console.log("remoteFetchProvider fileUri", fileUri);

            await createVirtualFile(
                portalsFS,
                fileUri,
                useBase64Encoding ? fromBase64(fileContent) : fileContent,
                updateEntityId(entity, entityId, result),
                attributeArray[counter] as string,
                useBase64Encoding,
                entity,
                originalAttributeContent,
                result[Constants.MIMETYPE]);
        }

        await PowerPlatformExtensionContextManager.updateSingleFileUrisInContext(vscode.Uri.parse(fileUri));

        // Not awaited intentionally
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(fileUri), { background: true, preview: false });
        sendInfoTelemetry("StartCommand", { 'commandId': 'vscode.open', 'type': 'file' });
    }
}

async function createVirtualFile(
    portalsFS: PortalsFS,
    fileUri: string,
    fileContent: string | undefined,
    entityId: string,
    attributePath: string,
    useBase64Encoding: boolean,
    entity: string,
    originalAttributeContent: string,
    mimeType?: string
) {
    console.log("remoteFetchProvider createVirtualFile");
    const saveEntityDetails = new SaveEntityDetails(entityId, entity, attributePath, originalAttributeContent, useBase64Encoding, mimeType);
    const dataMap: Map<string, SaveEntityDetails> = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext().saveDataMap;
    dataMap.set(vscode.Uri.parse(fileUri).fsPath, saveEntityDetails);
    await PowerPlatformExtensionContextManager.updateSaveDataDetailsInContext(dataMap);

    await portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(fileContent), { create: true, overwrite: true });
    console.log("remoteFetchProvider createVirtualFile", "create content file for old data model");
}
