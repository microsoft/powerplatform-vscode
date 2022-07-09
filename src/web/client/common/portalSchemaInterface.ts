/* eslint-disable @typescript-eslint/no-unused-vars */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface Entities {
    entity?: (Entity)[] | null;
}
export interface Entity {
    fields: any;
    relationships?: string | any;
    _name: string;
    _displayname: string;
    _etc?: string | null;
    _primaryidfield: string;
    _primarynamefield: string;
    _disableplugins: string;
    _foldername: string;
    _propextension: string;
    _exporttype: string;
    _downloadThroughChild?: string | null;
    _languagefield?: string | null;
    _languagegroupby?: string | null;
    _parententityname?: string | null;
    _parententityfield?: string | null;
    _orderby?: string | null;
    _topcount?: string | null;
    _syncdirection?: string | null;
    _query?: string | null;
}

export interface WebsiteDetails {
    adx_website_language: string,
    adx_name: string
}
