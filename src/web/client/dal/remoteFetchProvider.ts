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
import { convertfromBase64ToString, GetFileNameWithExtension } from '../utilities/commonUtil';
import {
    getRequestURL,
    updateEntityId
} from '../utilities/urlBuilderUtil';
import { getHeader } from '../common/authenticationProvider';
import * as Constants from '../common/constants';
import { ERRORS, showErrorDialog } from '../common/errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { SaveEntityDetails } from '../schema/portalSchemaInterface';
import PowerPlatformExtensionContextManager from "../extensionContext";
import { getAttributeParts, getEntity, isBase64Encoded, useBase64Encoding } from '../utilities/schemaHelperUtil';
import { telemetryEventNames } from '../telemetry/constants';
import { folderExportType, schemaEntityKey } from '../schema/constants';

export async function fetchDataFromDataverseAndUpdateVFS(
    accessToken: string,
    entity: string,
    entityId: string,
    queryParamsMap: Map<string, string>,
    languageIdCodeMap: Map<string, string>,
    portalFs: PortalsFS,
    websiteIdToLanguage: Map<string, string>
) {
    let requestUrl = '';
    let requestSentAtTime = new Date().getTime();
    try {
        const dataverseOrgUrl = queryParamsMap.get(Constants.queryParameters.ORG_URL) as string;

        requestUrl = getRequestURL(dataverseOrgUrl, entity, entityId, Constants.httpMethod.GET, false);
        sendAPITelemetry(requestUrl, entity, Constants.httpMethod.GET);

        requestSentAtTime = new Date().getTime();
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.fetch.authorization.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.fetch.authorization.desc", "Try again"));
            sendAPIFailureTelemetry(requestUrl, entity, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, JSON.stringify(response));
            throw new Error(response.statusText);
        }

        sendAPISuccessTelemetry(requestUrl, entity, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);

        const result = await response.json();
        const data = result.value;

        if (!data) {
            vscode.window.showErrorMessage(ERRORS.EMPTY_RESPONSE);
        }

        for (let counter = 0; counter < data.length; counter++) {
            await createContentFiles(data[counter], entity, queryParamsMap, languageIdCodeMap, portalFs, entityId, websiteIdToLanguage, accessToken, dataverseOrgUrl);
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
}

async function createContentFiles(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    entity: string,
    queryParamsMap: Map<string, string>,
    languageIdCodeMap: Map<string, string>,
    portalsFS: PortalsFS,
    entityId: string,
    websiteIdToLanguage: Map<string, string>,
    accessToken: string,
    dataverseOrgUrl: string
) {
    let lcid: string | undefined = websiteIdToLanguage.get(queryParamsMap.get(Constants.queryParameters.WEBSITE_ID) as string) ?? '';
    sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_EDIT_LCID, { 'lcid': (lcid ? lcid.toString() : '') });

    const entityDetails = getEntity(entity);
    const attributes = entityDetails?.get('_attributes');
    const attributeExtension = entityDetails?.get(schemaEntityKey.ATTRIBUTES_EXTENSION);
    const mappingEntityFetchQuery = entityDetails?.get(schemaEntityKey.MAPPING_ATTRIBUTE_FETCH_QUERY);
    const exportType = entityDetails?.get('_exporttype');
    const portalFolderName = queryParamsMap.get(Constants.queryParameters.WEBSITE_NAME) as string;
    const subUri = entityDetails?.get(schemaEntityKey.FILE_FOLDER_NAME);

    let filePathInPortalFS = '';
    if (exportType && (exportType === folderExportType.SubFolders || exportType === folderExportType.SingleFolder)) {
        filePathInPortalFS = `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
        await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
    }

    if (attributes && attributeExtension) {
        let fileName = Constants.EMPTY_FILE_NAME;
        const fetchedFileName = entityDetails?.get(schemaEntityKey.FILE_NAME_FIELD);

        if (fetchedFileName) {
            fileName = result[fetchedFileName];
        }

        if (fileName === Constants.EMPTY_FILE_NAME) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.file-not-found.error", "That file is not available"), localize("microsoft-powerapps-portals.webExtension.file-not-found.desc", "The metadata may have changed on the Dataverse side. Contact your admin."));
            sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_EMPTY_FILE_NAME);
            return;
        }

        if (exportType && (exportType === folderExportType.SubFolders)) {
            filePathInPortalFS = `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/`;
            await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
        }

        const languageCodeAttribute = entityDetails?.get(schemaEntityKey.LANGUAGE_FIELD);

        if (languageCodeAttribute && result[languageCodeAttribute]) {
            lcid = websiteIdToLanguage.get(result[languageCodeAttribute]) ?? '';
        }

        let languageCode: string = Constants.DEFAULT_LANGUAGE_CODE;
        if (languageIdCodeMap?.size && lcid) {
            languageCode = languageIdCodeMap.get(lcid) as string ?? Constants.DEFAULT_LANGUAGE_CODE;
        }
        sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_EDIT_LANGUAGE_CODE, { 'languageCode': (languageCode ? languageCode.toString() : '') });

        const attributeArray = attributes.split(',');
        const attributeExtensionMap = attributeExtension as unknown as Map<string, string>;
        let counter = 0;

        let fileUri = '';
        for (counter; counter < attributeArray.length; counter++) {
            const isBase64Encoding = isBase64Encoded(entity, attributeArray[counter]); // update func for webfiles for V2

            const attributeParts = getAttributeParts(attributeArray[counter]);
            let fileContent = result[attributeParts.source] ?? Constants.NO_CONTENT;
            const originalAttributeContent = result[attributeParts.source] ?? Constants.NO_CONTENT;
            if (result[attributeParts.source] && attributeParts.relativePath.length) {
                fileContent = JSON.parse(result[attributeParts.source])[attributeParts.relativePath];
            } else if (mappingEntityFetchQuery) {
                const mappingEntityFetchQueryMap = mappingEntityFetchQuery as unknown as Map<string, string>;
                const requestUrl = getRequestURL(dataverseOrgUrl, entity, entityId, Constants.httpMethod.GET, false, mappingEntityFetchQueryMap?.get(attributeArray[counter]) as string);
                const response = await fetch(requestUrl, {
                    headers: getHeader(accessToken),
                });
                const result = await response.json();
                fileContent = result.value ?? Constants.NO_CONTENT

            }

            const fileNameWithExtension = GetFileNameWithExtension(entity,
                fileName,
                languageCode,
                attributeExtensionMap?.get(attributeArray[counter]) as string);
            fileUri = filePathInPortalFS + fileNameWithExtension;

            await createVirtualFile(
                portalsFS,
                fileUri,
                isBase64Encoding ? convertfromBase64ToString(fileContent) : fileContent,
                updateEntityId(entity, entityId, result),
                attributeArray[counter] as string,
                useBase64Encoding(entity, attributeArray[counter]),
                entity,
                originalAttributeContent,
                result[Constants.MIMETYPE]);
        }

        await PowerPlatformExtensionContextManager.updateSingleFileUrisInContext(vscode.Uri.parse(fileUri));

        // Not awaited intentionally
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(fileUri), { background: true, preview: false });
        sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_VSCODE_START_COMMAND, { 'commandId': 'vscode.open', 'type': 'file' });
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
    const saveEntityDetails = new SaveEntityDetails(entityId, entity, attributePath, originalAttributeContent, useBase64Encoding, mimeType);
    const dataMap: Map<string, SaveEntityDetails> = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext().saveDataMap;
    dataMap.set(vscode.Uri.parse(fileUri).fsPath, saveEntityDetails);
    await PowerPlatformExtensionContextManager.updateSaveDataDetailsInContext(dataMap);

    await portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(fileContent), { create: true, overwrite: true });
}
