/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const SCHEMA_WEBFILE_FOLDER_NAME = "web-files";

export enum schemaKey {
    SINGLE_ENTITY_URL = "singleEntityURL",
    MULTI_ENTITY_URL = "multiEntityURL",
    DATAVERSE_API_VERSION = "version",
    DATA = "data",
    API = "api",
}

export enum schemaEntityKey {
    FILE_NAME_FIELD = "_primarynamefield",
    FILE_ID_FIELD = "_primaryidfield",
    FILE_FOLDER_NAME = "_foldername",
    LANGUAGE_FIELD = "_languagefield",
    ATTRIBUTES_EXTENSION = "_attributesExtension",
    DATAVERSE_ENTITY_METADATA = "_dataverseentitymetadata",
    VSCODE_ENTITY_NAME = "_vscodeentityname",
    DATAVERSE_ENTITY_NAME = "_dataverseenityname",
    FETCH_QUERY_PARAMETERS = "_fetchQueryParameters",
    MULTI_FILE_FETCH_QUERY_PARAMETERS = "_multiFileFetchQueryParameters",
    MAPPING_ENTITY_ID = "_mappingEntityId",
    MAPPING_ENTITY = "_mappingEntity",
    MAPPING_ENTITY_FETCH_QUERY = "_mappingEntityFetchQuery",
    EXPORT_TYPE = "_exporttype",
    ATTRIBUTES = "_attributes",
    ROOT_WEB_PAGE_ID = "_rootwebpageid",
}

export enum schemaMetaDataKey {
    DATAVERSE_LOGICAL_ENTITY_NAME = "_dataverselogicalentityname",
    DATAVERSE_FORM_NAME = "_dataverseformname",
}

export interface SchemaEntityMetadata {
    logicalEntityName?: string;
    logicalFormName?: string;
}

export enum schemaEntityName {
    WEBFILES = "webfiles",
    WEBPAGES = "webpages",
    WEBTEMPLATES = "webtemplates",
    SERVERLOGICS = "serverlogics",
    CONTENTSNIPPETS = "contentsnippet",
    LISTS = "lists",
    BASICFORMS = "basicforms",
    ADVANCEDFORMS = "advancedforms",
    ADVANCEDFORMSTEPS = "advancedformsteps",
    BLOGS = "blogs",
    IDEAS = "ideas",
}

export enum MultiFileSupportedEntityName {
    WEBFILES = "webfiles",
    WEBPAGES = "webpages",
    SERVERLOGICS = "serverlogics",
    WEBTEMPLATES = "webtemplates",
    CONTENTSNIPPETS = "contentsnippet",
    LISTS = "lists",
    BASICFORMS = "basicforms",
    ADVANCEDFORMS = "advancedforms",
    BLOGS = "blogs",
    IDEAS = "ideas",
}

// This decides the folder hierarchy a file being displayed in File explorer will follow.
// This value is also maintained in portalSchema entities definition as _exporttype
export enum folderExportType {
    SubFolders = "SubFolders",
    SingleFolder = "SingleFolder",
    SingleFile = "SingleFile",
}

// Entity attributes that need to be saved in base64 encoding - example documentBody
export enum entityAttributesWithBase64Encoding {
    documentbody = "documentbody",
    filecontent = "filecontent",
}

export enum EntityMetadataKeyCore {
    ENTITY_LOGICAL_NAME = "content.entityname",
    FORM_LOGICAL_NAME = "content.formname",
    WEBFORM_STEPS = "content.webFormSteps",
}

export enum EntityMetadataKeyAdx {
    ENTITY_LOGICAL_NAME = "adx_entityname",
    FORM_LOGICAL_NAME = "adx_formname",
}

export const WEBPAGE_FOLDER_CONSTANTS = {
    DELIMITER: '#',
    NO_ROOT_PLACEHOLDER: 'no-root',
    NULL_PLACEHOLDER: 'null',
} as const;

export function getRootWebPageIdForTelemetry(rootWebPageId: string | undefined | null): string {
    return rootWebPageId || WEBPAGE_FOLDER_CONSTANTS.NULL_PLACEHOLDER;
}
