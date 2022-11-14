/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { dataverseAuthentication, getHeader } from "./authenticationProvider";
import * as Constants from "./constants";
import { getDataSourcePropertiesMap, getEntitiesFolderNameMap, getEntitiesSchemaMap } from "./portalSchemaReader";
import { SaveEntityDetails } from "./portalSchemaInterface";
import { sendAPIFailureTelemetry, sendAPISuccessTelemetry, sendAPITelemetry } from "../telemetry/webExtensionTelemetry";
import { getLanguageIdCodeMap, getWebsiteIdToLanguageMap, getwebsiteLanguageIdToPortalLanguageMap } from "../utility/schemaHelper";
import { getCustomRequestURL } from "../utility/UrlBuilder";

export interface IPowerPlatformExtensionContext {
    dataSourcePropertiesMap: Map<string, string>; // dataSourceProperties in portal_schema_data
    entitiesSchemaMap: Map<string, Map<string, string>>;
    queryParamsMap: Map<string, string>;
    languageIdCodeMap: Map<string, string>;
    websiteLanguageIdToPortalLanguageMap: Map<string, string>;
    websiteIdToLanguage: Map<string, string>;
    entitiesFolderNameMap: Map<string, string> // FolderName for entity, schemaEntityName
    dataverseAccessToken: string;
    entityId: string;
    entity: string;
    rootDirectory: vscode.Uri;
    saveDataMap: Map<string, SaveEntityDetails>,
    defaultFileUri: vscode.Uri, // This will default to home page or current page in multifile scenario
    contextSet: boolean,
    currentSchema: string
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
        dataverseAccessToken: '',
        rootDirectory: vscode.Uri.parse(''),
        saveDataMap: new Map<string, SaveEntityDetails>(),
        defaultFileUri: vscode.Uri.parse(``),
        contextSet: false,
        currentSchema: ""
    };

    public getPowerPlatformExtensionContext() {
        return this.PowerPlatformExtensionContext;
    }

    public async setPowerPlatformExtensionContext(entityName: string, entityId: string, queryParamsMap: Map<string, string>) {
        const schema = queryParamsMap.get(Constants.schemaKey.SCHEMA_VERSION) as string;
        // Initialize context from URL params
        this.PowerPlatformExtensionContext.currentSchema = schema;
        this.PowerPlatformExtensionContext.entity = entityName.toLowerCase();
        this.PowerPlatformExtensionContext.entityId = entityId;
        this.PowerPlatformExtensionContext.queryParamsMap = queryParamsMap;
        this.PowerPlatformExtensionContext.rootDirectory = vscode.Uri.parse(`${Constants.PORTALS_URI_SCHEME}:/${queryParamsMap.get(Constants.queryParameters.WEBSITE_NAME) as string}/`, true);

        // Initialize context from schema values
        this.PowerPlatformExtensionContext.entitiesSchemaMap = getEntitiesSchemaMap(schema);
        this.PowerPlatformExtensionContext.dataSourcePropertiesMap = getDataSourcePropertiesMap(schema);
        this.PowerPlatformExtensionContext.entitiesFolderNameMap = getEntitiesFolderNameMap(this.PowerPlatformExtensionContext.entitiesSchemaMap);
        this.PowerPlatformExtensionContext.contextSet = true;
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.queryParameters.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);
        const schema = this.PowerPlatformExtensionContext.queryParamsMap.get(Constants.schemaKey.SCHEMA_VERSION) as string;

        if (accessToken) {
            this.PowerPlatformExtensionContext = {
                ... this.PowerPlatformExtensionContext,
                websiteIdToLanguage: await this.websiteIdToLanguageMap(accessToken, dataverseOrgUrl, schema),
                websiteLanguageIdToPortalLanguageMap: await this.websiteLanguageIdToPortalLanguageMap(accessToken, dataverseOrgUrl, schema),
                languageIdCodeMap: await this.languageIdToCode(accessToken, dataverseOrgUrl, schema)
                dataverseAccessToken: accessToken
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
        let languageIdCodeMap = new Map<string, string>();
        const languageEntityName = Constants.initializationEntityName.PORTALLANGUAGE;

        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, languageEntityName);
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
        const languageEntityName = Constants.initializationEntityName.WEBSITELANGUAGE;

        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, languageEntityName);
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
        const websiteEntityName = Constants.initializationEntityName.WEBSITE;

        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, websiteEntityName);
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
