/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import { convertfromBase64ToString, GetFileNameWithExtension } from '../utilities/commonUtil';
import {
    getRequestURL,
    updateEntityId
} from '../utilities/urlBuilderUtil';
import { getHeader } from '../common/authenticationProvider';
import * as Constants from '../common/constants';
import { ERRORS, showErrorDialog } from '../common/errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { encodeAsBase64, getAttributePath, getEntity, IAttributePath, isBase64Encoded } from '../utilities/schemaHelperUtil';
import WebExtensionContext from "../WebExtensionContext";
import { telemetryEventNames } from '../telemetry/constants';
import { folderExportType, schemaEntityKey } from '../schema/constants';

export async function fetchDataFromDataverseAndUpdateVFS(
    accessToken: string,
    entityName: string,
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

        requestUrl = getRequestURL(dataverseOrgUrl, entityName, entityId, Constants.httpMethod.GET, false);
        WebExtensionContext.telemetry.sendAPITelemetry(requestUrl, entityName, Constants.httpMethod.GET);

        requestSentAtTime = new Date().getTime();
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            vscode.window.showErrorMessage(localize("microsoft-powerapps-portals.webExtension.fetch.file.error", "Failed to fetch file content."));
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(requestUrl, entityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, JSON.stringify(response));
            throw new Error(response.statusText);
        }

        WebExtensionContext.telemetry.sendAPISuccessTelemetry(requestUrl, entityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);

        const result = await response.json();
        const data = result.value;

        if (!data) {
            vscode.window.showErrorMessage("microsoft-powerapps-portals.webExtension.fetch.nocontent.error", "There was no response.");
            throw new Error(ERRORS.EMPTY_RESPONSE);
        }

        for (let counter = 0; counter < data.length; counter++) {
            await createContentFiles(data[counter], entityName, queryParamsMap, languageIdCodeMap, portalFs, entityId, websiteIdToLanguage, accessToken, dataverseOrgUrl);
        }
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        showErrorDialog(localize("microsoft-powerapps-portals.webExtension.fetch.file", "There was a problem opening the workspace"),
            localize("microsoft-powerapps-portals.webExtension.fetch.file.desc", "We encountered an error preparing the file for edit."));
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(requestUrl, entityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
    }
}

