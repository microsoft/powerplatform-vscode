/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    dataverseAuthentication,
    getCommonHeadersForDataverse,
} from "../../common/services/AuthenticationProvider";
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
import { getCustomRequestURL, getOrCreateSharedWorkspace } from "./utilities/urlBuilderUtil";
import { SchemaEntityMetadata } from "./schema/constants";
import { webExtensionTelemetryEventNames } from "../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { EntityDataMap } from "./context/entityDataMap";
import { FileDataMap } from "./context/fileDataMap";
import { IAttributePath, IEntityInfo } from "./common/interfaces";
import { ConcurrencyHandler } from "./dal/concurrencyHandler";
import { getEnvironmentIdFromUrl, getMailToPath, getTeamChatURL } from "./utilities/commonUtil";
import { IConnectionData, UserDataMap } from "./context/userDataMap";
import { EntityForeignKeyDataMap } from "./context/entityForeignKeyDataMap";
import { QuickPickProvider } from "./webViews/QuickPickProvider";
import { UserCollaborationProvider } from "./webViews/userCollaborationProvider";
import { GraphClientService } from "./services/graphClientService";
import { ServiceEndpointCategory } from "../../common/services/Constants";
import { SiteVisibility } from "../../client/power-pages/actions-hub/models/SiteVisibility";

export interface IWebExtensionContext {
    // From portalSchema properties
    schemaDataSourcePropertiesMap: Map<string, string>; // dataSourceProperties in portal_schema_data
    schemaEntitiesMap: Map<string, Map<string, string>>;
    entitiesFolderNameMap: Map<string, string>; // FolderName for entity, schemaEntityName

    // Passed from Vscode URL call
    urlParametersMap: Map<string, string>;

    // VScode workspace state
    vscodeWorkspaceState: Map<string, IEntityInfo>;

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
    extensionActivationTime: number;
    extensionUri: vscode.Uri;

    // Org specific details
    dataverseAccessToken: string;
    entityDataMap: EntityDataMap;
    isContextSet: boolean;
    currentSchemaVersion: string;
    websiteLanguageCode: string;
    geoName: string;
    geoLongName: string;
    serviceEndpointCategory: ServiceEndpointCategory;
    organizationId: string;
    environmentId: string;

    // Telemetry and survey
    telemetry: WebExtensionTelemetry;
    npsEligibility: boolean;
    userId: string;

    // Error handling
    concurrencyHandler: ConcurrencyHandler;

    // Co-Presence for Power Pages Vscode for web
    worker: Worker | undefined;
    sharedWorkSpaceMap: Map<string, string>;
    containerId: string;
    currentConnectionId: string;
    connectedUsers: UserDataMap;
    quickPickProvider: QuickPickProvider;
    userCollaborationProvider: UserCollaborationProvider;
    graphClientService: GraphClientService;

    webpageNames: Set<string>;

    getWebpageNames(): Set<string>;

    websiteName: string;
}

