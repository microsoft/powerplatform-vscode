/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const portal_schema_V1 = {
    "entities": {
        "dataSourceProperties": {
            api: "api",
            data: "data",
            version: "v9.2",
            schema: "portalschemav1",
            singleEntityURL: "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}({entityId})",
            multiEntityURL: "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}"
        },
        "entity": [
            {
                "relationships": "",
                "_vscodeentityname": "websites",
                "_dataverseenityname": "adx_websites",
                "_displayname": "Website",
                "_etc": "10026",
                "_primaryidfield": "adx_websiteid",
                "_primarynamefield": "adx_name",
                "_disableplugins": "true",
                "_foldername": "",
                "_propextension": "website",
                "_exporttype": "SingleFolder",
                "_fetchQueryParameters": "?$select=adx_name,adx_websiteid,adx_website_language"
            },
            {
                "_vscodeentityname": "websitelanguages",
                "_dataverseenityname": "adx_websitelanguages",
                "_displayname": "Website Language",
                "_etc": "10046",
                "_primaryidfield": "adx_websitelanguageid",
                "_primarynamefield": "adx_name",
                "_disableplugins": "true",
                "_foldername": "",
                "_propextension": "websitelanguage",
                "_exporttype": "SingleFile",
                "_fetchQueryParameters": "?$select=adx_websitelanguageid,_adx_portallanguageid_value"
            },
            {
                "_vscodeentityname": "portallanguages",
                "_dataverseenityname": "adx_portallanguages",
                "_displayname": "Portal Language",
                "_etc": "10032",
                "_primaryidfield": "adx_portallanguageid",
                "_primarynamefield": "adx_name",
                "_disableplugins": "true",
                "_downloadThroughChild": "true",
                "_foldername": ".portalconfig",
                "_propextension": "portallanguage",
                "_exporttype": "SingleFile",
                "_fetchQueryParameters": "?$select=adx_lcid,adx_languagecode"
            },
            {
                "relationships": "",
                "_vscodeentityname": "webpages",
                "_dataverseenityname": "adx_webpages",
                "_displayname": "Web Page",
                "_etc": "10024",
                "_primaryidfield": "adx_webpageid",
                "_primarynamefield": "adx_name",
                "_disableplugins": "true",
                "_foldername": "web-pages",
                "_propextension": "webpage",
                "_exporttype": "SubFolders",
                "_languagefield": "adx_webpagelanguageid",
                "_languagegroupby": "adx_rootwebpageid",
                "_fetchQueryParameters": "?$filter=adx_webpageid%20eq%20{entityId}&$select=adx_name,adx_copy,adx_customcss,adx_customjavascript,adx_partialurl",
                "_attributes": "adx_customcss,adx_customjavascript,adx_copy",
                "_attributesExtension": new Map([
                    ["adx_customcss", "customcss.css"],
                    ["adx_customjavascript", "customjs.js"],
                    ["adx_copy", "webpage.copy.html"],
                ])
            },
            {
                "relationships": "",
                "_vscodeentityname": "webfiles",
                "_dataverseenityname": "annotations",
                "_displayname": "Web File",
                "_etc": "10020",
                "_primaryidfield": "adx_webfileid",
                "_primarynamefield": "filename",
                "_disableplugins": "true",
                "_foldername": "web-files",
                "_propextension": "webfile",
                "_exporttype": "SingleFolder",
                "_fetchQueryParameters": "?$filter=_objectid_value%20eq%20{entityId}%20&$select=mimetype,documentbody,filename,annotationid",
                "_attributes": "documentbody",
                "_attributesExtension": new Map([
                    ["documentbody", "css"]
                ]),
                "_mappingEntityId": "annotationid" // Webfile in old schema are maintained with two dataverse entity adx_webfile and annotations. This Id acts as foreign key for that mapping
            },
            {
                "relationships": "",
                "_vscodeentityname": "contentsnippet",
                "_dataverseenityname": "adx_contentsnippets",
                "_displayname": "Content Snippet",
                "_etc": "10016",
                "_primaryidfield": "adx_contentsnippetid",
                "_primarynamefield": "adx_name",
                "_disableplugins": "true",
                "_foldername": "content-snippets",
                "_propextension": "contentsnippet",
                "_exporttype": "SingleFolder",
                "_languagefield": "_adx_contentsnippetlanguageid_value",
                "_languagegroupby": "adx_name",
                "_fetchQueryParameters": "?$filter=adx_contentsnippetid%20eq%20{entityId}&$select=adx_name,adx_value,_adx_contentsnippetlanguageid_value",
                "_attributes": "adx_value",
                "_attributesExtension": new Map([
                    ["adx_value", "html"]
                ])
            },
            {
                "relationships": "",
                "_vscodeentityname": "webtemplates",
                "_dataverseenityname": "adx_webtemplates",
                "_displayname": "Web Template",
                "_etc": "10060",
                "_primaryidfield": "adx_webtemplateid",
                "_primarynamefield": "adx_name",
                "_disableplugins": "true",
                "_foldername": "web-templates",
                "_propextension": "webtemplate",
                "_exporttype": "SingleFolder",
                "_fetchQueryParameters": "?$filter=adx_webtemplateid%20eq%20{entityId}&$select=adx_name,adx_source",
                "_attributes": "adx_source",
                "_attributesExtension": new Map([
                    ["adx_source", "html"]
                ])
            }
        ],
        "_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance"
    }
}

