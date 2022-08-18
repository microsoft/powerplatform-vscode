/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { getCustomRequestURL, getHeader } from "./authenticationProvider";
import { MULTI_ENTITY_URL_KEY, ORG_URL, pathParamToSchema, PORTAL_LANGUAGES, PORTAL_LANGUAGE_DEFAULT, WEBSITES, WEBSITE_LANGUAGES, WEBSITE_NAME } from "./constants";
import { getDataSourcePropertiesMap, getEntitiesSchemaMap } from "./portalSchemaReader";
import { showErrorDialog } from "./errorHandler";
import { getDataFromDataVerse } from "./remoteFetchProvider";
import { PortalsFS } from "./fileSystemProvider";
import { createFileSystem } from "./createFileSystem";
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

let dataSourcePropertiesMap = new Map<string, string>();
let entitiesSchemaMap = new Map<string, Map<string, string>>();
let languageIdCodeMap = new Map<string, string>();
let websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
let websiteIdToLanguage = new Map<string, string>();

export async function languageIdToCode(accessToken: string, dataverseOrgURL: string, entitiesSchemaMap: Map<string, Map<string, string>>): Promise<Map<string, string>> {

    try {
        const requestUrl = getCustomRequestURL(dataverseOrgURL, PORTAL_LANGUAGES, MULTI_ENTITY_URL_KEY, entitiesSchemaMap);

        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "There’s a problem on the back end"), localize("microsoft-powerapps-portals.webExtension.backend.desc", "Try again"));
        }
        const result = await response.json();
        if (result) {
            if (result.value?.length > 0) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_lcid = result.value[counter].adx_lcid ? result.value[counter].adx_lcid : PORTAL_LANGUAGE_DEFAULT;
                    const adx_languagecode = result.value[counter].adx_languagecode;
                    languageIdCodeMap.set(adx_lcid, adx_languagecode);
                }
            }
        }
    } catch (error) {
        if (typeof error === "string" && error.includes("Unauthorized")) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
        }
        else {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
        }
    }
    return languageIdCodeMap;
}

export async function websiteLanguageIdToPortalLanguage(accessToken: string, dataverseOrgURL: string, entitiesSchemaMap: Map<string, Map<string, string>>): Promise<Map<string, string>> {
    try {
        const requestUrl = getCustomRequestURL(dataverseOrgURL, WEBSITE_LANGUAGES, MULTI_ENTITY_URL_KEY, entitiesSchemaMap);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });
        if (!response.ok) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.backend.desc", "Check the parameters and try again"));
        }
        const result = await response.json();
        if (result) {
            if (result.value?.length > 0) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_portalLanguageId_value = result.value[counter].adx_portallanguageid_value ? result.value[counter].adx_portallanguageid_value : PORTAL_LANGUAGE_DEFAULT;
                    const adx_websitelanguageid = result.value[counter].adx_websitelanguageid;
                    websiteLanguageIdToPortalLanguageMap.set(adx_websitelanguageid, adx_portalLanguageId_value);
                }
            }
        }
    } catch (error) {
        if (typeof error === "string" && error.includes("Unauthorized")) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
        }
        else {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
        }
    }
    return websiteLanguageIdToPortalLanguageMap;
}

export async function websiteIdToLanguageMap(accessToken: string, dataverseOrgUrl: string, entitiesSchemaMap: Map<string, Map<string, string>>): Promise<Map<string, string>> {
    try {
        const requestUrl = getCustomRequestURL(dataverseOrgUrl, WEBSITES, MULTI_ENTITY_URL_KEY, entitiesSchemaMap);
        const response = await fetch(requestUrl, {
            headers: getHeader(accessToken),
        });

        if (!response.ok) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.backend.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.backend.desc", "Check the parameters and try again"));
        }
        const result = await response.json();

        if (result) {
            if (result.value?.length > 0) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_websiteId = result.value[counter].adx_websiteid ? result.value[counter].adx_websiteid : null;
                    const adx_website_language = result.value[counter].adx_website_language;
                    websiteIdToLanguage.set(adx_websiteId, adx_website_language);
                }
            }
        }

    } catch (error) {
        if (typeof error === "string" && error.includes("Unauthorized")) {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.unauthorized.error", "Authorization Failed. Please run again to authorize it"), localize("microsoft-powerapps-portals.webExtension.unauthorized.desc", "There was a permissions problem with the server"));
        }
        else {
            showErrorDialog(localize("microsoft-powerapps-portals.webExtension.parameter.error", "One or more commands are invalid or malformed"), localize("microsoft-powerapps-portals.webExtension.parameter.desc", "Check the parameters and try again"));
        }
    }
    return websiteIdToLanguage;
}


export async function setContext(accessToken: string, pseudoEntityName: string, entityId: string, queryParamsMap: Map<string, string>, portalsFS: PortalsFS) {
    const entity = pathParamToSchema.get(pseudoEntityName) as string;
    const dataverseOrgUrl = queryParamsMap.get(ORG_URL) as string;
    dataSourcePropertiesMap = await getDataSourcePropertiesMap();
    entitiesSchemaMap = await getEntitiesSchemaMap();
    websiteIdToLanguage = await websiteIdToLanguageMap(accessToken, dataverseOrgUrl, entitiesSchemaMap);
    websiteLanguageIdToPortalLanguageMap = await websiteLanguageIdToPortalLanguage(accessToken, dataverseOrgUrl, entitiesSchemaMap);
    languageIdCodeMap = await languageIdToCode(accessToken, dataverseOrgUrl, entitiesSchemaMap);
    createEntityFiles(portalsFS, accessToken, entity, entityId, queryParamsMap, entitiesSchemaMap, languageIdCodeMap);
}

function createEntityFiles(portalsFS: PortalsFS, accessToken: string, entity: string, entityId: string, queryParamsMap: Map<string, string>, entitiesSchemaMap: Map<string, Map<string, string>>, languageIdCodeMap: Map<string, string>) {
    const portalFolderName = queryParamsMap.get(WEBSITE_NAME) as string;
    createFileSystem(portalsFS, portalFolderName);
    getDataFromDataVerse(accessToken, entity, entityId, queryParamsMap, entitiesSchemaMap, languageIdCodeMap, portalsFS, websiteIdToLanguage);
}

export { dataSourcePropertiesMap, entitiesSchemaMap, websiteIdToLanguage, websiteLanguageIdToPortalLanguageMap, languageIdCodeMap };
