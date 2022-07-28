/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getCustomRequestURL, getHeader } from "./authenticationProvider";
import { MULTI_ENTITY_URL_KEY, ORG_URL, pathParamToSchema, PORTAL_LANGUAGES, PORTAL_LANGUAGE_DEFAULT, WEBSITES, WEBSITE_LANGUAGES, WEBSITE_NAME } from "./constants";
import { getDataSourcePropertiesMap, getEntitiesSchemaMap } from "./portalSchemaReader";
import { ERRORS, showErrorDialog } from "./errorHandler";
import { getDataFromDataVerse } from "./remoteFetchProvider";
import { PortalsFS } from "./fileSystemProvider";
import { createFileSystem } from "./createFileSystem";

let dataSourcePropertiesMap = new Map();
let entitiesSchemaMap = new Map();
let languageIdCodeMap = new Map();
let websiteLanguageIdToPortalLanguageMap = new Map();
let websiteIdToLanguage = new Map();
const portalDetailsMap = new Map();

export async function languageIdToCode(accessToken: string, dataverseOrgURL: string, entitiesSchemaMap: any): Promise<Map<string, any>> {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrgURL, PORTAL_LANGUAGES, MULTI_ENTITY_URL_KEY, entitiesSchemaMap);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            showErrorDialog(ERRORS.NOT_FOUND, ERRORS.SERVER_ERROR_PERMISSION_DENIED);
        }
        const result = await response.json();
        if (result) {
            if (result.value.length > 0) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_portallanguageid = result.value[counter].adx_portallanguageid ? result.value[counter].adx_portallanguageid : PORTAL_LANGUAGE_DEFAULT;
                    const adx_languagecode = result.value[counter].adx_languagecode;
                    languageIdCodeMap.set(adx_portallanguageid, adx_languagecode);
                }
            }
        }
    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            showErrorDialog(ERRORS.AUTHORIZATION_FAILED, ERRORS.SERVER_ERROR_PERMISSION_DENIED);
        }
        else {
            showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.SERVICE_ERROR);
        }
    }
    return languageIdCodeMap;
}

export async function websiteLanguageIdToPortalLanguage(accessToken: string, dataverseOrgURL: string, entitiesSchemaMap: any): Promise<Map<string, any>> {
    try {
        const requestUrl = getCustomRequestURL(dataverseOrgURL, PORTAL_LANGUAGES, MULTI_ENTITY_URL_KEY, entitiesSchemaMap);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.SERVICE_ERROR);
        }
        const result = await response.json();
        if (result) {
            if (result.value.length > 0) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_portalLanguageId_value = result.value[counter].adx_portallanguageid_value ? result.value[counter].adx_portallanguageid_value : PORTAL_LANGUAGE_DEFAULT;
                    const adx_websiteLanguageId = result.value[counter].adx_websitelanguageid;
                    websiteLanguageIdToPortalLanguageMap.set(adx_websiteLanguageId, adx_portalLanguageId_value);
                }
            }
        }
    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            showErrorDialog(ERRORS.AUTHORIZATION_FAILED, ERRORS.SERVER_ERROR_PERMISSION_DENIED);
        }
        else {
            showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.SERVICE_ERROR);
        }
    }
    return websiteLanguageIdToPortalLanguageMap;
}

export async function websiteIdToLanguageMap(accessToken: string, dataverseOrgUrl: string, entitiesSchemaMap: any): Promise<Map<string, string>> {
    try {
        const requestUrl = getCustomRequestURL(dataverseOrgUrl, WEBSITES, MULTI_ENTITY_URL_KEY, entitiesSchemaMap);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.SERVICE_ERROR);
        }
        const result = await response.json();
        if (result) {
            if (result.value.length > 0) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_websiteId = result.value[counter].adx_websiteid ? result.value[counter].adx_websiteid : null;
                    const adx_website_language = result.value[counter].adx_website_language;
                    websiteIdToLanguage.set(adx_websiteId, adx_website_language);
                }
            }
        }

    } catch (e: any) {
        if (e.message.includes('Unauthorized')) {
            showErrorDialog(ERRORS.AUTHORIZATION_FAILED, ERRORS.SERVER_ERROR_PERMISSION_DENIED);
        }
        else {
            showErrorDialog(ERRORS.INVALID_ARGUMENT, ERRORS.SERVICE_ERROR);
        }
    }
    return websiteIdToLanguage;
}


export async function setContext(accessToken: string, pseudoEntityName: string, entityId: string, queryParamsMap: any, portalsFS: PortalsFS) {
    const entity = pathParamToSchema.get(pseudoEntityName) as string;
    const dataverseOrgUrl = queryParamsMap.get(ORG_URL);
    dataSourcePropertiesMap = await getDataSourcePropertiesMap();
    entitiesSchemaMap = await getEntitiesSchemaMap();
    websiteIdToLanguage = await websiteIdToLanguageMap(accessToken, dataverseOrgUrl, entitiesSchemaMap);
    websiteLanguageIdToPortalLanguageMap = await websiteLanguageIdToPortalLanguage(accessToken, dataverseOrgUrl, entitiesSchemaMap);
    languageIdCodeMap = await languageIdToCode(accessToken, queryParamsMap.get(ORG_URL), entitiesSchemaMap);
    createEntityFiles(portalsFS, accessToken, entity, entityId, queryParamsMap, entitiesSchemaMap, languageIdCodeMap);
}

function createEntityFiles(portalsFS: PortalsFS, accessToken: string, entity: string, entityId: string, queryParamsMap: any, entitiesSchemaMap: any, languageIdCodeMap: any) {
    const portalFolderName = queryParamsMap.get(WEBSITE_NAME);
    createFileSystem(portalsFS, portalFolderName);
    getDataFromDataVerse(accessToken, entity, entityId, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalsFS);
}

export { dataSourcePropertiesMap, entitiesSchemaMap, websiteIdToLanguage, websiteLanguageIdToPortalLanguageMap, languageIdCodeMap, portalDetailsMap };

