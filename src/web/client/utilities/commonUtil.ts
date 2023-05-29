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
    if (
        entity === schemaEntityName.WEBPAGES ||
        entity === schemaEntityName.CONTENTSNIPPETS
    ) {
        return `${fileName}.${languageCode}.${extension}`;
    } else if (entity === schemaEntityName.WEBTEMPLATES) {
        return `${fileName}.${extension}`;
    }

    return fileName;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GetFileContent(result: any, attributePath: IAttributePath) {
    let fileContent = result[attributePath.source] ?? NO_CONTENT;

    if (result[attributePath.source] && attributePath.relativePath.length) {
        fileContent =
            JSON.parse(result[attributePath.source])[
                attributePath.relativePath
            ] ?? NO_CONTENT;
    }

    return fileContent;
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
export function isNullOrUndefined(object: {} | null | undefined): boolean {
    return object === null || object === undefined;
  }