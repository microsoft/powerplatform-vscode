/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const schema_data = {
    entities: {
        entity: [
            {
                relationships: "",
                _vscodeentityname: "websites",
                _dataverseenityname: "powerpagesites",
                _displayname: "Website",
                _etc: "10026",
                _primaryidfield: "powerpagesiteid",
                _primarynamefield: "name",
                _disableplugins: "true",
                _foldername: "",
                _propextension: "website",
                _exporttype: "SingleFolder",
                _fetchQueryParameters: "?$select=name,powerpagesiteid,content",
            },
            {
                relationships: "",
                _vscodeentityname: "websitelanguages",
                _dataverseenityname: "powerpagesitelanguages",
                _displayname: "Power Page Site Language",
                _foldername: "",
                _etc: "10273",
                _primaryidfield: "powerpagesitelanguageid",
                _primarynamefield: "name",
                _disableplugins: "false",
                _fetchQueryParameters:
                    "?$select=powerpagesitelanguageid,languagecode,lcid",
            },
            {
                relationships: "",
                _vscodeentityname: "portallanguages",
                _dataverseenityname: "powerpagesitelanguages",
                _displayname: "Power Page Site Language",
                _foldername: "",
                _etc: "10273",
                _primaryidfield: "powerpagesitelanguageid",
                _primarynamefield: "name",
                _disableplugins: "false",
                _fetchQueryParameters:
                    "?$select=powerpagesitelanguageid,languagecode,lcid",
            },
            {
                relationships: "",
                _vscodeentityname: "webpages",
                _dataverseenityname: "powerpagecomponents",
                _displayname: "Web Page",
                _etc: "10271",
                _primaryidfield: "powerpagecomponentid",
                _primarynamefield: "name",
                _disableplugins: "false",
                _exporttype: "SubFolders",
                _foldername: "web-pages",
                _fetchQueryParameters:
                    "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name,content",
                _attributes: "content.copy",
                _attributesExtension: new Map([
                    ["content.copy", "webpage.copy.html"],
                ]),
            },
            {
                relationships: "",
                _vscodeentityname: "webfiles",
                _dataverseenityname: "powerpagecomponents",
                _displayname: "Web File",
                _etc: "10271",
                _primaryidfield: "powerpagecomponentid",
                _primarynamefield: "name",
                _disableplugins: "false",
                _exporttype: "SingleFolder",
                _foldername: "web-files",
                _fetchQueryParameters:
                    "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name",
                _attributes: "filecontent",
                _attributesExtension: new Map([["filecontent", "css"]]),
                _mappingAttributeFetchQuery: new Map([
                    ["filecontent", "({entityId})/filecontent"],
                ]),
            },
            {
                relationships: "",
                _vscodeentityname: "contentsnippet",
                _dataverseenityname: "powerpagecomponents",
                _displayname: "Content Snippet",
                _etc: "10271",
                _primaryidfield: "powerpagecomponentid",
                _primarynamefield: "name",
                _disableplugins: "false",
                _exporttype: "SingleFolder",
                _foldername: "content-snippets",
                _fetchQueryParameters:
                    "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name,content",
                _attributes: "content.value",
                _attributesExtension: new Map([["content.value", "html"]]),
            },
            {
                relationships: "",
                _vscodeentityname: "webtemplates",
                _dataverseenityname: "powerpagecomponents",
                _displayname: "Web Template",
                _etc: "10271",
                _primaryidfield: "powerpagecomponentid",
                _primarynamefield: "name",
                _disableplugins: "false",
                _exporttype: "SingleFolder",
                _foldername: "web-templates",
                _fetchQueryParameters:
                    "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name,content",
                _attributes: "content.source",
                _attributesExtension: new Map([["content.source", "html"]]),
            },
        ],
        dataSourceProperties: {
            api: "api",
            data: "data",
            version: "v9.2",
            schema: "portalschemav2",
            singleEntityURL:
                "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}({entityId})",
            multiEntityURL: "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}",
        },
    },
};

export const schema_data_with_empty_entity = {
    entities: {
        entity: [],
    },
};

export const schema_data_with_empty_dataSourceProperties = {
    entities: {
        dataSourceProperties: [],
    },
};
