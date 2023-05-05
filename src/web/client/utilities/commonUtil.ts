/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { NO_CONTENT } from "../common/constants";
import { IAttributePath } from "../common/interfaces";
import { schemaEntityName } from "../schema/constants";

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
