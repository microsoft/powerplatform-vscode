/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    BASE_64,
    DATA,
    MULTI_FILE_FEATURE_SETTING_NAME,
    NO_CONTENT,
    VERSION_CONTROL_FOR_WEB_EXTENSION_SETTING_NAME
} from "../common/constants";
import { IAttributePath } from "../common/interfaces";
import { schemaEntityName } from "../schema/constants";
import { telemetryEventNames } from "../telemetry/constants";
import WebExtensionContext from "../WebExtensionContext";
import { SETTINGS_EXPERIMENTAL_STORE_NAME } from "../../../client/constants";
import { doesFileExist } from "./fileAndEntityUtil";

// decodes file content to UTF-8
export function convertContentToUint8Array(content: string, isBase64Encoded: boolean): Uint8Array {
    return isBase64Encoded ? new Uint8Array(Buffer.from(content, BASE_64)) :
        new TextEncoder().encode(content as string);
}

// encodes file content to base64 or returns the content as is
export function convertContentToString(content: string, isBase64Encoded: boolean): string {
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
export function GetFileContent(result: any, attributePath: IAttributePath) {
    let fileContent = result[attributePath.source] ?? NO_CONTENT;

    try {
        if (result[attributePath.source] && attributePath.relativePath.length) {
            fileContent =
                JSON.parse(result[attributePath.source])[
                attributePath.relativePath
                ] ?? NO_CONTENT;
        }
    }
    catch (error) {
        const errorMsg = (error as Error)?.message;
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_GET_FILE_CONTENT_ERROR, errorMsg);
    }

    if (fileContent === NO_CONTENT) {
        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION__FILE_NO_CONTENT);
    }

    return fileContent;
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
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_SET_FILE_CONTENT_ERROR, errorMsg);
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