export const portal_schema_V2 = {
    "entities": {
        "dataSourceProperties": {
            api: "api",
            data: "data",
            version: "v9.2",
            schema: "portalschemav2",
            singleEntityURL: "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}({entityId})",
            multiEntityURL: "{dataverseOrgUrl}/{api}/{data}/{version}/{entity}"
        },
        "entity": [
            {
                "relationships": "",
                "_vscodeentityname": "websites",
                "_dataverseenityname": "powerpagesites",
                "_displayname": "Website",
                "_etc": "10026",
                "_primaryidfield": "powerpagesiteid",
                "_primarynamefield": "name",
                "_disableplugins": "true",
                "_foldername": "",
                "_propextension": "website",
                "_exporttype": "SingleFolder",
                "_fetchQueryParameters": "?$select=name,powerpagesiteid,content"
            },
            {
                "relationships": "",
                "_vscodeentityname": "websitelanguages",
                "_dataverseenityname": "powerpagesitelanguages",
                "_displayname": "Power Page Site Language",
                "_foldername": "",
                "_etc": "10273",
                "_primaryidfield": "powerpagesitelanguageid",
                "_primarynamefield": "name",
                "_disableplugins": "false",
                "_fetchQueryParameters": "?$select=powerpagesitelanguageid,languagecode,lcid"
            },
            {
                "relationships": "",
                "_vscodeentityname": "portallanguages",
                "_dataverseenityname": "powerpagesitelanguages",
                "_displayname": "Power Page Site Language",
                "_foldername": "",
                "_etc": "10273",
                "_primaryidfield": "powerpagesitelanguageid",
                "_primarynamefield": "name",
                "_disableplugins": "false",
                "_fetchQueryParameters": "?$select=powerpagesitelanguageid,languagecode,lcid"
            },
            {
                "relationships": "",
                "_vscodeentityname": "webpages",
                "_dataverseenityname": "powerpagecomponents",
                "_displayname": "Web Page",
                "_etc": "10271",
                "_primaryidfield": "powerpagecomponentid",
                "_primarynamefield": "name",
                "_disableplugins": "false",
                "_exporttype": "SubFolders",
                "_foldername": "web-pages",
                "_fetchQueryParameters": "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name,content",
                "_attributes": "content",
                "_attributesExtension": new Map([
                    ["content", "webpage.copy.html"],
                ])
            },
            {
                "relationships": "",
                "_vscodeentityname": "webfiles",
                "_dataverseenityname": "powerpagecomponents",
                "_displayname": "Web File",
                "_etc": "10271",
                "_primaryidfield": "powerpagecomponentid",
                "_primarynamefield": "name",
                "_disableplugins": "false",
                "_exporttype": "SingleFolder",
                "_foldername": "web-files",
                "_fetchQueryParameters": "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name,content",
                "_attributes": "content",
                "_attributesExtension": new Map([
                    ["content", "css"]
                ])
            },
            {
                "relationships": "",
                "_vscodeentityname": "contentsnippet",
                "_dataverseenityname": "powerpagecomponents",
                "_displayname": "Content Snippet",
                "_etc": "10271",
                "_primaryidfield": "powerpagecomponentid",
                "_primarynamefield": "name",
                "_disableplugins": "false",
                "_exporttype": "SingleFolder",
                "_foldername": "content-snippets",
                "_fetchQueryParameters": "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name,content",
                "_attributes": "content",
                "_attributesExtension": new Map([
                    ["content", "html"]
                ])
            },
            {
                "relationships": "",
                "_vscodeentityname": "webtemplates",
                "_dataverseenityname": "powerpagecomponents",
                "_displayname": "Web Template",
                "_etc": "10271",
                "_primaryidfield": "powerpagecomponentid",
                "_primarynamefield": "name",
                "_disableplugins": "false",
                "_exporttype": "SingleFolder",
                "_foldername": "web-templates",
                "_fetchQueryParameters": "?$filter=powerpagecomponentid%20eq%20{entityId}&$select=name,content",
                "_attributes": "content",
                "_attributesExtension": new Map([
                    ["content", "html"]
                ])
            },
        ]
    }
}
