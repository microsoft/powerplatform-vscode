/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

'use strict';
import * as vscode from "vscode";
import { getHeader } from "./authenticationProvider";
import { PORTAL_LANGUAGES, PORTAL_LANGUAGES_URL_KEY, PORTAL_LANGUAGE_DEFAULT, WEBSITE_LANGUAGES, WEBSITE_LANGUAGES_URL_KEY } from "./constants";
import { getDataSourcePropertiesMap } from "./portalSchemaReader";

let dataSourcePropertiesMap = new Map();
let languageIdCodeMap = new Map();
let websiteIdtoLanguage = new Map();


export async function languageIdtoCodeMap(accessToken: string, dataverseOrg: any, entity: string) {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrg, PORTAL_LANGUAGES, PORTAL_LANGUAGES_URL_KEY);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            showErrorDialog("Fetch of adx_languages failed, check authorization ", "Network failure");
        }
        const res = await response.json();
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
        if (e.message.includes('Unauthorized')) {
            showErrorDialog("Auth failed in language id code", "Language code fetch failed");
        }
        else {
            showErrorDialog("Error processing the adx_languages response", "Language code response failure");
            throw e;
        }
    }
    return { languageIdCodeMap };
}


function showErrorDialog(detailMessaage: string, errorString: string) {
    const options = { detail: detailMessaage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}

function getCustomRequestURL(dataverseOrg: any, entity: string, urlquery: string) {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlquery) as string;
    const requestUrl = parameterizedUrl.replace('{dataverseOrg}', dataverseOrg).replace('{entity}', entity).replace('{api}', dataSourcePropertiesMap.get('api')).replace('{data}', dataSourcePropertiesMap.get('data')).replace('{version}', dataSourcePropertiesMap.get('version'));
    return requestUrl;
}

export async function websiteIdtoLanguageMap(accessToken: string, dataverseOrg: string, entity: string) {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrg, WEBSITE_LANGUAGES, WEBSITE_LANGUAGES_URL_KEY);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            showErrorDialog("Fetch of adx_websitelanguages failed, check authorization ", "Network failure");
        }
        const res = await response.json();
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
        if (e.message.includes('Unauthorized')) {
            showErrorDialog("Auth failed in websitelanguage fetch", "Website language fetch failed");
        }
        else {
            showErrorDialog("Error processing the adx_websitelanguages response", "WebsiteLanguage code response failure");
            throw e;
        }
    }
    return { websiteIdtoLanguage };
}

export async function setContext(accessToken: any, dataverseOrg: any) {
    dataSourcePropertiesMap = getDataSourcePropertiesMap();
    ({ websiteIdtoLanguage } = await websiteIdtoLanguageMap(accessToken, dataverseOrg, WEBSITE_LANGUAGES));
    ({ languageIdCodeMap } = await languageIdtoCodeMap(accessToken, dataverseOrg, PORTAL_LANGUAGES));
}

export { dataSourcePropertiesMap, websiteIdtoLanguage, languageIdCodeMap };