class WebExtensionContext implements IWebExtensionContext {
    private _schemaDataSourcePropertiesMap: Map<string, string>;
    private _schemaEntitiesMap: Map<string, Map<string, string>>;
    private _entitiesFolderNameMap: Map<string, string>;
    private _urlParametersMap: Map<string, string>;
    private _vscodeWorkspaceState: Map<string, IEntityInfo>;
    private _languageIdCodeMap: Map<string, string>;
    private _portalLanguageIdCodeMap: Map<string, string>;
    private _websiteLanguageIdToPortalLanguageMap: Map<string, string>;
    private _websiteIdToLanguage: Map<string, string>;
    private _rootDirectory: vscode.Uri;
    private _fileDataMap: FileDataMap;
    private _defaultEntityId: string;
    private _defaultEntityType: string;
    private _defaultFileUri: vscode.Uri;
    private _extensionActivationTime: number;
    private _extensionUri: vscode.Uri;
    private _dataverseAccessToken: string;
    private _entityDataMap: EntityDataMap;
    private _entityForeignKeyDataMap: EntityForeignKeyDataMap;
    private _isContextSet: boolean;
    private _currentSchemaVersion: string;
    private _websiteLanguageCode: string;
    private _geoName: string;
    private _geoLongName: string;
    private _clusterLocation: string;
    private _serviceEndpointCategory: ServiceEndpointCategory;
    private _organizationId: string;
    private _environmentId: string;
    private _telemetry: WebExtensionTelemetry;
    private _npsEligibility: boolean;
    private _userId: string;
    private _formsProEligibilityId: string;
    private _concurrencyHandler: ConcurrencyHandler;
    private _worker: Worker | undefined;
    private _sharedWorkSpaceMap: Map<string, string>;
    private _containerId: string;
    private _currentConnectionId: string;
    private _connectedUsers: UserDataMap;
    private _quickPickProvider: QuickPickProvider;
    private _userCollaborationProvider: UserCollaborationProvider;
    private _graphClientService: GraphClientService;
    private _webpageNames: Set<string>;
    private _websiteName: string;
    private _tenantId: string;
    private _websiteId: string;
    private _schema: Constants.portalSchemaVersion;
    private _siteVisibility: SiteVisibility;
    private _orgUrl: string;
    private _region: string;

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
    public get vscodeWorkspaceState() {
        return this._vscodeWorkspaceState;
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
    public get extensionActivationTime() {
        return this._extensionActivationTime
    }
    public get extensionUri() {
        return this._extensionUri
    }
    public get dataverseAccessToken() {
        return this._dataverseAccessToken;
    }
    public get entityDataMap() {
        return this._entityDataMap;
    }
    public get entityForeignKeyDataMap() {
        return this._entityForeignKeyDataMap;
    }
    public get isContextSet() {
        return this._isContextSet;
    }
    public get currentSchemaVersion() {
        return this._currentSchemaVersion;
    }
    public get websiteLanguageCode() {
        return this._websiteLanguageCode;
    }
    public get geoName() {
        return this._geoName
    }
    public set geoName(name: string) {
        this._geoName = name;
    }
    public get geoLongName() {
        return this._geoLongName;
    }
    public set geoLongName(name: string) {
        this._geoLongName = name;
    }
    public get clusterLocation() {
        return this._clusterLocation;
    }
    public set clusterLocation(name: string) {
        this._clusterLocation = name;
    }
    public get serviceEndpointCategory() {
        return this._serviceEndpointCategory;
    }
    public set serviceEndpointCategory(name: ServiceEndpointCategory) {
        this._serviceEndpointCategory = name;
    }
    public get organizationId() {
        return this._organizationId;
    }
    public set organizationId(name: string) {
        this._organizationId = name;
    }
    public get environmentId() {
        return this._environmentId;
    }
    public set environmentId(name: string) {
        this._environmentId = name;
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
    public get worker() {
        return this._worker;
    }
    public get sharedWorkSpaceMap() {
        return this._sharedWorkSpaceMap;
    }
    public get connectedUsers() {
        return this._connectedUsers;
    }
    public get containerId() {
        return this._containerId;
    }
    public set containerId(containerId: string) {
        this._containerId = containerId;
    }
    public get currentConnectionId() {
        return this._currentConnectionId;
    }
    public get quickPickProvider() {
        return this._quickPickProvider;
    }
    public get userCollaborationProvider() {
        return this._userCollaborationProvider;
    }
    public get graphClientService() {
        return this._graphClientService;
    }
    public get webpageNames() {
        return this._webpageNames;
    }
    public get websiteName() {
        return this._websiteName;
    }
    public set websiteName(name: string) {
        this._websiteName = name;
    }
    public get tenantId() {
        return this._tenantId;
    }
    public set tenantId(id: string) {
        this._tenantId = id;
    }
    public get websiteId() {
        return this._websiteId;
    }
    public set websiteId(id: string) {
        this._websiteId = id;
    }
    public get schema() {
        return this._schema;
    }
    public set schema(schema: Constants.portalSchemaVersion) {
        this._schema = schema;
    }
    public get siteVisibility() {
        return this._siteVisibility;
    }
    public set siteVisibility(visibility: SiteVisibility) {
        this._siteVisibility = visibility;
    }
    public get orgUrl() {
        return this._orgUrl;
    }
    public set orgUrl(url: string) {
        this._orgUrl = url;
    }
    public get region() {
        return this._region;
    }
    public set region(region: string) {
        this._region = region;
    }

    constructor() {
        this._schemaDataSourcePropertiesMap = new Map<string, string>();
        this._schemaEntitiesMap = new Map<string, Map<string, string>>();
        this._languageIdCodeMap = new Map<string, string>();
        this._portalLanguageIdCodeMap = new Map<string, string>();
        this._websiteLanguageIdToPortalLanguageMap = new Map<string, string>();
        this._websiteIdToLanguage = new Map<string, string>();
        this._urlParametersMap = new Map<string, string>();
        this._vscodeWorkspaceState = new Map<string, IEntityInfo>();
        this._entitiesFolderNameMap = new Map<string, string>();
        this._defaultEntityType = "";
        this._defaultEntityId = "";
        this._dataverseAccessToken = "";
        this._rootDirectory = vscode.Uri.parse("");
        this._fileDataMap = new FileDataMap();
        this._entityDataMap = new EntityDataMap();
        this._entityForeignKeyDataMap = new EntityForeignKeyDataMap();
        this._defaultFileUri = vscode.Uri.parse(``);
        this._extensionActivationTime = new Date().getTime();
        this._extensionUri = vscode.Uri.parse("");
        this._isContextSet = false;
        this._currentSchemaVersion = "";
        this._websiteLanguageCode = "";
        this._geoName = "";
        this._geoLongName = "";
        this._clusterLocation = "";
        this._serviceEndpointCategory = ServiceEndpointCategory.NONE;
        this._organizationId = "";
        this._environmentId = "";
        this._telemetry = new WebExtensionTelemetry();
        this._npsEligibility = false;
        this._userId = "";
        this._formsProEligibilityId = "";
        this._concurrencyHandler = new ConcurrencyHandler();
        this._sharedWorkSpaceMap = new Map<string, string>();
        this._containerId = "";
        this._currentConnectionId = "";
        this._connectedUsers = new UserDataMap();
        this._quickPickProvider = new QuickPickProvider();
        this._userCollaborationProvider = new UserCollaborationProvider();
        this._graphClientService = new GraphClientService();
        this._webpageNames = new Set<string>();
        this._websiteName = "";
        this._tenantId = "";
        this._websiteId = "";
        this._schema = Constants.portalSchemaVersion.V1;
        this._siteVisibility = SiteVisibility.Public;
        this._orgUrl = "";
        this._region = "";
    }

    public setWebExtensionContext(
        entityName: string,
        entityId: string,
        queryParamsMap: Map<string, string>,
        extensionUri?: vscode.Uri
    ) {
        // Initialize context from URL params
        this._currentSchemaVersion = this.schema;
        this._defaultEntityType = (entityName && entityName.toLowerCase()) ?? queryParamsMap.get(Constants.queryParameters.ENTITY) as string ?? "";
        this._defaultEntityId = entityId ?? queryParamsMap.get(Constants.queryParameters.ENTITY_ID) as string ?? "";
        this._urlParametersMap = queryParamsMap;
        this._rootDirectory = vscode.Uri.parse(`${Constants.PORTALS_URI_SCHEME}:/${this._websiteName}/`, true);
        this._extensionUri = extensionUri as vscode.Uri

        // Initialize context from schema values
        this._schemaEntitiesMap = getEntitiesSchemaMap(this.schema);
        this._schemaDataSourcePropertiesMap =
            getDataSourcePropertiesMap(this.schema);
        this._entitiesFolderNameMap = getEntitiesFolderNameMap(
            this.schemaEntitiesMap
        );
        this._isContextSet = true;

        // Initialize org details
        this._organizationId = queryParamsMap.get(Constants.queryParameters.ORG_ID) as string ?? "";
        this._environmentId = getEnvironmentIdFromUrl();
    }

    public setVscodeWorkspaceState(workspaceState: vscode.Memento) {
        try {
            workspaceState.keys().forEach((key) => {
                const entityInfo = workspaceState.get(key) as IEntityInfo;
                this._vscodeWorkspaceState.set(key, entityInfo);
            });
            this.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_SET_VSCODE_WORKSPACE_STATE_SUCCESS,
                { count: this._vscodeWorkspaceState.size.toString() });
        } catch (error) {
            this.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_SET_VSCODE_WORKSPACE_STATE_FAILED,
                this.setVscodeWorkspaceState.name,
                error as string
            );
        }
    }

