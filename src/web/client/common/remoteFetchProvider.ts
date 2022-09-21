/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import {
    sendAPIFailureTelemetry,
    sendAPISuccessTelemetry,
    sendAPITelemetry,
    sendErrorTelemetry
} from '../telemetry/webExtensionTelemetry';
import { fromBase64, GetFileNameWithExtension, useBase64 } from '../utility/CommonUtility';
import {
    getRequestURL,
    updateEntityId
} from '../utility/UrlBuilder';
import { getHeader } from './authenticationProvider';
import * as Constants from './constants';
import { PORTALS_URI_SCHEME } from './constants';
import { ERRORS, showErrorDialog } from './errorHandler';
import { PortalsFS } from './fileSystemProvider';
import { SaveEntityDetails } from './portalSchemaInterface';
import PowerPlatformExtensionContextManager from "./localStore";

export async function fetchData(
    accessToken: string,
    entity: string,
    entityId: string,
    queryParamsMap: Map<string, string>,
    entitiesSchemaMap: Map<string, Map<string, string>>,
    languageIdCodeMap: Map<string, string>,
    portalFs: PortalsFS,
    websiteIdToLanguage: Map<string, string>
) {
    let requestUrl = '';
    let requestSentAtTime = new Date().getTime();
    try {
        const dataverseOrgUrl = queryParamsMap.get(Constants.ORG_URL) as string;

        requestUrl = getRequestURL(dataverseOrgUrl, entity, entityId, Constants.httpMethod.GET, false);
        sendAPITelemetry(requestUrl);

        requestSentAtTime = new Date().getTime();
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.fetch.authorization.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.fetch.authorization.desc", "Try again"));
            sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, response.statusText);
            throw new Error(response.statusText);
        }

        sendAPISuccessTelemetry(requestUrl, new Date().getTime() - requestSentAtTime);

        const result = await response.json();
        const data = result.value;

        if (!data) {
            vscode.window.showErrorMessage(ERRORS.EMPTY_RESPONSE);
        }

        for (let counter = 0; counter < data.length; counter++) {
            createContentFiles(data[counter], entity, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalFs, entityId, websiteIdToLanguage);
        }
    } catch (error) {
        console.log("fetchData", error);
        const authError = (error as Error)?.message;
        if (typeof error === "string" && error.includes("Unauthorized")) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
        }
        else {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
        }
        sendAPIFailureTelemetry(requestUrl, new Date().getTime() - requestSentAtTime, authError);
    }
}

