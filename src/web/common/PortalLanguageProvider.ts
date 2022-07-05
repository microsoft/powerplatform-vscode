/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
/* eslint-disable @typescript-eslint/no-explicit-any */

'use strict';

import { LANGUAGEID } from "./Constants";
import { getHeader, getRequestUrlforEntityRoot } from "./AuthenticationProvider";

export async function languageIdtoCodeMap(accessToken: string ,dataverseOrg: any, api: any, data: any, version: any, entity: string, schemamap: any): Promise<{
    languageIdCodeMap: Map<any, any>}>

{
    const languageIdCodeMap = new Map();
    try {
        const requestUrl = getRequestUrlforEntityRoot('GET', dataverseOrg, api, data, version, entity, schemamap);
        console.log(requestUrl);
        const req = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!req.ok) {
            console.log("auth failed in language id code");
            throw new Error(req.statusText);
        }
        const res = await req.json();
        console.log(res);
        if (res) {
            // insert the  in the in memory map
            console.log( "size of response " + res.value.length)
            if(res.value.length > 0)
                {
                    for(let counter = 0; counter<res.value.length; counter++){
                        const adx_portallanguageid = res.value[counter].adx_portallanguageid ? res.value[counter].adx_portallanguageid : LANGUAGEID;
                        const value = res.value[counter].adx_portallanguageid ;
                        languageIdCodeMap.set(adx_portallanguageid, value);
                }
            }
        }
    } catch (e: any) {
        if (e.message === 'Unauthorized') {
        console.log("exception encountered in fetching portallanguage")
        }
        throw e;
    }
    return {languageIdCodeMap};
}


export async function websiteIdtoLanguageMap(accessToken: string , dataverseOrg: string, api: string, data: string, version: string, entity: string, schemamap: any): Promise<{
    websiteIdtoLanguage: Map<any, any>}>
{
    const websiteIdtoLanguage = new Map();
    console.log("inside websiteId to language map")
    try {
        const requestUrl = getRequestUrlforEntityRoot('GET', dataverseOrg, api, data, version, entity, schemamap);
        const req = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!req.ok) {
            console.log("auth failed in id langauge map");
            throw new Error(req.statusText);
        }
        const res = await req.json();
        if (res) {
            // insert the  in the inmemorymap
            console.log( "size of response " + res.value.length)
            if(res.value.length > 0)
                {

                    for(let counter = 0; counter<res.value.length; counter++){
                        const adx_portallanguageid = res.value[counter].adx_portallanguageid ? res.value[counter].adx_portallanguageid : LANGUAGEID;
                        const value = res.value[counter].adx_languagecode ;
                        websiteIdtoLanguage.set(adx_portallanguageid, value);
                }
            }
        }

    } catch (e: any) {
        if (e.message === 'Unauthorized') {
        console.log("exception encountered in fetching portallanguage")
        }
        throw e;
    }
    return {websiteIdtoLanguage};
}

export async function webpagestowebpagesIdMap(accessToken: string ,dataverseOrg: any, api: any, data: any, version: any, entity: string, schemamap: any): Promise<{
    webpagestowebpagesId: Map<any, any>}>

{
    const webpagestowebpagesId = new Map();

    try {
        const requestUrl = getRequestUrlforEntityRoot('GET', dataverseOrg, api, data, version, entity, schemamap);
         const req = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!req.ok) {
            console.log("auth failed in website id map");
            throw new Error(req.statusText);
        }
        const res = await req.json();

        if (res) {
            // insert this  in the in memorymap
            if(res.value.length > 0)
                {
                    for(let counter = 0; counter<res.value.length; counter++){
                        const name = res.value[counter].adx_name ? res.value[counter].adx_name : 'name';
                        const value = res.value[counter].adx_webpageid ;
                        webpagestowebpagesId.set(name, value);
                    }
                }
            }

        } catch (e: any) {
        if (e.message === 'Unauthorized') {
        console.log("exception encountered in fetching name websiteid")
        }
        throw e;
        }
    return {webpagestowebpagesId};
}
