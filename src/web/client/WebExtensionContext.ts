/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { dataverseAuthentication, getHeader } from "./common/authenticationProvider";
import * as Constants from "./common/constants";
import { getDataSourcePropertiesMap, getEntitiesFolderNameMap, getEntitiesSchemaMap } from "./schema/portalSchemaReader";
import { FileData } from "./context/fileData";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import { getLanguageIdCodeMap, getWebsiteIdToLanguageMap, getwebsiteLanguageIdToPortalLanguageMap, IAttributePath } from "./utilities/schemaHelperUtil";
import { getCustomRequestURL } from "./utilities/urlBuilderUtil";
import { schemaKey } from "./schema/constants";
import { telemetryEventNames } from "./telemetry/constants";
import { EntityDataMap } from "./context/entityDataMap";

export interface IWebExtensionContext {
    // From portalSchema properties
    schemaDataSourcePropertiesMap: Map<string, string>; // dataSourceProperties in portal_schema_data
    schemaEntitiesMap: Map<string, Map<string, string>>;
    entitiesFolderNameMap: Map<string, string> // FolderName for entity, schemaEntityName

    // Passed from Vscode URL call
    urlParametersMap: Map<string, string>;

    // Language maps from dataverse
    languageIdCodeMap: Map<string, string>;
    websiteLanguageIdToPortalLanguageMap: Map<string, string>;
    websiteIdToLanguage: Map<string, string>;

    // VScode specific details
    rootDirectory: vscode.Uri;
    fileDataMap: Map<string, FileData>, // VFS file URI to file detail map - TODO - convert to class
    deafaultEntityId: string;
    defaultEntityType: string;
    defaultFileUri: vscode.Uri, // This will default to home page or current page in multifile scenario

    // Org specific details
    dataverseAccessToken: string;
    entityDataMap: EntityDataMap,
    isContextSet: boolean,
    currentSchemaVersion: string
}

class WebExtensionContext {
    public telemetry: WebExtensionTelemetry = new WebExtensionTelemetry();

    private webExtensionContext: IWebExtensionContext = {
        schemaDataSourcePropertiesMap: new Map<string, string>(),
        schemaEntitiesMap: new Map<string, Map<string, string>>(),
        languageIdCodeMap: new Map<string, string>(),
        websiteLanguageIdToPortalLanguageMap: new Map<string, string>(),
        websiteIdToLanguage: new Map<string, string>(),
        urlParametersMap: new Map<string, string>(),
        entitiesFolderNameMap: new Map<string, string>(),
        defaultEntityType: '',
        deafaultEntityId: '',
        dataverseAccessToken: '',
        rootDirectory: vscode.Uri.parse(''),
        fileDataMap: new Map<string, FileData>(),
        entityDataMap: new EntityDataMap,
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
        this.webExtensionContext.defaultEntityType = entityName.toLowerCase();
        this.webExtensionContext.deafaultEntityId = entityId;
        this.webExtensionContext.urlParametersMap = queryParamsMap;
        this.webExtensionContext.rootDirectory = vscode.Uri.parse(`${Constants.PORTALS_URI_SCHEME}:/${queryParamsMap.get(Constants.queryParameters.WEBSITE_NAME) as string}/`, true);

        // Initialize context from schema values
        this.webExtensionContext.schemaEntitiesMap = getEntitiesSchemaMap(schema);
        this.webExtensionContext.schemaDataSourcePropertiesMap = getDataSourcePropertiesMap(schema);
        this.webExtensionContext.entitiesFolderNameMap = getEntitiesFolderNameMap(this.webExtensionContext.schemaEntitiesMap);
        this.webExtensionContext.isContextSet = true;
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.webExtensionContext.urlParametersMap.get(Constants.queryParameters.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);
        const schema = this.webExtensionContext.urlParametersMap.get(schemaKey.SCHEMA_VERSION)?.toLowerCase() as string;

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
        const dataverseOrgUrl = this.webExtensionContext.urlParametersMap.get(Constants.queryParameters.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);

        if (!accessToken) {
            this.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING);
            throw vscode.FileSystemError.NoPermissions();
        }

        this.webExtensionContext = {
            ... this.webExtensionContext,
            dataverseAccessToken: accessToken,
        };

        return this.webExtensionContext;
    }

    public async updateFileDetailsInContext(dataMap: Map<string, FileData>) {
        this.webExtensionContext = {
            ...this.webExtensionContext,
            fileDataMap: dataMap

        };

        return this.webExtensionContext;
    }

    public async updateEntityDetailsInContext(entityId: string,
        entityName: string,
        odataEtag: string,
        attributePath: IAttributePath,
        attributeContent: string) {
        this.webExtensionContext.entityDataMap.setEntity(entityId, entityName, odataEtag, attributePath, attributeContent);
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
