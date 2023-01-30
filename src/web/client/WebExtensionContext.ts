/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { dataverseAuthentication, getHeader } from "./common/authenticationProvider";
import * as Constants from "./common/constants";
import { getDataSourcePropertiesMap, getEntitiesFolderNameMap, getEntitiesSchemaMap } from "./schema/portalSchemaReader";
import { SaveEntityDetails } from "./schema/portalSchemaInterface";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import { getLanguageIdCodeMap, getWebsiteIdToLanguageMap, getwebsiteLanguageIdToPortalLanguageMap } from "./utilities/schemaHelperUtil";
import { getCustomRequestURL } from "./utilities/urlBuilderUtil";
import { schemaKey } from "./schema/constants";

export interface IWebExtensionContext {
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
    isContextSet: boolean,
    currentSchemaVersion: string
}

class WebExtensionContext {
    public telemetry: WebExtensionTelemetry = new WebExtensionTelemetry();

    private webExtensionContext: IWebExtensionContext = {
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
        isContextSet: false,
        currentSchemaVersion: ""
    };

    public getWebExtensionContext() {
        return this.webExtensionContext;
    }

    public setWebExtensionContext(entityName: string, entityId: string, queryParamsMap: Map<string, string>) {
        const schema = queryParamsMap.get(schemaKey.SCHEMA_VERSION) as string;
        // Initialize context from URL params
        this.webExtensionContext.currentSchemaVersion = schema;
        this.webExtensionContext.entity = entityName.toLowerCase();
        this.webExtensionContext.entityId = entityId;
        this.webExtensionContext.queryParamsMap = queryParamsMap;
        this.webExtensionContext.rootDirectory = vscode.Uri.parse(`${Constants.PORTALS_URI_SCHEME}:/${queryParamsMap.get(Constants.queryParameters.WEBSITE_NAME) as string}/`, true);

        // Initialize context from schema values
        this.webExtensionContext.entitiesSchemaMap = getEntitiesSchemaMap(schema);
        this.webExtensionContext.dataSourcePropertiesMap = getDataSourcePropertiesMap(schema);
        this.webExtensionContext.entitiesFolderNameMap = getEntitiesFolderNameMap(this.webExtensionContext.entitiesSchemaMap);
        this.webExtensionContext.isContextSet = true;
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.webExtensionContext.queryParamsMap.get(Constants.queryParameters.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);
        const schema = this.webExtensionContext.queryParamsMap.get(schemaKey.SCHEMA_VERSION)?.toLowerCase() as string;

        if (accessToken) {
            this.webExtensionContext = {
                ... this.webExtensionContext,
                websiteIdToLanguage: await this.websiteIdToLanguageMap(accessToken, dataverseOrgUrl, schema),
                websiteLanguageIdToPortalLanguageMap: await this.websiteLanguageIdToPortalLanguageMap(accessToken, dataverseOrgUrl, schema),
                languageIdCodeMap: await this.languageIdToCode(accessToken, dataverseOrgUrl, schema),
                dataverseAccessToken: accessToken,
            };
        }

        return this.webExtensionContext;
    }

    public async reAuthenticate() {
        const dataverseOrgUrl = this.webExtensionContext.queryParamsMap.get(Constants.queryParameters.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);

        if (accessToken) {
            this.webExtensionContext = {
                ... this.webExtensionContext,
                dataverseAccessToken: accessToken,
            };
        }

        return this.webExtensionContext;
    }

    public async updateSaveDataDetailsInContext(dataMap: Map<string, SaveEntityDetails>) {
        this.webExtensionContext = {
            ...this.webExtensionContext,
            saveDataMap: dataMap
        };

        return this.webExtensionContext;
    }

    public async updateSingleFileUrisInContext(uri: vscode.Uri) {
        this.webExtensionContext = {
            ...this.webExtensionContext,
            defaultFileUri: uri
        };

        return this.webExtensionContext;
    }

    private async languageIdToCode(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
        let requestUrl = '';
        let requestSentAtTime = new Date().getTime();
        let languageIdCodeMap = new Map<string, string>();
        const languageEntityName = Constants.initializationEntityName.PORTALLANGUAGE;

        try {
            requestUrl = getCustomRequestURL(dataverseOrgUrl, languageEntityName);
            this.telemetry.sendAPITelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                this.telemetry.sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            this.telemetry.sendAPISuccessTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
            languageIdCodeMap = getLanguageIdCodeMap(result, schema);

        } catch (error) {
            const errorMsg = (error as Error)?.message;
            this.telemetry.sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
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
            this.telemetry.sendAPITelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });
            if (!response?.ok) {
                this.telemetry.sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            this.telemetry.sendAPISuccessTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();
            getwebsiteLanguageIdToPortalLanguageMap(result, schema);
        } catch (error) {
            const errorMsg = (error as Error)?.message;
            this.telemetry.sendAPIFailureTelemetry(requestUrl, languageEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
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
            this.telemetry.sendAPITelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET);

            requestSentAtTime = new Date().getTime();
            const response = await fetch(requestUrl, {
                headers: getHeader(accessToken),
            });

            if (!response?.ok) {
                this.telemetry.sendAPIFailureTelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, response?.statusText);
            }
            this.telemetry.sendAPISuccessTelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime);
            const result = await response?.json();

            websiteIdToLanguage = getWebsiteIdToLanguageMap(result, schema);

        } catch (error) {
            const errorMsg = (error as Error)?.message;
            this.telemetry.sendAPIFailureTelemetry(requestUrl, websiteEntityName, Constants.httpMethod.GET, new Date().getTime() - requestSentAtTime, errorMsg);
        }
        return websiteIdToLanguage;
    }
}

export default new WebExtensionContext();
