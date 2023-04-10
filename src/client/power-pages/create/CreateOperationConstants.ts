/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
export enum Tables {
    WEBPAGE = "Webpage",
    PAGETEMPLATE = "PageTemplate",
    PORTALLANGUAGES = "PortalLanguages",
    WEBSITELANGUAGES = "WebsiteLanguages",
    WEBLINKS = "Weblinks",
    WEBTEMPLATE = "WebTemplate",
}

export const NOT_A_PORTAL_DIRECTORY =
    vscode.l10n.t("No Website Data Found in Current Directory. Please switch to a directory that contains the PAC downloaded website data to continue.");
export const WEBSITE_YML = "website.yml";
export const NO_WORKSPACEFOLDER_FOUND = vscode.l10n.t("No workspace folder found")
export const CONTENT_SNIPPET = "ContentSnippet"
export const WEBFILE = "Webfile"
export const ERROR_MESSAGE = vscode.l10n.t(`Operation failed. See output panel for details.`)
export const SHOW_OUTPUT_PANEL = vscode.l10n.t(`Show Output Panel`)

export enum YoSubGenerator {
    PAGETEMPLATE = "@microsoft/powerpages:pagetemplate",
    WEBPAGE = "@microsoft/powerpages:webpage",
    WEBFILE = "@microsoft/powerpages:webfile",
    WEBTEMPLATE = "@microsoft/powerpages:webtemplate",
    CONTENT_SNIPPET = "@microsoft/powerpages:contentsnippet",
}

export enum TableFolder {
    WEBPAGE_FOLDER = "web-pages",
    PAGETEMPLATE_FOLDER = "page-templates",
    WEBTEMPLATE_FOLDER = "web-templates",
    CONTENT_SNIPPET_FOLDER = "content-snippets",
    WEBFILE_FOLDER = "web-files",
}
