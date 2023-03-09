/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface Template {
    name: string;
    value: string;
}

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
