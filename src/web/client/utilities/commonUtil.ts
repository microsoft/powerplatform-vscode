/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    NO_CONTENT,
    VERSION_CONTROL_FOR_WEB_EXTENSION_SETTING_NAME,
} from "../common/constants";
import { IAttributePath } from "../common/interfaces";
import { schemaEntityName } from "../schema/constants";
import { telemetryEventNames } from "../telemetry/constants";
import WebExtensionContext from "../WebExtensionContext";
import { SETTINGS_EXPERIMENTAL_STORE_NAME } from "../../../client/constants";

// decodes base64 to text
export function convertfromBase64ToString(data: string) {
    return decodeURIComponent(escape(atob(data)));
}

// encodes text to UTF-8 bytes which are then encoded to base64
export function convertStringtoBase64(data: string) {
    return btoa(unescape(encodeURIComponent(data)));
}

export function GetFileNameWithExtension(
    entity: string,
    fileName: string,
    languageCode: string,
    extension: string
) {
    fileName = isLanguageCodeNeededInFileName(entity) ? `${fileName}.${languageCode}` : fileName;
    fileName = isExtensionNeededInFileName(entity) ? `${fileName}.${extension}` : fileName;

    return fileName;
}

export function isLanguageCodeNeededInFileName(entity: string){
    return entity === schemaEntityName.WEBPAGES ||
    entity === schemaEntityName.CONTENTSNIPPETS;
}

export function isExtensionNeededInFileName(entity: string){
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
   catch (error){
        const errorMsg = (error as Error)?.message;
        WebExtensionContext.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_GET_FILE_CONTENT_ERROR, errorMsg);
    } 

    return fileContent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setFileContent(result: any, attributePath: IAttributePath, content: any[]){
    try{
        if(attributePath.relativePath.length > 0){
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
    } catch (error){
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

    return isVersionControlEnabled;
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