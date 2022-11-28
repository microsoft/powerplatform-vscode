/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { portal_schema_V1, portal_schema_V2 } from "../common/portalSchema";
import * as Constants from "../common/constants";
import PowerPlatformExtensionContextManager from "../common/extensionContext";

export function getPortalSchema(schema: string) {
    if (schema === portal_schema_V2.entities.dataSourceProperties.schema) {
        return portal_schema_V2;
    }
    return portal_schema_V1;
}

export function getEntity(entity: string) {
    const powerPlatformExtensionContext = PowerPlatformExtensionContextManager.getPowerPlatformExtensionContext();
    if (powerPlatformExtensionContext.queryParamsMap.get(Constants.schemaKey.SCHEMA_VERSION) as string === portal_schema_V2.entities.dataSourceProperties.schema) {
        return powerPlatformExtensionContext.entitiesSchemaMap.get(entity);
    }

    return powerPlatformExtensionContext.entitiesSchemaMap.get(entity);
}

export function getAttributeParts(attribute: string): { source: string, relativePath: string } {
    const attributePathArray = attribute.split('.', 2);

    return { source: attributePathArray[0], relativePath: attributePathArray[1] ?? '' };
}

export function useBase64Decoding(entity: string, attributeType: string): boolean {
    return entity === Constants.schemaEntityName.WEBFILES &&
        (attributeType === Constants.entityAttributesWithBase64Encoding.documentbody || attributeType === Constants.entityAttributesWithBase64Encoding.filecontent);
}

export function useBase64Encoding(entity: string, attributeType: string): boolean {
    return entity === Constants.schemaEntityName.WEBFILES &&
        (attributeType === Constants.entityAttributesWithBase64Encoding.documentbody);
}

export function isWebFileV2OctetStream(entity: string, attributeType: string) {
    return entity === Constants.schemaEntityName.WEBFILES && attributeType === Constants.entityAttributesWithBase64Encoding.filecontent;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLanguageIdCodeMap(result: any, schema: string) {
    const languageIdCodeMap = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (schema === portal_schema_V2.entities.dataSourceProperties.schema) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const lcid = result.value[counter].lcid ?
                        result.value[counter].lcid :
                        Constants.PORTAL_LANGUAGE_DEFAULT;
                    const languagecode = result.value[counter].languagecode;
                    languageIdCodeMap.set(lcid.toString(), languagecode);
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

    return languageIdCodeMap;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWebsiteIdToLanguageMap(result: any, schema: string) {
    const websiteIdToLanguage = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (schema === portal_schema_V2.entities.dataSourceProperties.schema) {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const powerpagesiteid = result.value[counter].powerpagesiteid ? result.value[counter].powerpagesiteid : null;
                    const lcid = JSON.parse(result.value[counter].content).website_language as string;
                    websiteIdToLanguage.set(powerpagesiteid, lcid.toString());
                }
            } else {
                for (let counter = 0; counter < result.value.length; counter++) {
                    const adx_websiteId = result.value[counter].adx_websiteid ? result.value[counter].adx_websiteid : null;
                    const lcid = result.value[counter].adx_website_language;
                    websiteIdToLanguage.set(adx_websiteId, lcid);
                }
            }
        }
    }

    return websiteIdToLanguage;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getwebsiteLanguageIdToPortalLanguageMap(result: any, schema: string) {
    const websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (schema === portal_schema_V2.entities.dataSourceProperties.schema) {
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

    return websiteLanguageIdToPortalLanguageMap;
}

