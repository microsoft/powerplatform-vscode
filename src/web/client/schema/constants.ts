/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export enum schemaKey {
    SINGLE_ENTITY_URL = "singleEntityURL",
    MULTI_ENTITY_URL = "multiEntityURL",
    SCHEMA_VERSION = "schema",
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
    VSCODE_ENTITY_NAME = "_vscodeentityname",
    DATAVERSE_ENTITY_NAME = "_dataverseenityname",
    FETCH_QUERY_PARAMETERS = "_fetchQueryParameters",
    MULTI_FILE_FETCH_QUERY_PARAMETERS = "_multiFileFetchQueryParameters",
    MAPPING_ENTITY_ID = "_mappingEntityId",
    MAPPING_ATTRIBUTE_FETCH_QUERY = "_mappingAttributeFetchQuery",
    EXPORT_TYPE = "_exporttype",
    ATTRIBUTES = "_attributes",
}

export enum schemaEntityName {
    WEBFILES = "webfiles",
    WEBPAGES = "webpages",
    WEBTEMPLATES = "webtemplates",
    CONTENTSNIPPETS = "contentsnippet",
    LISTS = "lists",
    BASICFORMS = "basicforms",
    ADVANCEDFORMS = "advancedforms",
    ADVANCEDFORMSTEPS = "advancedformsteps",
}

export enum MultiFileSupportedEntityName {
    WEBFILES = "webfiles",
    WEBPAGES = "webpages",
    WEBTEMPLATES = "webtemplates",
    CONTENTSNIPPETS = "contentsnippet",
    LISTS = "lists",
    BASICFORMS = "basicforms",
    ADVANCEDFORMS = "advancedforms",
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

export enum entityAttributeNeedMapping {
    webformsteps = "content.webFormSteps"
}
