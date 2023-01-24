/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const EntityFolderName = [
    "web-pages"
];

export enum PowerPagesEntityType { // EntityType to foldername mapping
    WEBPAGES,
    WEBFILES,
    WEBTEMPLATE,
    CONTENT_SNIPPET,
    UNKNOWN
}

export const EntityFolderMap: Map<string, PowerPagesEntityType> = new Map<string, PowerPagesEntityType>([
    ["web-pages", PowerPagesEntityType.WEBPAGES],
    ["web-files", PowerPagesEntityType.WEBFILES],
    ["web-template", PowerPagesEntityType.WEBTEMPLATE],
    ["content - snippet", PowerPagesEntityType.CONTENT_SNIPPET]
]);

