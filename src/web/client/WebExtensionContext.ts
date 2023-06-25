/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    dataverseAuthentication,
    getCommonHeaders,
} from "./common/authenticationProvider";
import * as Constants from "./common/constants";
import {
    getDataSourcePropertiesMap,
    getEntitiesFolderNameMap,
    getEntitiesSchemaMap,
} from "./schema/portalSchemaReader";
import { WebExtensionTelemetry } from "./telemetry/webExtensionTelemetry";
import {
    getLcidCodeMap,
    getPortalLanguageIdToLcidMap,
    getWebsiteIdToLcidMap,
    getWebsiteLanguageIdToPortalLanguageIdMap,
} from "./utilities/schemaHelperUtil";
import { getCustomRequestURL } from "./utilities/urlBuilderUtil";
import { schemaKey } from "./schema/constants";
import { telemetryEventNames } from "./telemetry/constants";
import { EntityDataMap } from "./context/entityDataMap";
import { FileDataMap } from "./context/fileDataMap";
import { IAttributePath } from "./common/interfaces";
import { ConcurrencyHandler } from "./dal/concurrencyHandler";

export interface IWebExtensionContext {
    // From portalSchema properties
    schemaDataSourcePropertiesMap: Map<string, string>; // dataSourceProperties in portal_schema_data
    schemaEntitiesMap: Map<string, Map<string, string>>;
    entitiesFolderNameMap: Map<string, string>; // FolderName for entity, schemaEntityName

    // Passed from Vscode URL call
    urlParametersMap: Map<string, string>;

    // Language maps from dataverse
    languageIdCodeMap: Map<string, string>;
    portalLanguageIdCodeMap: Map<string, string>;
    websiteLanguageIdToPortalLanguageMap: Map<string, string>;
    websiteIdToLanguage: Map<string, string>;

    // VScode specific details
    rootDirectory: vscode.Uri;
    fileDataMap: FileDataMap; // VFS file URI to file detail map
    defaultEntityId: string;
    defaultEntityType: string;
    defaultFileUri: vscode.Uri; // This will default to home page or current page in multifile scenario

    // Org specific details
    dataverseAccessToken: string;
    entityDataMap: EntityDataMap;
    isContextSet: boolean;
    currentSchemaVersion: string;

    // Telemetry and survey
    telemetry: WebExtensionTelemetry;
    npsEligibility: boolean;
    userId: string;

    // Error handling
    concurrencyHandler: ConcurrencyHandler;
}

class WebExtensionContext implements IWebExtensionContext {
    private _schemaDataSourcePropertiesMap: Map<string, string>;
    private _schemaEntitiesMap: Map<string, Map<string, string>>;
    private _entitiesFolderNameMap: Map<string, string>;
    private _urlParametersMap: Map<string, string>;
    private _languageIdCodeMap: Map<string, string>;
    private _portalLanguageIdCodeMap: Map<string, string>;
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
    private _npsEligibility: boolean;
    private _userId: string;
    private _formsProEligibilityId: string;
    private _concurrencyHandler: ConcurrencyHandler

    public get schemaDataSourcePropertiesMap() {
        return this._schemaDataSourcePropertiesMap;
    }
    public get schemaEntitiesMap() {
        return this._schemaEntitiesMap;
    }
    public get entitiesFolderNameMap() {
        return this._entitiesFolderNameMap;
    }
    public get urlParametersMap() {
        return this._urlParametersMap;
    }
    public get languageIdCodeMap() {
        return this._languageIdCodeMap;
    }
    public get portalLanguageIdCodeMap() {
        return this._portalLanguageIdCodeMap;
    }
    public get websiteLanguageIdToPortalLanguageMap() {
        return this._websiteLanguageIdToPortalLanguageMap;
    }
    public get websiteIdToLanguage() {
        return this._websiteIdToLanguage;
    }
    public get rootDirectory() {
        return this._rootDirectory;
    }
    public get fileDataMap() {
        return this._fileDataMap;
    }
    public get defaultEntityId() {
        return this._defaultEntityId;
    }
    public get defaultEntityType() {
        return this._defaultEntityType;
    }
    public get defaultFileUri() {
        return this._defaultFileUri;
    }
    public get dataverseAccessToken() {
        return this._dataverseAccessToken;
    }
    public get entityDataMap() {
        return this._entityDataMap;
    }
    public get isContextSet() {
        return this._isContextSet;
    }
    public get currentSchemaVersion() {
        return this._currentSchemaVersion;
    }
    public get telemetry() {
        return this._telemetry;
    }
    public get npsEligibility() {
        return this._npsEligibility;
    }
    public get userId() {
        return this._userId;
    }
    public get formsProEligibilityId() {
        return this._formsProEligibilityId;
    }

    public get concurrencyHandler() {
        return this._concurrencyHandler;
    }

