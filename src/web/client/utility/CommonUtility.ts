/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { schemaEntityName } from "../common/constants";

// decodes base64 to text
export function fromBase64(data: string) {
    return decodeURIComponent(escape(atob(data)));
}

// encodes text to UTF-8 bytes which are then encoded to base64
export function toBase64(data: string) {
    return btoa(unescape(encodeURIComponent(data)));
}

export function GetFileNameWithExtension(
    entity: string,
    fileName: string,
    languageCode: string,
    extension: string
) {
    if (entity === schemaEntityName.WEBPAGES
        || entity === schemaEntityName.CONTENTSNIPPETS) {
        return `${fileName}.${languageCode}.${extension}`;
    } else if (entity === schemaEntityName.WEBTEMPLATES) {
        return `${fileName}.${extension}`;
    }

    return fileName;
}
