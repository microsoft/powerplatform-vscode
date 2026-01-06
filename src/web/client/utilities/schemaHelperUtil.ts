/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { portal_schema_V1, portal_schema_V2 } from "../schema/portalSchema";
import * as Constants from "../common/constants";
import WebExtensionContext from "../WebExtensionContext";
import {
    entityAttributesWithBase64Encoding,
    schemaEntityKey,
    schemaMetaDataKey,
    schemaEntityName,
} from "../schema/constants";
import { IAttributePath } from "../common/interfaces";

export function getEntityFetchQuery(entity: string, useRegularFetchQuery = false) {
    return getEntity(entity)?.get(useRegularFetchQuery
        ? schemaEntityKey.FETCH_QUERY_PARAMETERS
        : schemaEntityKey.MULTI_FILE_FETCH_QUERY_PARAMETERS
    );
}

export function getLogicalEntityParameter(entity: string) {
    const entityMetadata = getEntity(entity)?.get(schemaEntityKey.DATAVERSE_ENTITY_METADATA);
    return entityMetadata ? (entityMetadata as unknown as Map<string, string>).get(schemaMetaDataKey.DATAVERSE_LOGICAL_ENTITY_NAME) : undefined;
}

export function getLogicalFormNameParameter(entity: string) {
    const entityMetadata = getEntity(entity)?.get(schemaEntityKey.DATAVERSE_ENTITY_METADATA);
    return entityMetadata ? (entityMetadata as unknown as Map<string, string>).get(schemaMetaDataKey.DATAVERSE_FORM_NAME) : undefined;
}

export function getEntityParameters(entityName: string): Array<string | undefined> {
    const logicalFormNameParameter = getLogicalFormNameParameter(entityName);
    const logicalEntityName = getLogicalEntityParameter(entityName);
    return [logicalEntityName, logicalFormNameParameter];
}

export function getPortalSchema(schema: string) {
    if (
        schema.toLowerCase() ===
        portal_schema_V2.entities.dataSourceProperties.schema
    ) {
        return portal_schema_V2;
    }
    return portal_schema_V1;
}

export function getEntity(entity: string) {
    return WebExtensionContext.schemaEntitiesMap.get(entity);
}

export function getAttributePath(attribute: string): IAttributePath {
    const attributePathArray = attribute.split(".", 2);

    return {
        source: attributePathArray[0],
        relativePath: attributePathArray[1] ?? "",
    };
}

export function isBase64Encoded(
    entity: string,
    attributeType: string
): boolean {
    return (
        (entity === schemaEntityName.WEBFILES || entity === schemaEntityName.SERVERLOGICS) &&
        (attributeType === entityAttributesWithBase64Encoding.documentbody ||
            attributeType === entityAttributesWithBase64Encoding.filecontent ||
            attributeType === entityAttributesWithBase64Encoding.adx_filecontent)
    );
}

export function encodeAsBase64(entity: string, attributeType: string): boolean {
    return (
        (entity === schemaEntityName.WEBFILES || entity === schemaEntityName.SERVERLOGICS) &&
        attributeType === entityAttributesWithBase64Encoding.documentbody
    );
}

export function useOctetStreamContentType(
    entity: string,
    attributeType: string
) {
    return (
        (entity === schemaEntityName.WEBFILES || entity === schemaEntityName.SERVERLOGICS) &&
        (attributeType === entityAttributesWithBase64Encoding.filecontent ||
            attributeType === entityAttributesWithBase64Encoding.adx_filecontent)
    );
}

