/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { dataverseAuthentication, getCustomRequestURL, getHeader } from "./authenticationProvider";
import { httpMethod, MULTI_ENTITY_URL_KEY, ORG_URL, pathParamToSchema, PORTALS_URI_SCHEME, PORTAL_LANGUAGES, PORTAL_LANGUAGE_DEFAULT, WEBSITES, WEBSITE_LANGUAGES, WEBSITE_NAME } from "./constants";
import { getDataSourcePropertiesMap, getEntitiesFolderNameMap, getEntitiesSchemaMap } from "./portalSchemaReader";
import { SaveEntityDetails } from "./portalSchemaInterface";
import { sendAPIFailureTelemetry, sendAPISuccessTelemetry, sendAPITelemetry } from "../telemetry/webExtensionTelemetry";

export interface IPowerPlatformExtensionContext {
    dataSourcePropertiesMap: Map<string, string>; // dataSourceProperties in portal_schema_data
    entitiesSchemaMap: Map<string, Map<string, string>>;
    queryParamsMap: Map<string, string>;
    languageIdCodeMap: Map<string, string>;
    websiteLanguageIdToPortalLanguageMap: Map<string, string>;
    websiteIdToLanguage: Map<string, string>;
    entitiesFolderNameMap: Map<string, string> // FolderName for entity, schemaEntityName
    entityId: string;
    entity: string;
    rootDirectory: vscode.Uri;
    saveDataMap: Map<string, SaveEntityDetails>,
    defaultFileUri: vscode.Uri // This will default to home page or current page in multifile scenario
}

class PowerPlatformExtensionContextManager {
    private entitiesSchemaMap = getEntitiesSchemaMap();
    private dataSourcePropertiesMap = getDataSourcePropertiesMap();
    private entitiesFolderNameMap = getEntitiesFolderNameMap(this.entitiesSchemaMap);

    private PowerPlatformExtensionContext: IPowerPlatformExtensionContext = {
        dataSourcePropertiesMap: this.dataSourcePropertiesMap,
        entitiesSchemaMap: this.entitiesSchemaMap,
        languageIdCodeMap: new Map<string, string>(),
        websiteLanguageIdToPortalLanguageMap: new Map<string, string>(),
        websiteIdToLanguage: new Map<string, string>(),
        queryParamsMap: new Map<string, string>(),
        entitiesFolderNameMap: this.entitiesFolderNameMap,
        entity: '',
        entityId: '',
        rootDirectory: vscode.Uri.parse(''),
        saveDataMap: new Map<string, SaveEntityDetails>(),
        defaultFileUri: vscode.Uri.parse(``)
    };

    public getPowerPlatformExtensionContext() {
        return this.PowerPlatformExtensionContext;
    }

    public async setPowerPlatformExtensionContext(pseudoEntityName: string, entityId: string, queryParamsMap: Map<string, string>) {
        this.PowerPlatformExtensionContext = {
            ...this.PowerPlatformExtensionContext,
            entity: pathParamToSchema.get(pseudoEntityName) as string,
            entityId: entityId,
            queryParamsMap: queryParamsMap,
            rootDirectory: vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${queryParamsMap.get(WEBSITE_NAME) as string}/`, true)
        };

        return this.PowerPlatformExtensionContext;
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.PowerPlatformExtensionContext.queryParamsMap.get(ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);

        if (accessToken) {
            this.PowerPlatformExtensionContext = {
                ... this.PowerPlatformExtensionContext,
                websiteIdToLanguage: await this.websiteIdToLanguageMap(accessToken, dataverseOrgUrl),
                websiteLanguageIdToPortalLanguageMap: await this.websiteLanguageIdToPortalLanguage(accessToken, dataverseOrgUrl),
                languageIdCodeMap: await this.languageIdToCode(accessToken, dataverseOrgUrl)
            };
        }

        return this.PowerPlatformExtensionContext;
    }

    public async updateSaveDataDetailsInContext(dataMap: Map<string, SaveEntityDetails>) {
        this.PowerPlatformExtensionContext = {
            ...this.PowerPlatformExtensionContext,
            saveDataMap: dataMap
        };

        return this.PowerPlatformExtensionContext;
    }

    public async updateSingleFileUrisInContext(uri: vscode.Uri) {
        this.PowerPlatformExtensionContext = {
            ...this.PowerPlatformExtensionContext,
            defaultFileUri: uri
        };

        return this.PowerPlatformExtensionContext;
    }

    private async languageIdToCode(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        const languageIdCodeMap = new Map<string, string>();
        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, PORTAL_LANGUAGES, MULTI_ENTITY_URL_KEY);
            sendAPITelemetry(requestUrl, PORTAL_LANGUAGES, httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, PORTAL_LANGUAGES, httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, PORTAL_LANGUAGES, httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
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
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, PORTAL_LANGUAGES, httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return languageIdCodeMap;
    }

    private async websiteLanguageIdToPortalLanguage(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        const websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, WEBSITE_LANGUAGES, MULTI_ENTITY_URL_KEY);
            sendAPITelemetry(requestUrl, WEBSITE_LANGUAGES, httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, WEBSITE_LANGUAGES, httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, WEBSITE_LANGUAGES, httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
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
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, WEBSITE_LANGUAGES, httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return websiteLanguageIdToPortalLanguageMap;
    }

    private async websiteIdToLanguageMap(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        const websiteIdToLanguage = new Map<string, string>();
        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, WEBSITES, MULTI_ENTITY_URL_KEY);
            sendAPITelemetry(requestUrl, WEBSITES, httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });

            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, WEBSITES, httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, WEBSITES, httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();

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
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, WEBSITES, httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return websiteIdToLanguage;
    }
}

export default new PowerPlatformExtensionContextManager();
