/* eslint-disable @typescript-eslint/no-unused-vars */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use strict';
import * as vscode from "vscode";
import { getHeader } from "./authenticationProvider";
import { PORTAL_LANGUAGES, PORTAL_LANGUAGES_URL_KEY, PORTAL_LANGUAGE_DEFAULT, WEBPAGEID_URL_KEY, WEBPAGES, WEBSITE_LANGUAGES, WEBSITE_LANGUAGES_URL_KEY } from "./constants";
import { readSchema } from "./portalSchemaReader";

let orgMap = new Map()
let webpagestowebpagesId = new Map();
let languageIdCodeMap = new Map();
let websiteIdtoLanguage = new Map();


export async function languageIdtoCodeMap(accessToken: string, dataverseOrg: any, entity: string) {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrg, PORTAL_LANGUAGES, PORTAL_LANGUAGES_URL_KEY);
        const req = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!req.ok) {
            const options = { detail: 'Auth failed in language id code', modal: true };
            vscode.window.showErrorMessage("Language code fetch failed", options);
        }
        const res = await req.json();
        if (res) {
            if (res.value.length > 0) {
                for (let counter = 0; counter < res.value.length; counter++) {
                    const adx_portallanguageid = res.value[counter].adx_portallanguageid ? res.value[counter].adx_portallanguageid : PORTAL_LANGUAGE_DEFAULT;
                    const value = res.value[counter].adx_portallanguageid;
                    languageIdCodeMap.set(adx_portallanguageid, value);
                }
            }
        }
    } catch (e: any) {
        if (e.message === 'Unauthorized') {
            const options = { detail: 'Auth failed in language id code', modal: true };
            vscode.window.showErrorMessage("Language code fetch failed", options);
        }
        throw e;
    }
    return { languageIdCodeMap };
}


function getCustomRequestURL(dataverseOrg: any, entity: string, urlquery: string) {
    const parameterizedUrl = orgMap.get(urlquery) as string;
    const requestUrl = parameterizedUrl.replace('{dataverseOrg}', dataverseOrg).replace('{entity}', entity).replace('{api}', orgMap.get('api')).replace('{data}', orgMap.get('data')).replace('{version}', orgMap.get('version'));
    return requestUrl;
}

export async function websiteIdtoLanguageMap(accessToken: string, dataverseOrg: string, entity: string) {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrg, WEBSITE_LANGUAGES, WEBSITE_LANGUAGES_URL_KEY);
        const req = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!req.ok) {
            const options = { detail: 'Fetch of website language', modal: true };
            vscode.window.showErrorMessage("Fetch of website language failed", options);
        }
        const res = await req.json();
        if (res) {
            if (res.value.length > 0) {
                for (let counter = 0; counter < res.value.length; counter++) {
                    const adx_portallanguageid = res.value[counter].adx_portallanguageid ? res.value[counter].adx_portallanguageid : PORTAL_LANGUAGE_DEFAULT;
                    const value = res.value[counter].adx_languagecode;
                    websiteIdtoLanguage.set(adx_portallanguageid, value);
                }
            }
        }

    } catch (e: any) {
        if (e.message === 'Unauthorized') {
            const options = { detail: 'Authotization Failed', modal: true };
            vscode.window.showErrorMessage("Fetch of website language failed due to invalid accesstoken", options);
        }
        throw e;
    }
    return { websiteIdtoLanguage };
}

export async function webpagestowebpagesIdMap(accessToken: string, dataverseOrg: any, entity: string) {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrg, WEBPAGES, WEBPAGEID_URL_KEY);
        const req = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!req.ok) {
            const options = { detail: 'Authorization Failed', modal: true };
            vscode.window.showErrorMessage("Fetch of website ID failed due to invalid accesstoken", options);
        }
        const res = await req.json();

        if (res) {
            if (res.value.length > 0) {
                for (let counter = 0; counter < res.value.length; counter++) {
                    const name = res.value[counter].adx_name ? res.value[counter].adx_name : 'name';
                    const value = res.value[counter].adx_webpageid;
                    webpagestowebpagesId.set(name, value);
                }
            }
        }

    } catch (e: any) {
        if (e.message === 'Unauthorized') {
            const options = { detail: 'Authorization Failed', modal: true };
            vscode.window.showErrorMessage("Fetch of website Id failed due to invalid accesstoken", options);
        }
        throw e;
    }
    return { webpagestowebpagesId };
}

export async function setLocalStore(accessToken: any, dataverseOrg: any) {
    orgMap = readSchema();
    ({ websiteIdtoLanguage } = await websiteIdtoLanguageMap(accessToken, dataverseOrg, WEBSITE_LANGUAGES));
    ({ languageIdCodeMap } = await languageIdtoCodeMap(accessToken, dataverseOrg, PORTAL_LANGUAGES));
    ({ webpagestowebpagesId } = await webpagestowebpagesIdMap(accessToken, dataverseOrg, WEBPAGES));

}

export {orgMap,websiteIdtoLanguage, languageIdCodeMap, webpagestowebpagesId};