    constructor() {
        this._schemaDataSourcePropertiesMap = new Map<string, string>();
        this._schemaEntitiesMap = new Map<string, Map<string, string>>();
        this._languageIdCodeMap = new Map<string, string>();
        this._portalLanguageIdCodeMap = new Map<string, string>();
        this._websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
        this._websiteIdToLanguage = new Map<string, string>();
        this._urlParametersMap = new Map<string, string>();
        this._entitiesFolderNameMap = new Map<string, string>();
        this._defaultEntityType = "";
        this._defaultEntityId = "";
        this._dataverseAccessToken = "";
        this._rootDirectory = vscode.Uri.parse("");
        this._fileDataMap = new FileDataMap();
        this._entityDataMap = new EntityDataMap();
        this._defaultFileUri = vscode.Uri.parse(``);
        this._isContextSet = false;
        this._currentSchemaVersion = "";
        this._telemetry = new WebExtensionTelemetry();
        this._npsEligibility = false;
        this._userId = "";
        this._formsProEligibilityId = "";
        this._concurrencyHandler = new ConcurrencyHandler();
    }

    public setWebExtensionContext(
        entityName: string,
        entityId: string,
        queryParamsMap: Map<string, string>
    ) {
        const schema = queryParamsMap.get(schemaKey.SCHEMA_VERSION) as string;
        // Initialize context from URL params
        this._currentSchemaVersion = schema;
        this._defaultEntityType = entityName.toLowerCase();
        this._defaultEntityId = entityId;
        this._urlParametersMap = queryParamsMap;
        this._rootDirectory = vscode.Uri.parse(
            `${Constants.PORTALS_URI_SCHEME}:/${
                queryParamsMap.get(
                    Constants.queryParameters.WEBSITE_NAME
                ) as string
            }/`,
            true
        );

        // Initialize context from schema values
        this._schemaEntitiesMap = getEntitiesSchemaMap(schema);
        this._schemaDataSourcePropertiesMap =
            getDataSourcePropertiesMap(schema);
        this._entitiesFolderNameMap = getEntitiesFolderNameMap(
            this.schemaEntitiesMap
        );
        this._isContextSet = true;
    }

    public async authenticateAndUpdateDataverseProperties() {
        const dataverseOrgUrl = this.urlParametersMap.get(
            Constants.queryParameters.ORG_URL
        ) as string;
        const accessToken: string = await dataverseAuthentication(
            dataverseOrgUrl
        );
        const schema = this.urlParametersMap
            .get(schemaKey.SCHEMA_VERSION)
            ?.toLowerCase() as string;

        if (accessToken.length === 0) {
            // re-set all properties to default values
            this._dataverseAccessToken = "";
            this._websiteIdToLanguage = new Map<string, string>();
            this._websiteLanguageIdToPortalLanguageMap = new Map<
                string,
                string
            >();
            this._portalLanguageIdCodeMap = new Map<string, string>();
            this._languageIdCodeMap = new Map<string, string>();

            this.telemetry.sendErrorTelemetry(
                telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING
            );
            throw vscode.FileSystemError.NoPermissions();
        }

        this._dataverseAccessToken = accessToken;
        await this.populateWebsiteIdToLanguageMap(
            accessToken,
            dataverseOrgUrl,
            schema
        );

        await this.populateWebsiteLanguageIdToPortalLanguageMap(
            accessToken,
            dataverseOrgUrl,
            schema
        );
        await this.populateLanguageIdToCode(
            accessToken,
            dataverseOrgUrl,
            schema
        );
    }

    public async reAuthenticate() {
        const dataverseOrgUrl = this.urlParametersMap.get(
            Constants.queryParameters.ORG_URL
        ) as string;
        const accessToken: string = await dataverseAuthentication(
            dataverseOrgUrl
        );

        if (accessToken.length === 0) {
            // re-set all properties to default values
            this._dataverseAccessToken = "";
            this._websiteIdToLanguage = new Map<string, string>();
            this._websiteLanguageIdToPortalLanguageMap = new Map<
                string,
                string
            >();
            this._portalLanguageIdCodeMap = new Map<string, string>();
            this._languageIdCodeMap = new Map<string, string>();

            this.telemetry.sendErrorTelemetry(
                telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING
            );
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
        mimeType?: string,
        isContentLoaded?: boolean
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
            mimeType,
            isContentLoaded
        );
    }

    public async updateEntityDetailsInContext(
        entityId: string,
        entityName: string,
        odataEtag: string,
        attributePath: IAttributePath,
        attributeContent: string
    ) {
        this.entityDataMap.setEntity(
            entityId,
            entityName,
            odataEtag,
            attributePath,
            attributeContent
        );
    }

    public async updateSingleFileUrisInContext(uri: vscode.Uri) {
        this._defaultFileUri = uri;
    }