export function isWebFileV2(entity: string, attributeType: string) {
    return (
        (entity === schemaEntityName.WEBFILES || entity === schemaEntityName.SERVERLOGICS) &&
        (attributeType === entityAttributesWithBase64Encoding.filecontent ||
            attributeType === entityAttributesWithBase64Encoding.adx_filecontent)
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getLcidCodeMap(result: any, schema: string) {
    const languageIdCodeMap = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (
                schema.toLowerCase() ===
                portal_schema_V2.entities.dataSourceProperties.schema
            ) {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const lcid = result.value[counter].lcid
                        ? result.value[counter].lcid
                        : Constants.PORTAL_LANGUAGE_DEFAULT;
                    const languagecode = result.value[counter].languagecode;
                    languageIdCodeMap.set(lcid.toString(), languagecode);
                }
            } else {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const adx_lcid = result.value[counter].adx_lcid
                        ? result.value[counter].adx_lcid
                        : Constants.PORTAL_LANGUAGE_DEFAULT;
                    const adx_languagecode =
                        result.value[counter].adx_languagecode;
                    languageIdCodeMap.set(adx_lcid, adx_languagecode);
                }
            }
        }
    }

    return languageIdCodeMap;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPortalLanguageIdToLcidMap(result: any, schema: string) {
    const portalLanguageIdCodeMap = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (
                schema.toLowerCase() ===
                portal_schema_V2.entities.dataSourceProperties.schema
            ) {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const powerpagesitelanguageid = result.value[counter]
                        .powerpagesitelanguageid
                        ? result.value[counter].powerpagesitelanguageid
                        : null;
                    const languagecode = result.value[counter].languagecode;
                    portalLanguageIdCodeMap.set(powerpagesitelanguageid.toString(), languagecode);
                }
            } else {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const adx_portallanguageid = result.value[counter]
                        .adx_portallanguageid
                        ? result.value[counter].adx_portallanguageid
                        : Constants.DEFAULT_LANGUAGE_CODE;
                    const adx_languagecode =
                        result.value[counter].adx_languagecode;
                    portalLanguageIdCodeMap.set(
                        adx_portallanguageid,
                        adx_languagecode
                    );
                }
            }
        }
    }

    return portalLanguageIdCodeMap;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getWebsiteIdToLcidMap(result: any, schema: string) {
    const websiteIdToLanguage = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (
                schema.toLowerCase() ===
                portal_schema_V2.entities.dataSourceProperties.schema
            ) {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const powerpagesiteid = result.value[counter]
                        .powerpagesiteid
                        ? result.value[counter].powerpagesiteid
                        : null;
                    const lcid = JSON.parse(result.value[counter].content)
                        .website_language as string;
                    websiteIdToLanguage.set(powerpagesiteid, lcid.toString());
                }
            } else {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const adx_websiteId = result.value[counter].adx_websiteid
                        ? result.value[counter].adx_websiteid
                        : null;
                    const lcid = result.value[counter].adx_website_language;
                    websiteIdToLanguage.set(adx_websiteId, lcid);
                }
            }
        }
    }

    return websiteIdToLanguage;
}

export function getWebsiteLanguageIdToPortalLanguageIdMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
    schema: string
) {
    const websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
    if (result) {
        if (result.value?.length > 0) {
            if (
                schema.toLowerCase() ===
                portal_schema_V2.entities.dataSourceProperties.schema
            ) {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const powerpagesitelanguageid = result.value[counter]
                        .powerpagesitelanguageid
                        ? result.value[counter].powerpagesitelanguageid
                        : null;
                    websiteLanguageIdToPortalLanguageMap.set(
                        powerpagesitelanguageid,
                        powerpagesitelanguageid
                    );
                }
            } else {
                for (
                    let counter = 0;
                    counter < result.value.length;
                    counter++
                ) {
                    const adx_portalLanguageId_value = result.value[counter]
                        ._adx_portallanguageid_value
                        ? result.value[counter]._adx_portallanguageid_value
                        : Constants.PORTAL_LANGUAGE_DEFAULT;
                    const adx_websitelanguageid =
                        result.value[counter].adx_websitelanguageid;
                    websiteLanguageIdToPortalLanguageMap.set(
                        adx_websitelanguageid,
                        adx_portalLanguageId_value
                    );
                }
            }
        }
    }

    return websiteLanguageIdToPortalLanguageMap;
}
