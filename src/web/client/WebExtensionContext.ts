/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import fetch from "node-fetch";
import * as vscode from "vscode";
import { dataverseAuthentication, getHeader } from "./common/authenticationProvider";
import * as Constants from "./common/constants";
import { getDataSourcePropertiesMap, getEntitiesFolderNameMap, getEntitiesSchemaMap } from "./schema/portalSchemaReader";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import { getLanguageIdCodeMap, getWebsiteIdToLanguageMap, getwebsiteLanguageIdToPortalLanguageMap, IAttributePath } from "./utilities/schemaHelperUtil";
import { getCustomRequestURL } from "./utilities/urlBuilderUtil";
import { schemaKey } from "./schema/constants";
import { telemetryEventNames } from "./telemetry/constants";
import { EntityDataMap } from "./context/entityDataMap";
import { FileDataMap } from "./context/fileDataMap";

export interface IWebExtensionContext {
    // From portalSchema properties
    schemaDataSourcePropertiesMap: Map<string, string>, // dataSourceProperties in portal_schema_data
    schemaEntitiesMap: Map<string, Map<string, string>>,
    entitiesFolderNameMap: Map<string, string>, // FolderName for entity, schemaEntityName

    // Passed from Vscode URL call
    urlParametersMap: Map<string, string>,

    // Language maps from dataverse
    languageIdCodeMap: Map<string, string>,
    websiteLanguageIdToPortalLanguageMap: Map<string, string>,
    websiteIdToLanguage: Map<string, string>,

    // VScode specific details
    rootDirectory: vscode.Uri,
    fileDataMap: FileDataMap, // VFS file URI to file detail map - TODO - convert to class
    defaultEntityId: string,
    defaultEntityType: string,
    defaultFileUri: vscode.Uri, // This will default to home page or current page in multifile scenario

    // Org specific details
    dataverseAccessToken: string,
    entityDataMap: EntityDataMap,
    isContextSet: boolean,
    currentSchemaVersion: string,
}

class WebExtensionContext implements IWebExtensionContext {
    private _schemaDataSourcePropertiesMap: Map<string, string>;
    private _schemaEntitiesMap: Map<string, Map<string, string>>;
    private _entitiesFolderNameMap: Map<string, string>;
    private _urlParametersMap: Map<string, string>;
    private _languageIdCodeMap: Map<string, string>;
    private _websiteLanguageIdToPortalLanguageMap: Map<string, string>;
    private _websiteIdToLanguage: Map<string, string>;
    private _rootDirectory: vscode.Uri;
    private _fileDataMap: FileDataMap;
    private _defaultEntityId: string;
    private _defaultEntityType: string;
    private _defaultFileUri: vscode.Uri;
    private _dataverseAccessToken: string;
    private _entityDataMap: EntityDataMap;
    private _isContextSet: boolean;
    private _currentSchemaVersion: string;
    private _telemetry: WebExtensionTelemetry;

    public get schemaDataSourcePropertiesMap() { return this._schemaDataSourcePropertiesMap; }
    public get schemaEntitiesMap() { return this._schemaEntitiesMap; }
    public get entitiesFolderNameMap() { return this._entitiesFolderNameMap; }
    public get urlParametersMap() { return this._urlParametersMap; }
    public get languageIdCodeMap() { return this._languageIdCodeMap; }
    public get websiteLanguageIdToPortalLanguageMap() { return this._websiteLanguageIdToPortalLanguageMap; }
    public get websiteIdToLanguage() { return this._websiteIdToLanguage; }
    public get rootDirectory() { return this._rootDirectory; }
    public get fileDataMap() { return this._fileDataMap; }
    public get defaultEntityId() { return this._defaultEntityId; }
    public get defaultEntityType() { return this._defaultEntityType; }
    public get defaultFileUri() { return this._defaultFileUri; }
    public get dataverseAccessToken() { return this._dataverseAccessToken; }
    public get entityDataMap() { return this._entityDataMap; }
    public get isContextSet() { return this._isContextSet; }
    public get currentSchemaVersion() { return this._currentSchemaVersion; }
    public get telemetry() { return this._telemetry; }

