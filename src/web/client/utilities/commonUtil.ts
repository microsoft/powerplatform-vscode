/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    BACK_TO_STUDIO_URL_TEMPLATE,
    BASE_64,
    CO_PRESENCE_FEATURE_SETTING_NAME,
    DATA,
    MULTI_FILE_FEATURE_SETTING_NAME,
    NO_CONTENT,
    STUDIO_PROD_REGION,
    VERSION_CONTROL_FOR_WEB_EXTENSION_SETTING_NAME,
    portalSchemaVersion,
    queryParameters
} from "../common/constants";
import { IAttributePath } from "../common/interfaces";
import { schemaEntityName } from "../schema/constants";
import { telemetryEventNames } from "../telemetry/constants";
import WebExtensionContext from "../WebExtensionContext";
import { SETTINGS_EXPERIMENTAL_STORE_NAME } from "../../../client/constants";
import { doesFileExist, getFileAttributePath, getFileEntityName, updateEntityColumnContent, updateFileDirtyChanges } from "./fileAndEntityUtil";
import { isWebFileV2 } from "./schemaHelperUtil";

// decodes file content to UTF-8
export function convertContentToUint8Array(content: string, isBase64Encoded: boolean): Uint8Array {
    return isBase64Encoded ? new Uint8Array(Buffer.from(content, BASE_64)) :
        new TextEncoder().encode(content as string);
}

// encodes file content to base64 or returns the content as is
export function convertContentToString(content: string | Uint8Array, isBase64Encoded: boolean): string | Uint8Array {
    return isBase64Encoded ? Buffer.from(content).toString(BASE_64) : content;
}

export function GetFileNameWithExtension(
    entity: string,
    fileName: string,
    languageCode: string,
    extension: string
) {
    fileName = isLanguageCodeNeededInFileName(entity) ? `${fileName}.${languageCode}` : fileName;
    fileName = isExtensionNeededInFileName(entity) ? `${fileName}.${extension}` : fileName;

    return getSanitizedFileName(fileName);
}

export function isLanguageCodeNeededInFileName(entity: string) {
    return entity === schemaEntityName.WEBPAGES ||
        entity === schemaEntityName.CONTENTSNIPPETS;
}

export function isExtensionNeededInFileName(entity: string) {
    return entity === schemaEntityName.WEBTEMPLATES
        || entity === schemaEntityName.LISTS
        || entity === schemaEntityName.ADVANCEDFORMSTEPS
        || entity === schemaEntityName.BASICFORMS
        || entity === schemaEntityName.WEBPAGES
        || entity === schemaEntityName.CONTENTSNIPPETS;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getAttributeContent(result: any, attributePath: IAttributePath, entityName: string, entityId: string) {
    let value = result[attributePath.source] ?? NO_CONTENT;

    try {
        if (result[attributePath.source] && attributePath.relativePath.length) {
            value =
                JSON.parse(result[attributePath.source])[attributePath.relativePath] ?? NO_CONTENT;
        }
    }
    catch (error) {
        const errorMsg = (error as Error)?.message;
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_ATTRIBUTE_CONTENT_ERROR,
            getAttributeContent.name,
            `For ${entityName} with entityId ${entityId} and attributePath ${JSON.stringify(attributePath)} error: ${errorMsg}`);
    }

    return value;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setFileContent(result: any, attributePath: IAttributePath, content: any[]) {
    try {
        if (attributePath.relativePath.length > 0) {
            const jsonFromOriginalContent = JSON.parse(
                result[attributePath.source]
            );

            jsonFromOriginalContent[attributePath.relativePath] =
                content;
            result[attributePath.source] = JSON.stringify(jsonFromOriginalContent);
        }
        else {
            result[attributePath.source] = content;
        }
    } catch (error) {
        const errorMsg = (error as Error)?.message;
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_SET_FILE_CONTENT_ERROR, setFileContent.name, errorMsg);
    }
}

export function isVersionControlEnabled() {
    const isVersionControlEnabled = vscode.workspace
        .getConfiguration(SETTINGS_EXPERIMENTAL_STORE_NAME)
        .get(VERSION_CONTROL_FOR_WEB_EXTENSION_SETTING_NAME);

    if (!isVersionControlEnabled) {
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_DIFF_VIEW_FEATURE_FLAG_DISABLED
        );
    }

    return isVersionControlEnabled as boolean;
}

export function isMultifileEnabled() {
    const isMultifileEnabled = vscode.workspace
        .getConfiguration(SETTINGS_EXPERIMENTAL_STORE_NAME)
        .get(MULTI_FILE_FEATURE_SETTING_NAME);

    if (!isMultifileEnabled) {
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_MULTI_FILE_FEATURE_FLAG_DISABLED
        );
    }
    else {
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_MULTI_FILE_FEATURE_FLAG_ENABLED
        );
    }

    return isMultifileEnabled as boolean;
}