async function createContentFiles(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    entityName: string,
    queryParamsMap: Map<string, string>,
    languageIdCodeMap: Map<string, string>,
    portalsFS: PortalsFS,
    entityId: string,
    websiteIdToLanguage: Map<string, string>,
    accessToken: string,
    dataverseOrgUrl: string
) {
    try {
        let lcid: string | undefined = websiteIdToLanguage.get(queryParamsMap.get(Constants.queryParameters.WEBSITE_ID) as string) ?? '';
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_EDIT_LCID,
            { 'lcid': (lcid ? lcid.toString() : '') });

        const entityDetails = getEntity(entityName);
        const attributes = entityDetails?.get(schemaEntityKey.ATTRIBUTES);
        const attributeExtension = entityDetails?.get(schemaEntityKey.ATTRIBUTES_EXTENSION);
        const mappingEntityFetchQuery = entityDetails?.get(schemaEntityKey.MAPPING_ATTRIBUTE_FETCH_QUERY);
        const exportType = entityDetails?.get(schemaEntityKey.EXPORT_TYPE);
        const portalFolderName = queryParamsMap.get(Constants.queryParameters.WEBSITE_NAME) as string;
        const subUri = entityDetails?.get(schemaEntityKey.FILE_FOLDER_NAME);

        if (subUri?.length === 0) {
            throw new Error(ERRORS.SUBURI_EMPTY);
        }

        let filePathInPortalFS = '';
        if (exportType && (exportType === folderExportType.SubFolders || exportType === folderExportType.SingleFolder)) {
            filePathInPortalFS = `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
            await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
        }

        if (!attributes || !attributeExtension) {
            throw new Error(ERRORS.ATTRIBUTES_EMPTY);
        }

        const fetchedFileName = entityDetails?.get(schemaEntityKey.FILE_NAME_FIELD);
        const fileName = fetchedFileName ? result[fetchedFileName] : Constants.EMPTY_FILE_NAME;

        if (fileName === Constants.EMPTY_FILE_NAME) {
            throw new Error(ERRORS.FILE_NAME_EMPTY);
        }

        if (exportType && (exportType === folderExportType.SubFolders)) {
            filePathInPortalFS = `${Constants.PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/`;
            await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
        }

        const languageCodeAttribute = entityDetails?.get(schemaEntityKey.LANGUAGE_FIELD);
        lcid = languageCodeAttribute && result[languageCodeAttribute] ? websiteIdToLanguage.get(result[languageCodeAttribute]) : lcid;

        const languageCode = languageIdCodeMap?.size && lcid ? languageIdCodeMap.get(lcid) as string : Constants.DEFAULT_LANGUAGE_CODE;
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_EDIT_LANGUAGE_CODE,
            { 'languageCode': (languageCode ? languageCode.toString() : '') });

        const attributeArray = attributes.split(',');
        const attributeExtensionMap = attributeExtension as unknown as Map<string, string>;
        let counter = 0;

        let fileUri = '';
        for (counter; counter < attributeArray.length; counter++) {
            const base64Encoded: boolean = isBase64Encoded(entityName, attributeArray[counter]); // update func for webfiles for V2
            const attributePath: IAttributePath = getAttributePath(attributeArray[counter]);
            let fileContent = result[attributePath.source] ?? Constants.NO_CONTENT;

            if (result[attributePath.source] && attributePath.relativePath.length) {
                fileContent = JSON.parse(result[attributePath.source])[attributePath.relativePath];
            } else if (mappingEntityFetchQuery) {
                fileContent = await getMappingEntityContent(
                    mappingEntityFetchQuery,
                    attributeArray[counter],
                    entityName,
                    entityId,
                    accessToken,
                    dataverseOrgUrl
                );
            }

            const fileExtension = attributeExtensionMap?.get(attributeArray[counter]) as string;
            const fileNameWithExtension = GetFileNameWithExtension(entityName,
                fileName,
                languageCode,
                fileExtension);
            fileUri = filePathInPortalFS + fileNameWithExtension;

            await createVirtualFile(
                portalsFS,
                fileUri,
                base64Encoded ? convertfromBase64ToString(fileContent) : fileContent,
                updateEntityId(entityName, entityId, result),
                attributePath,
                encodeAsBase64(entityName, attributeArray[counter]),
                entityName,
                fileNameWithExtension,
                result[attributePath.source] ?? Constants.NO_CONTENT,
                fileExtension,
                result[Constants.ODATA_ETAG],
                result[Constants.MIMETYPE]);
        }

        await WebExtensionContext.updateSingleFileUrisInContext(vscode.Uri.parse(fileUri));

        // Not awaited intentionally
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(fileUri), { background: true, preview: false });
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_VSCODE_START_COMMAND,
            { 'commandId': 'vscode.open', 'type': 'file' });
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        vscode.window.showErrorMessage(localize("microsoft-powerapps-portals.webExtension.fetch.authorization.error", "Failed to get file ready for edit."));
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_CONTENT_FILE_CREATION_FAILED, errorMsg);
    }

}

async function getMappingEntityContent(
    mappingEntityFetchQuery: string,
    attributeKey: string,
    entity: string,
    entityId: string,
    accessToken: string,
    dataverseOrgUrl: string
) {
    let requestSentAtTime = new Date().getTime();
    const mappingEntityFetchQueryMap = mappingEntityFetchQuery as unknown as Map<string, string>;
    const requestUrl = getRequestURL(dataverseOrgUrl,
        entity,
        entityId,
        Constants.httpMethod.GET,
        false,
        mappingEntityFetchQueryMap?.get(attributeKey) as string);

    WebExtensionContext.telemetry.sendAPITelemetry(requestUrl,
        entity,
        Constants.httpMethod.GET);
    requestSentAtTime = new Date().getTime();

    const response = await fetch(requestUrl, {
        headers: getHeader(accessToken),
    });

    if (!response.ok) {
        WebExtensionContext.telemetry.sendAPIFailureTelemetry(requestUrl, entity, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, JSON.stringify(response));
        throw new Error(response.statusText);
    }

    WebExtensionContext.telemetry.sendAPISuccessTelemetry(requestUrl, entity, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);

    const result = await response.json();
    return result.value ?? Constants.NO_CONTENT;
}

async function createVirtualFile(
    portalsFS: PortalsFS,
    fileUri: string,
    fileContent: string | undefined,
    entityId: string,
    attributePath: IAttributePath,
    encodeAsBase64: boolean,
    entityName: string,
    fileName: string,
    originalAttributeContent: string,
    fileExtension: string,
    odataEtag: string,
    mimeType?: string
) {
    // Maintain file information in context
    await WebExtensionContext.updateFileDetailsInContext(
        fileUri,
        entityId,
        entityName,
        fileName,
        odataEtag,
        fileExtension,
        attributePath,
        encodeAsBase64,
        mimeType);

    // Call file system provider write call for buffering file data in VFS
    await portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(fileContent), { create: true, overwrite: true });

    // Maintain entity details in context
    await WebExtensionContext.updateEntityDetailsInContext(entityId, entityName, odataEtag, attributePath, originalAttributeContent);
}