    private async populateLanguageIdToCode(
        accessToken: string,
        dataverseOrgUrl: string,
        schema: string
    ) {
        let requestUrl = "";
        let requestSentAtTime = new Date().getTime();
        const languageEntityName =
            Constants.initializationEntityName.PORTALLANGUAGE;

        try {
            requestUrl = getCustomRequestURL(
                dataverseOrgUrl,
                languageEntityName
            );
            this.telemetry.sendAPITelemetry(
                requestUrl,
                languageEntityName,
                Constants.httpMethod.GET
            );

            requestSentAtTime = new Date().getTime();
            const response = await this._concurrencyHandler.handleRequest(requestUrl, {
                headers: getCommonHeaders(accessToken),
            });
            if (!response?.ok) {
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    languageEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    response?.statusText,
                    '',
                    telemetryEventNames.WEB_EXTENSION_POPULATELANGUAGEIDTOCODE_API_ERROR,
                    response?.status as unknown as string
                );
            }
            this.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                languageEntityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime
            );
            const result = await response?.json();
            this._languageIdCodeMap = getLcidCodeMap(result, schema);
            this._portalLanguageIdCodeMap = getPortalLanguageIdToLcidMap(
                result,
                schema
            );
        } catch (error) {
            if ((error as Response)?.status>0){
                const errorMsg = (error as Error)?.message;
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    languageEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    errorMsg,
                    '',
                    telemetryEventNames.WEB_EXTENSION_POPULATELANGUAGEIDTOCODE_API_ERROR,
                    (error as Response)?.status as unknown as string
                );
            }else{
                this.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_POPULATELANGUAGEIDTOCODE_SYSTEM_ERROR,
                    (error as Error)?.message,
                    error as Error
                );
            }
        }
    }

    private async populateWebsiteLanguageIdToPortalLanguageMap(
        accessToken: string,
        dataverseOrgUrl: string,
        schema: string
    ) {
        let requestUrl = "";
        let requestSentAtTime = new Date().getTime();
        const languageEntityName =
            Constants.initializationEntityName.WEBSITELANGUAGE;

        try {
            requestUrl = getCustomRequestURL(
                dataverseOrgUrl,
                languageEntityName
            );
            this.telemetry.sendAPITelemetry(
                requestUrl,
                languageEntityName,
                Constants.httpMethod.GET
            );

            requestSentAtTime = new Date().getTime();
            const response = await this._concurrencyHandler.handleRequest(requestUrl, {
                headers: getCommonHeaders(accessToken),
            });
            if (!response?.ok) {
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    languageEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    response?.statusText,
                    '',
                    telemetryEventNames.WEB_EXTENSION_POPULATEWEBSITELANGUAGEIDTOPORTALLANGUAGE_API_ERROR,
                    response?.status as unknown as string
                );
            }
            this.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                languageEntityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime
            );
            const result = await response?.json();
            this._websiteLanguageIdToPortalLanguageMap =
                getWebsiteLanguageIdToPortalLanguageIdMap(result, schema);
        } catch (error) {
            if ((error as Response)?.status>0){
                const errorMsg = (error as Error)?.message;
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    languageEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    errorMsg,
                    '',
                    telemetryEventNames.WEB_EXTENSION_POPULATEWEBSITELANGUAGEIDTOPORTALLANGUAGE_API_ERROR,
                    (error as Response)?.status as unknown as string
            );
            }else{
                this.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_POPULATEWEBSITELANGUAGEIDTOPORTALLANGUAGE_SYSTEM_ERROR,
                    (error as Error)?.message,
                    error as Error
                );
            }
        }
    }

    private async populateWebsiteIdToLanguageMap(
        accessToken: string,
        dataverseOrgUrl: string,
        schema: string
    ) {
        let requestUrl = "";
        let requestSentAtTime = new Date().getTime();
        const websiteEntityName = Constants.initializationEntityName.WEBSITE;

        try {
            requestUrl = getCustomRequestURL(
                dataverseOrgUrl,
                websiteEntityName
            );
            this.telemetry.sendAPITelemetry(
                requestUrl,
                websiteEntityName,
                Constants.httpMethod.GET
            );

            requestSentAtTime = new Date().getTime();
            const response = await this._concurrencyHandler.handleRequest(requestUrl, {
                headers: getCommonHeaders(accessToken),
            });

            if (!response?.ok) {
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    websiteEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    response?.statusText,
                    '',
                    telemetryEventNames.WEB_EXTENSION_POPULATEWEBSITEIDTOLANGUAGE_API_ERROR,
                    response?.status as unknown as string
                );
            }
            this.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                websiteEntityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime
            );
            const result = await response?.json();
            this._websiteIdToLanguage = getWebsiteIdToLcidMap(result, schema);
        } catch (error) {
            if ((error as Response)?.status>0){
                const errorMsg = (error as Error)?.message;
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    websiteEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    errorMsg,
                    '',
                    telemetryEventNames.WEB_EXTENSION_POPULATEWEBSITEIDTOLANGUAGE_API_ERROR,
                    (error as Response)?.status as unknown as string
            );
            }else{
                this.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_POPULATEWEBSITEIDTOLANGUAGE_SYSTEM_ERROR,
                    (error as Error)?.message,
                    error as Error
                );
            }
        }
    }

    public setNPSEligibility(eligibility: boolean) {
        this._npsEligibility = eligibility;
    }
    public setUserId(uid: string) {
        this._userId = uid;
    }
    public setFormsProEligibilityId(formsProEligibilityId: string) {
        this._formsProEligibilityId = formsProEligibilityId;
    }
}

export default new WebExtensionContext();
