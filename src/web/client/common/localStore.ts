/* eslint-disable @typescript-eslint/no-unused-vars */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getHeader } from "./authenticationProvider";
import { MULTI_ENTITY_URL_KEY, ORG_URL, pathparam_schemaMap, PORTAL_LANGUAGES, PORTAL_LANGUAGES_URL_KEY, PORTAL_LANGUAGE_DEFAULT, WEBSITES, WEBSITE_LANGUAGES } from "./constants";
import { getDataSourcePropertiesMap, getEntitiesSchemaMap } from "./portalSchemaReader";
import { showErrorDialog } from "./errorHandler";
import { getDataFromDataVerse } from "./remoteFetchProvider";
import { PortalsFS } from "./fileSystemProvider";
import { createFileSystem } from "./createFileSystem";

let dataSourcePropertiesMap = new Map();
let entitiesSchemaMap = new Map();
let languageIdCodeMap = new Map();
let websitelanguageIdtoportalLanguageMap = new Map();
let websiteIdtoLanguage = new Map();
const portalDetailsMap = new Map();

export async function languageIdtoCode(accessToken: string, dataverseOrgURL: string, entity: string): Promise<Map<string, any>> {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrgURL, PORTAL_LANGUAGES, PORTAL_LANGUAGES_URL_KEY); const response = await fetch(requestUrl, {
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
                    const adx_languagecode = res.value[counter].adx_languagecode;
                    languageIdCodeMap.set(adx_portallanguageid, adx_languagecode);
                }
            }
        }
    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            showErrorDialog("Auth failed in language id code", "Language code fetch failed");
        }
        else {
            showErrorDialog("Error processing the adx_languages response", "Language code response failure");
        }
    }
    return languageIdCodeMap;
}

export async function websitelanguageIdtoportalLanguage(accessToken: string, dataverseOrgURL: string, entity: any): Promise<Map<string, any>> {
    try {
        const requestUrl = getCustomRequestURL(dataverseOrgURL, PORTAL_LANGUAGES, PORTAL_LANGUAGES_URL_KEY);
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
                    const adx_portallanguageid_value = res.value[counter].adx_portallanguageid_value ? res.value[counter].adx_portallanguageid_value : PORTAL_LANGUAGE_DEFAULT;
                    const adx_websitelanguageid = res.value[counter].adx_websitelanguageid;
                    websitelanguageIdtoportalLanguageMap.set(adx_websitelanguageid, adx_portallanguageid_value);
                }
            }
        }
    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            showErrorDialog("Auth failed in language id code", "Language code fetch failed");
        }
        else {
            showErrorDialog("Error processing the adx_languages response", "Language code response failure");
        }
    }
    return websitelanguageIdtoportalLanguageMap;
}

function getCustomRequestURL(dataverseOrg: string, entity: string, urlQuery: string): string {
    const parameterizedUrl = dataSourcePropertiesMap.get(urlQuery) as string;
    const requestUrl = parameterizedUrl.replace('{dataverseOrg}', dataverseOrg).replace('{entity}', entity).replace('{api}', dataSourcePropertiesMap.get('api')).replace('{data}', dataSourcePropertiesMap.get('data')).replace('{version}', dataSourcePropertiesMap.get('version'));
    return requestUrl;
}

export async function websiteIdtoLanguageMap(accessToken: string, dataverseOrg: string): Promise<Map<string, string>> {
    try {
        const requestUrl = getCustomRequestURL(dataverseOrg, WEBSITES, MULTI_ENTITY_URL_KEY);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            showErrorDialog("Fetch of adx_websites failed, check authorization ", "Network failure");
        }
        const res = await response.json();
        if (res) {
            if (res.value.length > 0) {
                for (let counter = 0; counter < res.value.length; counter++) {
                    const adx_websiteid = res.value[counter].adx_websiteid ? res.value[counter].adx_websiteid : null;
                    const adx_website_language = res.value[counter].adx_website_language;
                    websiteIdtoLanguage.set(adx_websiteid, adx_website_language);
                }
            }
        }

    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            showErrorDialog("Auth failed in websitelanguage fetch", "Website language fetch failed");
        }
        else {
            showErrorDialog("Error processing the adx_websitelanguages response", "WebsiteLanguage code response failure");
        }
    }
    return websiteIdtoLanguage;
}


export async function setContext(accessToken: any, pathEntity: string, entityId: string, queryParamsMap: any, portalsFS: PortalsFS) {
    const entity = pathparam_schemaMap.get(pathEntity) as string;
    const orgUrl = queryParamsMap.get(ORG_URL);
    dataSourcePropertiesMap = getDataSourcePropertiesMap();
    entitiesSchemaMap = getEntitiesSchemaMap();
    websiteIdtoLanguage = await websiteIdtoLanguageMap(accessToken, orgUrl);
    websitelanguageIdtoportalLanguageMap = await websitelanguageIdtoportalLanguage(accessToken, orgUrl, WEBSITE_LANGUAGES);
    languageIdCodeMap = await languageIdtoCode(accessToken, queryParamsMap.get('orgUrl'), PORTAL_LANGUAGES);
    createEntityFiles(portalsFS, accessToken, entity, entityId, queryParamsMap, entitiesSchemaMap, languageIdCodeMap);
}

function createEntityFiles(portalsFS: PortalsFS, accessToken: any, entity: string, entityId: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any) {
    createFileSystem(portalsFS)
    getDataFromDataVerse(accessToken, entity, entityId, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalsFS);
}


export { dataSourcePropertiesMap, entitiesSchemaMap, websiteIdtoLanguage, websitelanguageIdtoportalLanguageMap, languageIdCodeMap, portalDetailsMap };

