/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface ITemplate {
    name: string;
    value: string;
}

export interface IParentPagePaths {
    paths: Array<string>;
    pathsMap: Map<string, string>;
    webpageNames: Array<string>;
}

export interface IPageTemplates {
    pageTemplateNames: string[];
    pageTemplateMap: Map<string, string>;
}

export interface IWebTemplates {
    webTemplateNames: string[];
    webTemplateMap: Map<string, string>;
}
