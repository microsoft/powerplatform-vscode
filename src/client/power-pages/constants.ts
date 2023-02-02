/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const ContentPages = "content-pages";
export const WebFileYmlExtension = ".webfile.yml";

export const EntityFolderName = [
    "web-pages",
    "web-files",
    "web-templates",
    "content-snippets",
    "polls",
    "weblink-sets",
    "basic-forms",
    "advanced-forms"
];

export enum PowerPagesEntityType { // EntityType to foldername mapping
    WEBPAGES,
    WEBFILES,
    WEBTEMPLATES,
    CONTENT_SNIPPETS,
    WEBLINK_SETS,
    POLLS,
    BASIC_FORMS,
    ADVANCED_FORMS,
    UNKNOWN
}

export const EntityFolderMap: Map<string, PowerPagesEntityType> = new Map<string, PowerPagesEntityType>([
    ["web-pages", PowerPagesEntityType.WEBPAGES],
    ["web-files", PowerPagesEntityType.WEBFILES],
    ["web-templates", PowerPagesEntityType.WEBTEMPLATES],
    ["content-snippets", PowerPagesEntityType.CONTENT_SNIPPETS],
    ["weblink-sets", PowerPagesEntityType.WEBLINK_SETS],
    ["basic-forms", PowerPagesEntityType.BASIC_FORMS],
    ["advanced-forms", PowerPagesEntityType.ADVANCED_FORMS],
    ["polls", PowerPagesEntityType.POLLS]
]);