    public async authenticateAndUpdateDataverseProperties() {
        await this.dataverseAuthentication(true);

        const schema = this.schema;

        await this.populateWebsiteIdToLanguageMap(
            this._dataverseAccessToken,
            this._orgUrl,
            schema
        );

        await this.populateWebsiteLanguageIdToPortalLanguageMap(
            this._dataverseAccessToken,
            this._orgUrl,
            schema
        );
        await this.populateLanguageIdToCode(
            this._dataverseAccessToken,
            this._orgUrl,
            schema
        );

        await this.setWebsiteLanguageCode();

        const headers = getCommonHeadersForDataverse(this._dataverseAccessToken);

        // Populate shared workspace for Co-Presence
        await this.populateSharedWorkspace(headers, this._orgUrl, this._websiteId);
    }

    public async dataverseAuthentication(firstTimeAuth = false) {
        const { accessToken, userId } = await dataverseAuthentication(this._orgUrl, firstTimeAuth);

        if (accessToken.length === 0) {
            // re-set all properties to default values
            this._dataverseAccessToken = "";
            this._userId = "";
            this._websiteIdToLanguage = new Map<string, string>();
            this._websiteLanguageIdToPortalLanguageMap = new Map<
                string,
                string
            >();
            this._portalLanguageIdCodeMap = new Map<string, string>();
            this._languageIdCodeMap = new Map<string, string>();

            this.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING,
                dataverseAuthentication.name
            );
            throw vscode.FileSystemError.NoPermissions();
        }

