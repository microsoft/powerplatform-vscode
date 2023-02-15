/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import path from "path";

export enum Tables {
    WEBPAGE = "Webpage",
    PAGETEMPLATE = "PageTemplate",
    PORTALLANGUAGES = "PortalLanguages",
    WEBSITELANGUAGES = "WebsiteLanguages",
    WEBLINKS = "Weblinks",
    WEBTEMPLATE = "WebTemplate",
}

export const yoPath = path.join("node_modules", ".bin", "yo");

export interface Template {
    name: string;
    value: string;
}

export const NOT_A_PORTAL_DIRECTORY = 'No Website Data Found in Current Directory. Please switch to a directory that contains the PAC downloaded website data to continue.';

