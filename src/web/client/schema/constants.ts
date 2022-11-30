/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export enum schemaKey {
    SINGLE_ENTITY_URL = 'singleEntityURL',
    MULTI_ENTITY_URL = 'multiEntityURL',
    SCHEMA_VERSION = 'schema',
    DATAVERSE_API_VERSION = 'version',
    DATA = 'data',
    API = 'api'
}

export enum schemaEntityKey {
    FILE_NAME_FIELD = '_primarynamefield',
    FILE_FOLDER_NAME = '_foldername',
    LANGUAGE_FIELD = '_languagefield',
    ATTRIBUTES_EXTENSION = '_attributesExtension',
    DATAVERSE_ENTITY_NAME = '_dataverseenityname',
    FETCH_QUERY_PARAMETERS = '_fetchQueryParameters',
    MAPPING_ENTITY_ID = '_mappingEntityId',
    MAPPING_ATTRIBUTE_FETCH_QUERY = '_mappingAttributeFetchQuery'
}

export enum schemaEntityName {
    WEBFILES = "webfiles",
    WEBPAGES = "webpages",
    WEBTEMPLATES = "webtemplates",
    CONTENTSNIPPETS = "contentsnippet"
}

// This decides the folder hierarchy a file being displayed in File explorer will follow.
// This value is also maintained in portalSchema entities definition as _exporttype
export enum folderExportType {
    SubFolders = "SubFolders",
    SingleFolder = "SingleFolder",
    SingleFile = "SingleFile"
}

// Entity attributes that need to be saved in base64 encoding - example documentBody
export enum entityAttributesWithBase64Encoding {
    documentbody = "documentbody",
    filecontent = "filecontent"
}
