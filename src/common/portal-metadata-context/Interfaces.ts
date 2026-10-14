/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from 'vscode';

export interface IPortalMetadata {
    webpages?: IWebpage[];
    contentSnippets?: IContentSnippet[];
    webTemplates?: IWebTemplate[];
    webFiles?: IWebFile[];
    entityLists?: IEntityList[];
    entityForms?: IEntityForm[];
    webForms?: IWebForm[];
    website?: IWebsite;
    pageTemplates?: IPageTemplate[];
}

export interface IWebsite {
    adx_name: string;
    adx_defaultlanguage: string;
    adx_headerwebtemplateid?: string;
    adx_websiteid: string;
    adx_website_language: number;
    adx_footerwebtemplateid?: string;
}

export interface IPageTemplate {
    adx_webtemplateid?: string;
    adx_name: string;
    adx_type?: number;
    adx_pagetemplateid: string;
}

export interface IWebFile {
    adx_name: string;
    adx_parentpageid?: string;
    adx_webfileid: string;
}

export interface IContentSnippet {
    adx_value?: string;
    adx_name: string;
    adx_contentsnippetlanguageid?: string;
    adx_contentsnippetid: string;
}

export interface IWebTemplate {
    adx_source?: string;
    adx_webtemplateid: string;
    adx_name: string;
}

export interface IWebpage {
    adx_customcss?: string;
    adx_entityform?: string;
    adx_webpagelanguageid?: string;
    adx_image?: string;
    adx_webform?: string;
    adx_customjavascript?: string;
    adx_isroot: boolean;
    adx_summary?: string;
    adx_parentpageid?: string;
    adx_entitylist?: string;
    adx_name: string;
    adx_pagetemplateid: string;
    adx_copy?: string;
    adx_rootwebpageid?: string;
    adx_webpageid: string;
}


export interface IEntityList {
    adx_registerstartupscript?: string;
    adx_entitylistid: string;
    adx_name: string;
}

export interface IWebForm {
    adx_name: string;
    adx_webformid: string;
    adx_startstep?: string;
}

export interface IEntityForm {
    adx_entityformid: string;
    adx_name: string;
    adx_registerstartupscript?: string;
}

export interface IContextItem {
    label: string;
    title: string;
    id: string;
    isFile: boolean;
    content: string;
    path?: vscode.Uri;
    component: string;
    children: IContextItem[];
    error: string;
    parentList: IContextItem[];
}