async function createContentFiles(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    entity: string,
    queryParamsMap: Map<string, string>,
    entitiesSchemaMap: Map<string, Map<string, string>>,
    languageIdCodeMap: Map<string, string>,
    portalsFS: PortalsFS,
    entityId: string,
    websiteIdToLanguage: Map<string, string>
) {
    const lcid: string | undefined = websiteIdToLanguage.get(queryParamsMap.get(Constants.WEBSITE_ID) as string)
        ? websiteIdToLanguage.get(queryParamsMap.get(Constants.WEBSITE_ID) as string)
        : Constants.DEFAULT_LANGUAGE_CODE;
    const entityEntry = entitiesSchemaMap.get(Constants.pathParamToSchema.get(entity) as string);
    const attributes = entityEntry?.get('_attributes');
    const exportType = entityEntry?.get('_exporttype');
    const portalFolderName = queryParamsMap.get(Constants.WEBSITE_NAME) as string;
    const subUri = entitiesSchemaMap.get(Constants.pathParamToSchema.get(entity) as string)?.get(Constants.FILE_FOLDER_NAME);
    let languageCode: string = Constants.DEFAULT_LANGUAGE_CODE;

    console.log("powerpagedebug createContentFiles", languageIdCodeMap?.size, lcid);

    if (languageIdCodeMap?.size && lcid) {
        languageCode = languageIdCodeMap.get(lcid) as string
            ? languageIdCodeMap.get(lcid) as string
            : Constants.DEFAULT_LANGUAGE_CODE;
    }

    let filePathInPortalFS = '';
    if (exportType && (exportType === Constants.exportType.SubFolders || exportType === Constants.exportType.SingleFolder)) {
        filePathInPortalFS = `${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/`;
        await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
    }

    if (attributes) {
        let fileName = Constants.EMPTY_FILE_NAME;
        const fetchedFileName = entitiesSchemaMap.get(Constants.pathParamToSchema.get(entity) as string)?.get(Constants.FILE_NAME_FIELD);

        if (fetchedFileName) {
            fileName = result[fetchedFileName];
        }

        if (fileName === Constants.EMPTY_FILE_NAME) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.file-not-found.error", "That file is not available"), localize("microsoft-powerapps-portals.webExtension.file-not-found.desc", "The metadata may have changed on the Dataverse side. Contact your admin."));
            sendErrorTelemetry(Constants.telemetryEventNames.WEB_EXTENSION_EMPTY_FILE_NAME);
            return;
        }

        if (exportType && (exportType === Constants.exportType.SubFolders)) {
            filePathInPortalFS = `${PORTALS_URI_SCHEME}:/${portalFolderName}/${subUri}/${fileName}/`;
            await portalsFS.createDirectory(vscode.Uri.parse(filePathInPortalFS, true));
        }

        const attributeArray = attributes.split(',');
        let counter = 0;

        let fileUri = '';
        for (counter; counter < attributeArray.length; counter++) {
            const useBase64Encoding = useBase64(entity, attributeArray[counter]);
            const value = result[attributeArray[counter]] ? result[attributeArray[counter]] : Constants.NO_CONTENT;
            const fileNameWithExtension = GetFileNameWithExtension(entity,
                fileName,
                languageCode,
                Constants.columnExtension.get(attributeArray[counter]) as string);
            fileUri = filePathInPortalFS + fileNameWithExtension;

            await createVirtualFile(
                portalsFS,
                fileUri,
                useBase64Encoding ? fromBase64(value) : value,
                updateEntityId(entity, entityId, result),
                attributeArray[counter] as string,
                useBase64Encoding,
                entity,
                result[Constants.MIMETYPE]);
        }

        // Display only the last file
        vscode.window.showTextDocument(vscode.Uri.parse(fileUri));
    }
    //registerSaveProvider(accessToken, portalsFS, dataverseOrgUrl, saveDataMap);
}

async function createVirtualFile(
    portalsFS: PortalsFS,
    fileUri: string,
    data: string | undefined,
    entityId: string,
    saveDataAttribute: string,
    useBase64Encoding: boolean,
    entity: string,
    mimeType?: string
) {
    const saveEntityDetails = new SaveEntityDetails(entityId, entity, saveDataAttribute, useBase64Encoding, mimeType);
    const dataMap: Map<string, SaveEntityDetails> = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext().saveDataMap;

    await portalsFS.writeFile(vscode.Uri.parse(fileUri), new TextEncoder().encode(data), { create: true, overwrite: true });
    dataMap.set(vscode.Uri.parse(fileUri).fsPath, saveEntityDetails);

    PowerPlatformExtensionContextManager.updatSaveDataDetailsInContext(dataMap);
}

export async function getDataFromDataVerse(accessToken: string,
    entity: string,
    entityId: string,
    queryParamMap: Map<string, string>,
    entitiesSchemaMap: Map<string, Map<string, string>>,
    languageIdCodeMap: Map<string, string>,
    portalFs: PortalsFS,
    websiteIdToLanguage: Map<string, string>
) {
    console.log("getDataFromDataVerse", accessToken, entity, entityId, queryParamMap.size, entitiesSchemaMap.size, languageIdCodeMap.size, websiteIdToLanguage.size);
    vscode.window.showInformationMessage(localize("microsoft-powerapps-portals.webExtension.fetch.file.message", "Fetching your file ..."));
    await fetchData(accessToken, entity, entityId, queryParamMap, entitiesSchemaMap, languageIdCodeMap, portalFs, websiteIdToLanguage);
}
