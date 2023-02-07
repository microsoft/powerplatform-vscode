/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const WebFileYmlExtension = ".webfile.yml";
export const WebFilesFolder = "web-files";

export const EntityFolderName = [
    "web-pages",
    "web-files",
    "web-templates",
    "content-snippets",
    "polls",
    "poll-placements",
    "weblink-sets",
    "basic-forms",
    "advanced-forms",
    "page-templates",
    "lists",
    "table-permissions"
];

export enum PowerPagesEntityType { // EntityType to foldername mapping
    WEBPAGES,
    WEBFILES,
    WEBTEMPLATES,
    CONTENT_SNIPPETS,
    WEBLINK_SETS,
    POLLS,
    POLL_PLACEMENTS,
    BASIC_FORMS,
    ADVANCED_FORMS,
    PAGE_TEMPLATES,
    LISTS,
    TABLE_PERMISSIONS,
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
    ["polls", PowerPagesEntityType.POLLS],
    ["poll-placements", PowerPagesEntityType.POLL_PLACEMENTS],
    ["page-templates", PowerPagesEntityType.PAGE_TEMPLATES],
    ["lists", PowerPagesEntityType.LISTS],
    ["table-permissions", PowerPagesEntityType.TABLE_PERMISSIONS],
]);

