/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { dataverseAuthentication, getCustomRequestURL, getHeader } from "./authenticationProvider";
import * as Constants from "./constants";
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

    private PowerPlatformExtensionContext: IPowerPlatformExtensionContext = {
        dataSourcePropertiesMap: new Map<string, string>(),
        entitiesSchemaMap: new Map<string, Map<string, string>>(),
        languageIdCodeMap: new Map<string, string>(),
        websiteLanguageIdToPortalLanguageMap: new Map<string, string>(),
        websiteIdToLanguage: new Map<string, string>(),
        queryParamsMap: new Map<string, string>(),
        entitiesFolderNameMap: new Map<string, string>(),
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
            entity: Constants.pathParamToSchema.get(pseudoEntityName) as string,
            entityId: entityId,
            queryParamsMap: queryParamsMap,
            rootDirectory: vscode.Uri.parse(`${Constants.PORTALS_URI_SCHEME}:/${queryParamsMap.get(Constants.WEBSITE_NAME) as string}/`, true),
            entitiesSchemaMap: getEntitiesSchemaMap(this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string),
            dataSourcePropertiesMap: getDataSourcePropertiesMap(this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string),
            entitiesFolderNameMap: getEntitiesFolderNameMap(this.PowerPlatformExtensionContext.entitiesSchemaMap)
        };

        return this.PowerPlatformExtensionContext;
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);
        const schema = this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string;

        if (accessToken) {
            this.PowerPlatformExtensionContext = {
                ... this.PowerPlatformExtensionContext,
                websiteIdToLanguage: await this.websiteIdToLanguageMap(accessToken, dataverseOrgUrl),
                websiteLanguageIdToPortalLanguageMap: await this.websiteLanguageIdToPortalLanguage(accessToken, dataverseOrgUrl),
                languageIdCodeMap: await this.languageIdToCode(accessToken, dataverseOrgUrl, schema)
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

    private async languageIdToCode(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        const languageIdCodeMap = new Map<string, string>();
        try {
            switch (schema) {
                case Constants.OLD_SCHEMA_NAME:
                    requestUrl = getCustomRequestURL(dataverseOrgUrl, Constants.PORTAL_LANGUAGES, Constants.MULTI_ENTITY_URL_KEY);
                    break;
                case Constants.NEW_SCHEMA_NAME:
                    requestUrl = getCustomRequestURL(dataverseOrgUrl, Constants.NEW_PORTAL_LANGUAGES, Constants.SINGLE_ENTITY_LANGUAGE_KEY);
                    break;
                default:
                    break;
            }
            sendAPITelemetry(requestUrl, Constants.PORTAL_LANGUAGES, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, Constants.PORTAL_LANGUAGES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, Constants.PORTAL_LANGUAGES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
            if (result) {
                if (result.value?.length > 0) {
                    if (schema === Constants.OLD_SCHEMA_NAME) {
                        for (let counter = 0; counter < result.value.length; counter++) {
                            const adx_lcid = result.value[counter].adx_lcid ? result.value[counter].adx_lcid : Constants.PORTAL_LANGUAGE_DEFAULT;
                            const adx_languagecode = result.value[counter].adx_languagecode;
                            languageIdCodeMap.set(adx_lcid, adx_languagecode);
                        }
                    }
                    else {
                        for (let counter = 0; counter < result.value.length; counter++) {
                            const powerpagesitelanguageid = result.value[counter].powerpagesitelanguageid ? result.value[counter].powerpagesitelanguageid : Constants.PORTAL_LANGUAGE_DEFAULT;
                            const languagecode = result.value[counter].languagecode;
                            languageIdCodeMap.set(powerpagesitelanguageid, languagecode);
                        }
                    }
                }
            }
        } catch (error) {
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, Constants.PORTAL_LANGUAGES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return languageIdCodeMap;
    }

    private async websiteLanguageIdToPortalLanguage(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        const websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, Constants.WEBSITE_LANGUAGES, Constants.MULTI_ENTITY_URL_KEY);
            sendAPITelemetry(requestUrl, Constants.WEBSITE_LANGUAGES, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, Constants.WEBSITE_LANGUAGES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, Constants.WEBSITE_LANGUAGES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
            if (result) {
                if (result.value?.length > 0) {
                    for (let counter = 0; counter < result.value.length; counter++) {
                        const adx_portalLanguageId_value = result.value[counter].adx_portallanguageid_value ? result.value[counter].adx_portallanguageid_value : Constants.PORTAL_LANGUAGE_DEFAULT;
                        const adx_websitelanguageid = result.value[counter].adx_websitelanguageid;
                        websiteLanguageIdToPortalLanguageMap.set(adx_websitelanguageid, adx_portalLanguageId_value);
                    }
                }
            }
        } catch (error) {
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, Constants.WEBSITE_LANGUAGES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return websiteLanguageIdToPortalLanguageMap;
    }

    private async websiteIdToLanguageMap(accessToken: string, dataverseOrgUrl: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        const websiteIdToLanguage = new Map<string, string>();
        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, Constants.WEBSITES, Constants.MULTI_ENTITY_URL_KEY);
            sendAPITelemetry(requestUrl, Constants.WEBSITES, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });

            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, Constants.WEBSITES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, Constants.WEBSITES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
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
            sendAPIFailureTelemetry(requestUrl, Constants.WEBSITES, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return websiteIdToLanguage;
    }
}

export default new PowerPlatformExtensionContextManager();
