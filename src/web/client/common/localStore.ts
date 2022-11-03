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
import { getEntityName, getPortalLanguageEntityName, getLanguageIdCodeMap, getWebsiteEntityName, getWebsiteLanguageEntityName, getWebsiteIdToLanguageMap, getwebsiteLanguageIdToPortalLanguageMap } from "../utility/schemaHelper";

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
    defaultFileUri: vscode.Uri, // This will default to home page or current page in multifile scenario
    contextSet: boolean
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
        defaultFileUri: vscode.Uri.parse(``),
        contextSet: false
    };

    public getPowerPlatformExtensionContext() {
        console.log("getPowerPlatformExtensionContext", this.PowerPlatformExtensionContext, this.PowerPlatformExtensionContext.rootDirectory);
        return this.PowerPlatformExtensionContext;
    }

    public async setPowerPlatformExtensionContext(pseudoEntityName: string, entityId: string, queryParamsMap: Map<string, string>) {
        console.log("setPowerPlatformExtensionContext", "Initializing context");
        // Initialize context from URL params
        this.PowerPlatformExtensionContext.entity = getEntityName(pseudoEntityName);
        this.PowerPlatformExtensionContext.entityId = entityId;
        this.PowerPlatformExtensionContext.queryParamsMap = queryParamsMap;
        this.PowerPlatformExtensionContext.rootDirectory = vscode.Uri.parse(`${Constants.PORTALS_URI_SCHEME}:/${queryParamsMap.get(Constants.WEBSITE_NAME) as string}/`, true);

        console.log("setPowerPlatformExtensionContext", queryParamsMap.size);

        // Initialize context from schema values
        this.PowerPlatformExtensionContext.entitiesSchemaMap = getEntitiesSchemaMap(queryParamsMap.get(Constants.SCHEMA) as string);
        this.PowerPlatformExtensionContext.dataSourcePropertiesMap = getDataSourcePropertiesMap(queryParamsMap.get(Constants.SCHEMA) as string);
        this.PowerPlatformExtensionContext.entitiesFolderNameMap = getEntitiesFolderNameMap(this.PowerPlatformExtensionContext.entitiesSchemaMap);
        this.PowerPlatformExtensionContext.contextSet = true;

        console.log("setPowerPlatformExtensionContext", this.PowerPlatformExtensionContext);
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);
        const schema = this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.SCHEMA) as string;

        if (accessToken) {
            this.PowerPlatformExtensionContext = {
                ... this.PowerPlatformExtensionContext,
                websiteIdToLanguage: await this.websiteIdToLanguageMap(accessToken, dataverseOrgUrl, schema),
                websiteLanguageIdToPortalLanguageMap: await this.websiteLanguageIdToPortalLanguageMap(accessToken, dataverseOrgUrl, schema),
                languageIdCodeMap: await this.languageIdToCode(accessToken, dataverseOrgUrl, schema)
            };
        }

        console.log("authenticateAndUpdateDataverseProperties", this.PowerPlatformExtensionContext);

        return this.PowerPlatformExtensionContext;
    }

    public async updateSaveDataDetailsInContext(dataMap: Map<string, SaveEntityDetails>) {
        this.PowerPlatformExtensionContext = {
            ...this.PowerPlatformExtensionContext,
            saveDataMap: dataMap
        };

        console.log("updateSaveDataDetailsInContext", this.PowerPlatformExtensionContext);

        return this.PowerPlatformExtensionContext;
    }

    public async updateSingleFileUrisInContext(uri: vscode.Uri) {
        this.PowerPlatformExtensionContext = {
            ...this.PowerPlatformExtensionContext,
            defaultFileUri: uri
        };

        console.log("updateSingleFileUrisInContext", this.PowerPlatformExtensionContext);

        return this.PowerPlatformExtensionContext;
    }

    private async languageIdToCode(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime(); let languageIdCodeMap = new Map<string, string>();
        const languageEntityName = getPortalLanguageEntityName();

        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, languageEntityName, Constants.MULTI_ENTITY_URL_KEY);
            console.log("languageIdToCode getRequestUrl", requestUrl);
            sendAPITelemetry(requestUrl, Constants.PORTAL_LANGUAGES, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
            languageIdCodeMap = getLanguageIdCodeMap(result, schema);

        } catch (error) {
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return languageIdCodeMap;
    }

    private async websiteLanguageIdToPortalLanguageMap(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        const websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
        const languageEntityName = getWebsiteLanguageEntityName();

        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, languageEntityName, Constants.MULTI_ENTITY_URL_KEY);
            sendAPITelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
            getwebsiteLanguageIdToPortalLanguageMap(result, schema);
        } catch (error) {
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return websiteLanguageIdToPortalLanguageMap;
    }

    private async websiteIdToLanguageMap(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        let websiteIdToLanguage = new Map<string, string>();
        const websiteEntityName = getWebsiteEntityName();

        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, websiteEntityName, Constants.MULTI_ENTITY_URL_KEY);
            sendAPITelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });

            if (!response?.ok) {
                sendAPIFailureTelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            sendAPISuccessTelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();

            websiteIdToLanguage = getWebsiteIdToLanguageMap(result, schema);

        } catch (error) {
            const errorMsg = (error as Error)?.message;
            sendAPIFailureTelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return websiteIdToLanguage;
    }
}

export default new PowerPlatformExtensionContextManager();