        this._dataverseAccessToken = accessToken;
        this._userId = userId;

        if (firstTimeAuth) {
            this._telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_COMPLETED,
                {
                    userId: userId
                }
            );
        }
    }

    public getWebpageNames() {
        return this._webpageNames;
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
        isContentLoaded?: boolean,
        entityMetadata?: SchemaEntityMetadata
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
            isContentLoaded,
            entityMetadata);
    }

    public async updateEntityDetailsInContext(
        entityId: string,
        entityName: string,
        odataEtag: string,
        attributePath: IAttributePath,
        attributeContent: string,
        mappingEntityId?: string,
        fileUri?: string,
        rootWebPageId?: string,
    ) {
        this.entityDataMap.setEntity(
            entityId,
            entityName,
            odataEtag,
            attributePath,
            attributeContent,
            mappingEntityId,
            fileUri,
            rootWebPageId);
    }

    public async updateForeignKeyDetailsInContext(
        rootWebPageId: string,
        entityId: string,
    ) {
        this.entityForeignKeyDataMap.setEntityForeignKey(
            rootWebPageId,
            entityId
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
                Constants.httpMethod.GET,
                this.populateLanguageIdToCode.name
            );

            requestSentAtTime = new Date().getTime();
            const response = await this._concurrencyHandler.handleRequest(requestUrl, {
                headers: getCommonHeadersForDataverse(accessToken),
            });
            if (!response?.ok) {
                throw new Error(JSON.stringify(response));
            }
            this.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                languageEntityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                this.populateLanguageIdToCode.name
            );
            const result = await response?.json();
            this._languageIdCodeMap = getLcidCodeMap(result, schema);
            this._portalLanguageIdCodeMap = getPortalLanguageIdToLcidMap(
                result,
                schema
            );
        } catch (error) {
            if ((error as Response)?.status > 0) {
                const errorMsg = (error as Error)?.message;
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    languageEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    this.populateLanguageIdToCode.name,
                    errorMsg,
                    '',
                    (error as Response)?.status.toString(),
                );
            } else {
                this.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_LANGUAGE_ID_TO_CODE_SYSTEM_ERROR,
                    this.populateLanguageIdToCode.name,
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
                Constants.httpMethod.GET,
                this.populateWebsiteLanguageIdToPortalLanguageMap.name
            );

            requestSentAtTime = new Date().getTime();
            const response = await this._concurrencyHandler.handleRequest(requestUrl, {
                headers: getCommonHeadersForDataverse(accessToken),
            });
            if (!response?.ok) {
                throw new Error(JSON.stringify(response));
            }
            this.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                languageEntityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                this.populateWebsiteLanguageIdToPortalLanguageMap.name
            );
            const result = await response?.json();
            this._websiteLanguageIdToPortalLanguageMap =
                getWebsiteLanguageIdToPortalLanguageIdMap(result, schema);
        } catch (error) {
            if ((error as Response)?.status > 0) {
                const errorMsg = (error as Error)?.message;
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    languageEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    this.populateWebsiteLanguageIdToPortalLanguageMap.name,
                    errorMsg,
                    '',
                    (error as Response)?.status.toString()
                );
            } else {
                this.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_WEBSITE_LANGUAGE_ID_TO_PORTALLANGUAGE_SYSTEM_ERROR,
                    this.populateWebsiteLanguageIdToPortalLanguageMap.name,
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


            console.warn("********************** dataverseOrgUrl: ", dataverseOrgUrl);
            console.warn("********************** requestUrl: ", requestUrl);

            this.telemetry.sendAPITelemetry(
                requestUrl,
                websiteEntityName,
                Constants.httpMethod.GET,
                this.populateWebsiteIdToLanguageMap.name
            );

            requestSentAtTime = new Date().getTime();
            const response = await this._concurrencyHandler.handleRequest(requestUrl, {
                headers: getCommonHeadersForDataverse(accessToken),
            });

            if (!response?.ok) {
                throw new Error(JSON.stringify(response));
            }
            this.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                websiteEntityName,
                Constants.httpMethod.GET,
                new Date().getTime() - requestSentAtTime,
                this.populateWebsiteIdToLanguageMap.name
            );
            const result = await response?.json();
            this._websiteIdToLanguage = getWebsiteIdToLcidMap(result, schema);
        } catch (error) {
            if ((error as Response)?.status > 0) {
                const errorMsg = (error as Error)?.message;
                this.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    websiteEntityName,
                    Constants.httpMethod.GET,
                    new Date().getTime() - requestSentAtTime,
                    this.populateWebsiteIdToLanguageMap.name,
                    errorMsg,
                    '',
                    (error as Response)?.status.toString()
                );
            } else {
                this.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_WEBSITE_ID_TO_LANGUAGE_SYSTEM_ERROR,
                    this.populateWebsiteIdToLanguageMap.name,
                    (error as Error)?.message,
                    error as Error
                );
            }
        }
    }

    private async setWebsiteLanguageCode() {
        const lcid = this.websiteIdToLanguage.get(this._websiteId) ?? "";
        this.telemetry.sendInfoTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_EDIT_LCID,
            { lcid: lcid ? lcid.toString() : "" }
        );

        this._websiteLanguageCode = this.languageIdCodeMap.get(
            lcid
        ) as string;
        this.telemetry.sendInfoTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_WEBSITE_LANGUAGE_CODE,
            { languageCode: this._websiteLanguageCode }
        );
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

    /**
    * Store a value maintained in Extension context workspaceState.
    *
    * *Note* that using `undefined` as value removes the key from the underlying
    * storage.
    *
    * @param key A string.
    * @param value A value.
    */
    public updateVscodeWorkspaceState(key: string, value?: IEntityInfo) {
        if (value === undefined) {
            this._vscodeWorkspaceState.delete(key);
            return;
        }
        this._vscodeWorkspaceState.set(key, value);
    }

    public getVscodeWorkspaceState(key: string): IEntityInfo | undefined {
        return this._vscodeWorkspaceState.get(key);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async getWorkerScript(workerUrl: URL): Promise<any> {
        try {
            this.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_FETCH_WORKER_SCRIPT
            );

            const response = await this.concurrencyHandler.handleRequest(
                workerUrl
            )

            if (!response.ok) {
                throw new Error(
                    `Failed to fetch worker script '${workerUrl.toString()}': ${response.statusText}`
                );
            }

            this.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_FETCH_WORKER_SCRIPT_SUCCESS,
                { workerUrl: workerUrl.toString() }
            );

            return await response.text();
        } catch (error) {
            this.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_FETCH_WORKER_SCRIPT_FAILED,
                this.getWorkerScript.name,
                Constants.WEB_EXTENSION_FETCH_WORKER_SCRIPT_FAILED,
                error as Error
            );
        }
    }

    public setWorker(worker: Worker) {
        this._worker = worker;
    }

    private async populateSharedWorkspace(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        headers: any,
        dataverseOrgUrl: string,
        websiteId: string
    ) {
        try {
            const sharedWorkspace = await getOrCreateSharedWorkspace({
                headers,
                dataverseOrgUrl,
                websiteId: websiteId,
            });

            const sharedWorkSpaceParamsMap = new Map<string, string>();
            for (const key in sharedWorkspace) {
                sharedWorkSpaceParamsMap.set(
                    String(key).trim().toLocaleLowerCase(),
                    String(sharedWorkspace[key]).trim()
                );
            }

            this._sharedWorkSpaceMap = sharedWorkSpaceParamsMap;

            this.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_SHARED_WORKSPACE_SUCCESS,
                { count: this._sharedWorkSpaceMap.size.toString() }
            );
        } catch (error) {
            this.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_SHARED_WORKSPACE_SYSTEM_ERROR,
                this.populateSharedWorkspace.name,
                Constants.WEB_EXTENSION_POPULATE_SHARED_WORKSPACE_SYSTEM_ERROR,
                error as Error
            );
        }
    }

    public async updateConnectedUsersInContext(
        containerId: string,
        userName: string,
        userId: string,
        connectionData: IConnectionData[],
    ) {
        this.connectedUsers.setUserData(
            containerId,
            userName,
            userId,
            connectionData
        );
    }

    public async removeConnectedUserInContext(userId: string, removeConnectionData: IConnectionData) {
        this.connectedUsers.removeUser(userId, removeConnectionData);
    }

    public setCurrentConnectionId(connectionId: string) {
        this._currentConnectionId = connectionId;
    }

    public async getMail(userId: string): Promise<string> {
        const mail = await this.graphClientService.getUserEmail(userId);
        return mail;
    }

    public openTeamsChat(userId: string) {
        this.getMail(userId).then((mail) => {
            if (mail === undefined) {
                vscode.window.showErrorMessage(Constants.WEB_EXTENSION_TEAMS_CHAT_NOT_AVAILABLE);
                return;
            } else {
                const teamsChatLink = getTeamChatURL(mail);
                vscode.env.openExternal(vscode.Uri.parse(teamsChatLink));
            }
        });
    }

    public async openMail(userId: string): Promise<void> {
        this.getMail(userId).then((mail) => {
            if (mail === undefined) {
                vscode.window.showErrorMessage(Constants.WEB_EXTENSION_SEND_EMAIL_NOT_AVAILABLE);
                return;
            } else {
                const mailToPath = getMailToPath(mail);
                vscode.env.openExternal(vscode.Uri.parse(mailToPath));
            }
        });
    }
}

export default new WebExtensionContext();