    constructor() {
        this._schemaDataSourcePropertiesMap = new Map<string, string>();
        this._schemaEntitiesMap = new Map<string, Map<string, string>>();
        this._languageIdCodeMap = new Map<string, string>();
        this._websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
        this._websiteIdToLanguage = new Map<string, string>();
        this._urlParametersMap = new Map<string, string>();
        this._entitiesFolderNameMap = new Map<string, string>();
        this._defaultEntityType = '';
        this._defaultEntityId = '';
        this._dataverseAccessToken = '';
        this._rootDirectory = vscode.Uri.parse('');
        this._fileDataMap = new FileDataMap;
        this._entityDataMap = new EntityDataMap;
        this._defaultFileUri = vscode.Uri.parse(``);
        this._isContextSet = false;
        this._currentSchemaVersion = "";
        this._telemetry = new WebExtensionTelemetry();
    }

    public setWebExtensionContext(entityName: string, entityId: string, queryParamsMap: Map<string, string>) {
        const schema = queryParamsMap.get(schemaKey.SCHEMA_VERSION) as string;
        // Initialize context from URL params
        this._currentSchemaVersion = schema;
        this._defaultEntityType = entityName.toLowerCase();
        this._defaultEntityId = entityId;
        this._urlParametersMap = queryParamsMap;
        this._rootDirectory = vscode.Uri.parse(`${Constants.PORTALS_URI_SCHEME}:/${queryParamsMap.get(Constants.queryParameters.WEBSITE_NAME) as string}/`, true);

        // Initialize context from schema values
        this._schemaEntitiesMap = getEntitiesSchemaMap(schema);
        this._schemaDataSourcePropertiesMap = getDataSourcePropertiesMap(schema);
        this._entitiesFolderNameMap = getEntitiesFolderNameMap(this.schemaEntitiesMap);
        this._isContextSet = true;
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.urlParametersMap.get(Constants.queryParameters.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);
        const schema = this.urlParametersMap.get(schemaKey.SCHEMA_VERSION)?.toLowerCase() as string;

        if (accessToken) {
            this._websiteIdToLanguage = await this.populateWebsiteIdToLanguageMap(accessToken, dataverseOrgUrl, schema);
            this._websiteLanguageIdToPortalLanguageMap = await this.populateWebsiteLanguageIdToPortalLanguageMap(accessToken, dataverseOrgUrl, schema);
            this._languageIdCodeMap = await this.populateLanguageIdToCode(accessToken, dataverseOrgUrl, schema);
            this._dataverseAccessToken = accessToken;
        }
    }

    public async reAuthenticate() {
        const dataverseOrgUrl = this.urlParametersMap.get(Constants.queryParameters.ORG_URL) as string;
        const accessToken: string = await dataverseAuthentication(dataverseOrgUrl);

        if (!accessToken) {
            this.telemetry.sendErrorTelemetry(telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING);
            throw vscode.FileSystemError.NoPermissions();
        }
        this._dataverseAccessToken = accessToken;
    }

    public async updateFileDetailsInContext(
        fileUri: string,
        entityId: string,
        entityName: string,
        fileName: string,
        odataEtag: string,
        fileExtension: string,
        attributePath: IAttributePath,
        encodeAsBase64: boolean,
        mimeType?: string
    ) {
        this.fileDataMap.setEntity(
            fileUri,
            entityId,
            entityName,
            fileName,
            odataEtag,
            fileExtension,
            attributePath,
            encodeAsBase64,
            mimeType);
    }

    public async updateEntityDetailsInContext(
        entityId: string,
        entityName: string,
        odataEtag: string,
        attributePath: IAttributePath,
        attributeContent: string
    ) {
        this.entityDataMap.setEntity(entityId, entityName, odataEtag, attributePath, attributeContent);
    }

    public async updateSingleFileUrisInContext(uri: vscode.Uri) {
        this._defaultFileUri = uri
    }

    private async populateLanguageIdToCode(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
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

    private async populateWebsiteLanguageIdToPortalLanguageMap(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
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

    private async populateWebsiteIdToLanguageMap(accessToken: string, dataverseOrgUrl: string, schema: string): Promise<Map<string, string>> {
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
