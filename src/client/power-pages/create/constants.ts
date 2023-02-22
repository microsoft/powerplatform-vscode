/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


export enum Tables {
    WEBPAGE = "Webpage",
    PAGETEMPLATE = "PageTemplate",
    PORTALLANGUAGES = "PortalLanguages",
    WEBSITELANGUAGES = "WebsiteLanguages",
    WEBLINKS = "Weblinks",
    WEBTEMPLATE = "WebTemplate",
    CONTENT_SNIPPET = "ContentSnippet"

}

export interface Template {
    name: string;
    value: string;
}

export const NOT_A_PORTAL_DIRECTORY = 'No Website Data Found in Current Directory. Please switch to a directory that contains the PAC downloaded website data to continue.';
export const WEBSITE_YML = 'website.yml';

export interface ParentPagePaths {
    paths: Array<string>;
    pathsMap: Map<string, string>;
    webpageNames: Array<string>;
}

export interface PageTemplates {
    pageTemplateNames: string[];
    pageTemplateMap: Map<string, string>;
}

export interface WebTemplates {
    webTemplateNames: string[];
    webTemplateMap: Map<string, string>;
}

export enum YoSubGenerator {
    PAGETEMPLATE = "@microsoft/powerpages:pagetemplate",
    WEBPAGE = "@microsoft/powerpages:webpage",
    WEBFILE = "@microsoft/powerpages:webfile",
    WEBTEMPLATE = "@microsoft/powerpages:webtemplate",
    CONTENT_SNIPPET = "@microsoft/powerpages:contentsnippet"
}

export enum TableFolder {
    WEBPAGE_FOLDER = "web-pages",
    PAGETEMPLATE_FOLDER = "page-templates",
    WEBTEMPLATE_FOLDER = "web-templates",
    CONTENT_SNIPPET_FOLDER = "content-snippets",
    WEBFILE_FOLDER = "web-files",
}
