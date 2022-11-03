/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { portal_schema_V1, portal_schema_V2 } from "../common/portalSchema";
import * as Constants from "../common/constants";
import PowerPlatformExtensionContextManager from "../common/localStore";

export function getPortalSchema(schema: string) {
    console.log("getPortalSchema", schema.toLowerCase(), Constants.NEW_SCHEMA_NAME.toLowerCase());
    if (schema === Constants.NEW_SCHEMA_NAME) {
        console.log("getPortalSchema", "inside new model");
        return portal_schema_V2;
    }
    console.log("getPortalSchema", "inside OLD model");
    return portal_schema_V1;
}

export function getWebsiteEntityName() {
    const powerPlatformExtensionContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (powerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string === Constants.NEW_SCHEMA_NAME) {
        return Constants.NEW_PORTAL_WEBSITES;
    }

    return Constants.WEBSITES;
}

export function getPortalLanguageEntityName() {
    const powerPlatformExtensionContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (powerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string === Constants.NEW_SCHEMA_NAME) {
        return Constants.NEW_PORTAL_LANGUAGES;
    }

    return Constants.PORTAL_LANGUAGES;
}

export function getWebsiteLanguageEntityName() {
    const powerPlatformExtensionContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (powerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string === Constants.NEW_SCHEMA_NAME) {
        return Constants.NEW_PORTAL_LANGUAGES;
    }

    return Constants.WEBSITE_LANGUAGES;
}

export function getEntityName(entity: string) {
    console.log("getRequestUrl");
    const powerPlatformExtensionContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (powerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string === Constants.NEW_SCHEMA_NAME) {
        return Constants.pathParamToSchemaV2.get(entity) as string;
    }

    return Constants.pathParamToSchemaV1.get(entity) as string;
}

export function getEntity(entity: string) {
    console.log("getRequestUrl");
    const powerPlatformExtensionContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (powerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string === Constants.NEW_SCHEMA_NAME) {
        return powerPlatformExtensionContext.entitiesSchemaMap.get(Constants.pathParamToSchemaV2.get(entity) as string);
    }

    return powerPlatformExtensionContext.entitiesSchemaMap.get(Constants.pathParamToSchemaV1.get(entity) as string);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLanguageIdCodeMap(result: any, schema: string) {
    console.log("getLanguageIdCodeMap");
    const languageIdCodeMap = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (schema === Constants.NEW_SCHEMA_NAME) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const lcid = result.value[counter].lcid ?
                        result.value[counter].lcid :
                        Constants.PORTAL_LANGUAGE_DEFAULT;
                    const languagecode = result.value[counter].languagecode;
                    languageIdCodeMap.set(lcid, languagecode);
                }
            } else {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_lcid = result.value[counter].adx_lcid ? result.value[counter].adx_lcid : Constants.PORTAL_LANGUAGE_DEFAULT;
                    const adx_languagecode = result.value[counter].adx_languagecode;
                    languageIdCodeMap.set(adx_lcid, adx_languagecode);
                }
            }
        }
    }
    console.log("getLanguageIdCodeMap", languageIdCodeMap.size);

    return languageIdCodeMap;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWebsiteIdToLanguageMap(result: any, schema: string) {
    console.log("getWebsiteIdToLanguageMap");
    const websiteIdToLanguage = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (schema === Constants.NEW_SCHEMA_NAME) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const powerpagesitelanguageid = result.value[counter].powerpagesitelanguageid ? result.value[counter].powerpagesitelanguageid : null;
                    const languagecode = result.value[counter].languagecode;
                    websiteIdToLanguage.set(powerpagesitelanguageid, languagecode);
                }
            } else {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_websiteId = result.value[counter].adx_websiteid ? result.value[counter].adx_websiteid : null;
                    const adx_website_language = result.value[counter].adx_website_language;
                    websiteIdToLanguage.set(adx_websiteId, adx_website_language);
                }
            }
        }
    }
    console.log("getWebsiteIdToLanguageMap", websiteIdToLanguage.size);

    return websiteIdToLanguage;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getwebsiteLanguageIdToPortalLanguageMap(result: any, schema: string) {
    console.log("getWebsiteIdToLanguageMap");
    const websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (schema === Constants.NEW_SCHEMA_NAME) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const powerpagesitelanguageid = result.value[counter].powerpagesitelanguageid ? result.value[counter].powerpagesitelanguageid : null;
                    websiteLanguageIdToPortalLanguageMap.set(powerpagesitelanguageid, powerpagesitelanguageid);
                }
            } else {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_portalLanguageId_value = result.value[counter].adx_portallanguageid_value ? result.value[counter].adx_portallanguageid_value : Constants.PORTAL_LANGUAGE_DEFAULT;
                    const adx_websitelanguageid = result.value[counter].adx_websitelanguageid;
                    websiteLanguageIdToPortalLanguageMap.set(adx_websitelanguageid, adx_portalLanguageId_value);
                }
            }
        }
    }
    console.log("getWebsiteIdToLanguageMap", websiteLanguageIdToPortalLanguageMap.size);

    return websiteLanguageIdToPortalLanguageMap;
}