export function isCoPresenceEnabled() {
    const isCoPresenceEnabled = vscode.workspace
        .getConfiguration(SETTINGS_EXPERIMENTAL_STORE_NAME)
        .get(CO_PRESENCE_FEATURE_SETTING_NAME);

    if (!isCoPresenceEnabled) {
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_CO_PRESENCE_FEATURE_FLAG_DISABLED
        );
    }
    else {
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_CO_PRESENCE_FEATURE_FLAG_ENABLED
        );
    }

    return isCoPresenceEnabled as boolean;
}

/**
 * Utility function. Check if it's Null Or Undefined
 * @param object object to be validated
 * @returns true, if it's null or undefined object. Otherwise, it's false
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export function isNullOrUndefined(object: any | null | undefined): boolean {
    return object === null || object === undefined;
}

// Clean up the file name to remove special characters
// Ex: For input: "my_file!@#$%^&*()_|+=?;:'\",<>{}[]\\/"; the output will be "my_file"
export function getSanitizedFileName(fileName: string): string {
    return fileName.trim().replace(/[`~!@#$%^&*()_|+=?;:'",<>{}[\]\\/]/g, '');
}

// Get the file's extension
export function getFileExtension(fileName: string): string | undefined {
    return fileName.split('.').pop();
}

export function getFileExtensionForPreload() {
    return ['css', 'json', 'txt'];
}

export function getImageContent(mimeType: string, fileContent: string) {
    return DATA + mimeType + BASE_64 + fileContent
}

export function isWebfileContentLoadNeeded(fileName: string, fsPath: string): boolean {
    const fileExtension = getFileExtension(fileName) as string;
    const validImageExtensions = getFileExtensionForPreload();

    WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_WEBFILE_EXTENSION,
        { fileExtension: fileExtension });

    return fileExtension !== undefined ?
        validImageExtensions.includes(fileExtension.toLowerCase()) ||
        doesFileExist(fsPath) : false;
}

export function isPortalVersionV1(): boolean {
    return WebExtensionContext.currentSchemaVersion.toLowerCase() === portalSchemaVersion.V1;
}

export function isPortalVersionV2(): boolean {
    return WebExtensionContext.currentSchemaVersion.toLowerCase() === portalSchemaVersion.V2;
}

export function getWorkSpaceName(websiteId: string): string {
    if (isPortalVersionV1()) {
        return `Site-v1-${websiteId}`;
    } else {
        return `Site-v2-${websiteId}`;
    }
}

// ENV_ID is the last part of the parameter value sent in the vscode URL from studio
export function getEnvironmentIdFromUrl() {
    return (WebExtensionContext.urlParametersMap.get(queryParameters.ENV_ID) as string).split("/")?.pop() as string;
}

export function getBackToStudioURL() {
    const region = WebExtensionContext.urlParametersMap.get(queryParameters.REGION) as string;

    return BACK_TO_STUDIO_URL_TEMPLATE
        .replace("{environmentId}", getEnvironmentIdFromUrl())
        .replace("{.region}", region.toLowerCase() === STUDIO_PROD_REGION ? "" : `.${WebExtensionContext.urlParametersMap.get(queryParameters.REGION) as string}`)
        .replace("{webSiteId}", WebExtensionContext.urlParametersMap.get(queryParameters.WEBSITE_ID) as string);
}
export function getSupportedImageFileExtensionsForEdit() {
    return ['png', 'jpg', 'webp', 'bmp', 'tga', 'ico', 'jpeg', 'bmp', 'dib', 'jif', 'jpe', 'tpic']; // Luna paint supported image file extensions
}

export function isImageFileSupportedForEdit(fileName: string): boolean {
    const fileExtension = getFileExtension(fileName) as string;
    const supportedImageFileExtensions = getSupportedImageFileExtensionsForEdit();
    const isSupported = fileExtension !== undefined ?
        supportedImageFileExtensions.includes(fileExtension.toLowerCase()) : false;

    if (isSupported) {
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_IMAGE_EDIT_SUPPORTED_FILE_EXTENSION,
            { fileExtension: fileExtension });
    }

    return isSupported;
}

export function updateFileContentInFileDataMap(fileFsPath: string, fileContent: string | Uint8Array, isFileContentBase64Encoded = false) {
    const fileData =
        WebExtensionContext.fileDataMap.getFileMap.get(fileFsPath);

    // Update the latest content in context
    if (fileData?.entityId && fileData.attributePath) {
        fileContent = convertContentToString(fileContent, isFileContentBase64Encoded ? false : fileData.encodeAsBase64 as boolean);

        updateEntityColumnContent(
            fileData?.entityId,
            fileData.attributePath,
            fileContent
        );
        updateFileDirtyChanges(fileFsPath, true);
    }
}

export function getImageFileContent(fileFsPath: string, fileContent: Uint8Array) {
    const webFileV2 = isWebFileV2(getFileEntityName(fileFsPath), getFileAttributePath(fileFsPath)?.source);

    return webFileV2 ? fileContent : Buffer.from(fileContent).toString(BASE_64);
}
