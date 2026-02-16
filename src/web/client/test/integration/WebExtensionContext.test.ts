/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fetch from "node-fetch";
import * as vscode from "vscode";
import sinon, { stub, assert } from "sinon";
import { expect } from "chai";
import WebExtensionContext from "../../WebExtensionContext";
import { schemaKey, schemaEntityKey } from "../../schema/constants";
import * as portalSchemaReader from "../../schema/portalSchemaReader";
import * as Constants from "../../common/constants";
import * as authenticationProvider from "../../../../common/services/AuthenticationProvider";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import * as schemaHelperUtil from "../../utilities/schemaHelperUtil";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import { getCommonHeadersForDataverse } from "../../../../common/services/AuthenticationProvider";
import { IAttributePath } from "../../common/interfaces";

describe("WebExtensionContext", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("setWebExtensionContext_whenSetValue_shouldReturnSameValuesFromGetter", () => {
        //Act
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            ["_fetchQueryParameters", schemaEntityKey.FETCH_QUERY_PARAMETERS],
            [schemaEntityKey.DATAVERSE_ENTITY_NAME, "DATAVERSE_ENTITY_NAME"],
            [schemaKey.DATA, "schemaKey.DATA"],
            [schemaKey.DATAVERSE_API_VERSION, "1.0"]
        ]);

        const entityMap = new Map<string, string>([["test", "Entity"]]);

        const entitiesSchemaMap = new Map<string, Map<string, string>>([
            [entityName, entityMap],
        ]);

        const dataSourcePropertiesMap = new Map<string, string>([
            [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
        ]);

        stub(portalSchemaReader, "getDataSourcePropertiesMap").returns(
            dataSourcePropertiesMap
        );

        const entitiesFolderNameMap = new Map<string, string>([
            [schemaKey.SINGLE_ENTITY_URL, schemaKey.SINGLE_ENTITY_URL],
        ]);
        stub(portalSchemaReader, "getEntitiesFolderNameMap").returns(
            entitiesFolderNameMap
        );

        stub(portalSchemaReader, "getEntitiesSchemaMap").returns(
            entitiesSchemaMap
        );
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        sinon.stub(vscode.Uri, "parse").returns(fileUri);

        //Action
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

        //Assert
        expect(WebExtensionContext.schema).eq("portalschemav1");
        expect(WebExtensionContext.defaultEntityType).eq(
            entityName.toLowerCase()
        );
        expect(WebExtensionContext.defaultEntityId).eq(entityId);
        expect(WebExtensionContext.urlParametersMap).eq(queryParamsMap);
        expect(WebExtensionContext.schemaEntitiesMap).eq(entitiesSchemaMap);
        expect(WebExtensionContext.schemaDataSourcePropertiesMap).eq(
            dataSourcePropertiesMap
        );
        expect(WebExtensionContext.entitiesFolderNameMap).eq(
            entitiesFolderNameMap
        );
        expect(WebExtensionContext.isContextSet).eq(true);
        expect(WebExtensionContext.rootDirectory).eq(fileUri);
    });

    it("reAuthenticate_whenDataverseAuthenticationDidNotReturnAccessToken_shouldSetDataverseAccessToken", async () => {
        //Act

        stub(vscode.authentication, "getSession").resolves({
            accessToken: "",
        } as vscode.AuthenticationSession);
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"]
        ]);

        stub(authenticationProvider, "dataverseAuthentication").resolves({ accessToken: "", userId: "" });
        const telemetry = WebExtensionContext.telemetry;
        const sendErrorTelemetry = stub(telemetry, "sendErrorTelemetry");

        const noPermissions = stub(vscode.FileSystemError, "NoPermissions");
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action
        try {
            await WebExtensionContext.dataverseAuthentication();
        } catch {
            assert.calledOnce(noPermissions);
            expect(WebExtensionContext.dataverseAccessToken).eq("");
            assert.calledOnceWithExactly(
                sendErrorTelemetry,
                webExtensionTelemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING,
                WebExtensionContext.dataverseAuthentication.name
            );
            expect(WebExtensionContext.websiteIdToLanguage).empty;
            expect(WebExtensionContext.languageIdCodeMap).empty;
            expect(WebExtensionContext.portalLanguageIdCodeMap).empty;
            expect(WebExtensionContext.websiteLanguageIdToPortalLanguageMap)
                .empty;
        }
    });

    it("reAuthenticate_whenDataverseAuthenticationReturnAccessToken_shouldSetDataverseAccessToken", async () => {
        //Act

        const accessToken = "de7a896e-3d05-4090-97b7-6d3d36ccae3f";
        stub(vscode.authentication, "getSession").resolves({
            accessToken: accessToken,
        } as vscode.AuthenticationSession);
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"]
        ]);

        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action
        await WebExtensionContext.dataverseAuthentication();

        //Assert
        expect(WebExtensionContext.dataverseAccessToken).eq(accessToken);
    });

    it("updateFileDetailsInContext_whenPassAllParams_shouldSetFileDataMap", async () => {
        //Act
        const attributePaths = {
            relativePath: "relativePath",
            source: "source",
        } as IAttributePath;
        const fsPath: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        sinon.stub(vscode.Uri, "parse").returns(fsPath);
        const fileUri = "d:\fakeFile";
        const entityId = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        const entityName = "webPage";
        const odataEtag = "testOData";
        const fileExtension = ".exe";
        const attributePath = attributePaths;
        const encodeAsBase64 = true;
        const mimeType = "pdf";
        const fileName = "testFileName";
        //Action
        await WebExtensionContext.updateFileDetailsInContext(
            fileUri,
            entityId,
            entityName,
            odataEtag,
            fileExtension,
            fileName,
            attributePath,
            encodeAsBase64,
            mimeType,
            true
        );

        //Assert
        const fileMap = WebExtensionContext.fileDataMap.getFileMap.get(
            fsPath.fsPath
        );

        const expectedResult = {
            _entityId: "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d",
            _entityName: "webPage",
            _fileName: "testOData",
            _entityEtag: ".exe",
            _entityFileExtensionType: "testFileName",
            _attributePath: { relativePath: "relativePath", source: "source" },
            _encodeAsBase64: true,
            _mimeType: "pdf",
            _hasDirtyChanges: false,
            _hasDiffViewTriggered: false,
            _isContentLoaded: true,
            _entityMetadata: undefined
        };
        expect(fileMap).deep.eq(expectedResult);
    });

    it("updateFileDetailsInContext_whenPassAllParamsExceptMimeType_shouldSetFileDataMap", async () => {
        //Act

        const attributePaths = {
            relativePath: "relativePath",
            source: "source",
        } as IAttributePath;
        const fsPath: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        sinon.stub(vscode.Uri, "parse").returns(fsPath);
        const fileUri = "d:\fakeFile";
        const entityId = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        const entityName = "webPage";
        const odataEtag = "testOData";
        const fileExtension = ".exe";
        const attributePath = attributePaths;
        const encodeAsBase64 = true;
        const fileName = "testFileName";

        //Action
        await WebExtensionContext.updateFileDetailsInContext(
            fileUri,
            entityId,
            entityName,
            fileName,
            odataEtag,
            fileExtension,
            attributePath,
            encodeAsBase64
        );

        //Assert
        const fileMap = WebExtensionContext.fileDataMap.getFileMap.get(
            fsPath.fsPath
        );

        const expectedResult = {
            _entityId: entityId,
            _entityName: entityName,
            _fileName: "testFileName",
            _entityEtag: odataEtag,
            _entityFileExtensionType: fileExtension,
            _attributePath: attributePath,
            _encodeAsBase64: encodeAsBase64,
            _hasDirtyChanges: false,
            _mimeType: undefined,
            _hasDiffViewTriggered: false,
            _isContentLoaded: undefined,
            _entityMetadata: undefined
        };

        expect(fileMap).deep.eq(expectedResult);
    });

    it("updateEntityDetailsInContext_whenPassAllParamsExcept_shouldSetColumnContent", async () => {
        //Act
        const attributePaths = {
            relativePath: "relativePath",
            source: "source",
        } as IAttributePath;
        const fsPath: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        sinon.stub(vscode.Uri, "parse").returns(fsPath);
        const entityId = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        const entityName = "webPage";
        const attributePath = attributePaths;
        const attributeContent = "attributeContent";
        const odataEtag = "testOData";

        //Action
        await WebExtensionContext.updateEntityDetailsInContext(
            entityId,
            entityName,
            odataEtag,
            attributePath,
            attributeContent
        );

        //Assert
        const columnContent =
            WebExtensionContext.entityDataMap.getColumnContent(
                entityId,
                attributePath.source
            );

        expect(attributeContent).eq(columnContent);
    });

    it("updateSingleFileUrisInContext_whenUriPassed_shouldSetDefaultFileUri", async () => {
        //Act
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;

        //Action
        await WebExtensionContext.updateSingleFileUrisInContext(fileUri);

        //Assert
        expect(WebExtensionContext.defaultFileUri).eq(fileUri);
    });

    it("authenticateAndUpdateDataverseProperties_withNoAccessToken_shouldNotMapToWebsiteIdToLanguageAndLanguageIdCodeMap", async () => {
        //Act
        stub(vscode.authentication, "getSession").resolves({
            accessToken: "",
        } as vscode.AuthenticationSession);

        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"]
        ]);

        stub(authenticationProvider, "dataverseAuthentication").resolves({ accessToken: "", userId: "" });
        const noPermissions = stub(vscode.FileSystemError, "NoPermissions");
        const telemetry = WebExtensionContext.telemetry;
        const sendErrorTelemetry = stub(telemetry, "sendErrorTelemetry");

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

        try {
            await WebExtensionContext.authenticateAndUpdateDataverseProperties();
        } catch {
            assert.calledOnce(noPermissions);
            expect(WebExtensionContext.dataverseAccessToken).eq("");
            assert.calledOnceWithExactly(
                sendErrorTelemetry,
                webExtensionTelemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING,
                WebExtensionContext.dataverseAuthentication.name
            );
            expect(WebExtensionContext.websiteIdToLanguage).length(0);
            expect(WebExtensionContext.languageIdCodeMap).length(0);
            expect(WebExtensionContext.portalLanguageIdCodeMap).length(0);
            expect(
                WebExtensionContext.websiteLanguageIdToPortalLanguageMap
            ).length(0);
        }
    });

    it("authenticateAndUpdateDataverseProperties_withAccessToken_languageMapsShouldStillBeUpdated", async () => {
        //Act
        const requestUrl = "make.powerPortal.com";
        const accessToken =
            "4cdf3b4d873a65135553afdf420a47dbc898ba0c1c0ece2407bbbf2bde02a68b";

        const ORG_URL = "PowerPages.com";
        const SCHEMA_VERSION = "portalschemav1";
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"]
        ]);

        const dataverseAuthentication = stub(
            authenticationProvider,
            "dataverseAuthentication"
        ).resolves({ accessToken: accessToken, userId: "" });

        const getCustomRequestURL = stub(
            urlBuilderUtil,
            "getCustomRequestURL"
        ).returns(requestUrl);

        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const languageIdCodeMap = new Map<string, string>([["1033", "en-US"]]);
        const getLcidCodeMap = stub(schemaHelperUtil, "getLcidCodeMap").returns(
            languageIdCodeMap
        );

        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "1033"],
        ]);
        const getWebsiteIdToLcidMap = stub(
            schemaHelperUtil,
            "getWebsiteIdToLcidMap"
        ).returns(websiteIdToLanguage);

        const websiteLanguageIdToPortalLanguageMap = new Map<string, string>([
            [
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
            ],
        ]);
        const getWebsiteLanguageIdToPortalLanguageIdMap = stub(
            schemaHelperUtil,
            "getWebsiteLanguageIdToPortalLanguageIdMap"
        ).returns(websiteLanguageIdToPortalLanguageMap);

        const sharedWorkSpaceParamsMap = new Map<string, string>([
            [
                "workspaceKey",
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e", // some guid value
            ],
        ]);
        const getOrCreateSharedWorkspace = stub(urlBuilderUtil, "getOrCreateSharedWorkspace")
            .resolves(sharedWorkSpaceParamsMap);

        const portalLanguageIdCodeMap = new Map<string, string>([
            ["d8b40829-17c8-4082-9e3f-89d60dc0ab7e", "1033"],
        ]);
        const getPortalLanguageIdToLcidMap = stub(
            schemaHelperUtil,
            "getPortalLanguageIdToLcidMap"
        ).returns(portalLanguageIdCodeMap);

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({ value: "value" });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        WebExtensionContext.orgUrl = ORG_URL;
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

        //Action
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Assert
        expect(WebExtensionContext.languageIdCodeMap).deep.eq(
            languageIdCodeMap
        );
        expect(WebExtensionContext.websiteIdToLanguage).deep.eq(
            websiteIdToLanguage
        );
        expect(
            WebExtensionContext.websiteLanguageIdToPortalLanguageMap
        ).deep.eq(websiteLanguageIdToPortalLanguageMap);
        expect(WebExtensionContext.portalLanguageIdCodeMap).deep.eq(
            portalLanguageIdCodeMap
        );

        expect(WebExtensionContext.dataverseAccessToken).eq(accessToken);
        assert.calledOnceWithExactly(dataverseAuthentication, ORG_URL, true);
        assert.callCount(sendAPISuccessTelemetry, 3);
        assert.calledOnceWithExactly(
            getLcidCodeMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );
        assert.calledOnceWithExactly(
            getWebsiteIdToLcidMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );
        assert.calledOnceWithExactly(
            getPortalLanguageIdToLcidMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );
        assert.calledOnceWithExactly(
            getWebsiteLanguageIdToPortalLanguageIdMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );

        //#region sendAPITelemetry calls
        assert.callCount(sendAPITelemetry, 3);
        const firstSendAPITelemetryCall = sendAPITelemetry.getCalls()[0];
        expect(firstSendAPITelemetryCall.args[0]).eq(requestUrl);
        expect(firstSendAPITelemetryCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITE
        );
        expect(firstSendAPITelemetryCall.args[2]).eq(Constants.httpMethod.GET);

        const secondSendAPITelemetryCall = sendAPITelemetry.getCalls()[1];
        expect(secondSendAPITelemetryCall.args[0]).eq(requestUrl);
        expect(secondSendAPITelemetryCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITELANGUAGE
        );
        expect(secondSendAPITelemetryCall.args[2]).eq(Constants.httpMethod.GET);

        const thirdSendAPITelemetryCall = sendAPITelemetry.getCalls()[2];
        expect(thirdSendAPITelemetryCall.args[0]).eq(requestUrl);
        expect(thirdSendAPITelemetryCall.args[1]).eq(
            Constants.initializationEntityName.PORTALLANGUAGE
        );
        expect(thirdSendAPITelemetryCall.args[2]).eq(Constants.httpMethod.GET);
        //#endregion

        //#region getCustomRequestURL calls
        assert.callCount(getCustomRequestURL, 3);
        const firstGetCustomRequestURLCall = getCustomRequestURL.getCalls()[0];
        expect(firstGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(firstGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITE
        );

        const secondGetCustomRequestURLCall = getCustomRequestURL.getCalls()[1];
        expect(secondGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(secondGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITELANGUAGE
        );

        const thirdGetCustomRequestURLCall = getCustomRequestURL.getCalls()[2];
        expect(thirdGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(thirdGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.PORTALLANGUAGE
        );
        //#endregion

        //#region  Fetch
        const header = getCommonHeadersForDataverse(accessToken);
        assert.callCount(_mockFetch, 3);
        const firstFetchCall = _mockFetch.getCalls()[0];
        expect(firstFetchCall.args[0], requestUrl);
        expect(firstFetchCall.args[1]?.headers).deep.eq(header);

        const secondFetchCall = _mockFetch.getCalls()[1];
        expect(secondFetchCall.args[0], requestUrl);
        expect(secondFetchCall.args[1]?.headers).deep.eq(header);

        const thirdFetchCall = _mockFetch.getCalls()[2];
        expect(thirdFetchCall.args[0], requestUrl);
        expect(thirdFetchCall.args[1]?.headers).deep.eq(header);

        //#endregion

        assert.calledOnceWithExactly(
            getOrCreateSharedWorkspace,
            {
                headers: header,
                dataverseOrgUrl: ORG_URL,
                websiteId: '36429b2e-8b29-4020-8493-bd5e277444d8'
            }
        );
    });

    it("authenticateAndUpdateDataverseProperties_whenFetchCallFails_languageMapsShouldStillBeUpdated", async () => {
        //Act
        const requestUrl = "make.powerPortal.com";
        const accessToken =
            "4cdf3b4d873a65135553afdf420a47dbc898ba0c1c0ece2407bbbf2bde02a68b";

        const ORG_URL = "PowerPages.com";
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"]
        ]);

        const dataverseAuthentication = stub(
            authenticationProvider,
            "dataverseAuthentication"
        ).resolves({ accessToken: accessToken, userId: "" });

        const getCustomRequestURL = stub(
            urlBuilderUtil,
            "getCustomRequestURL"
        ).returns(requestUrl);

        const languageIdCodeMap = new Map<string, string>([["1033", "en-US"]]);
        const getLcidCodeMap = stub(schemaHelperUtil, "getLcidCodeMap").returns(
            languageIdCodeMap
        );

        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "1033"],
        ]);
        const getWebsiteIdToLcidMap = stub(
            schemaHelperUtil,
            "getWebsiteIdToLcidMap"
        ).returns(websiteIdToLanguage);

        const websiteLanguageIdToPortalLanguageMap = new Map<string, string>([
            [
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
            ],
        ]);
        const getWebsiteLanguageIdToPortalLanguageIdMap = stub(
            schemaHelperUtil,
            "getWebsiteLanguageIdToPortalLanguageIdMap"
        ).returns(websiteLanguageIdToPortalLanguageMap);

        const portalLanguageIdCodeMap = new Map<string, string>([
            ["d8b40829-17c8-4082-9e3f-89d60dc0ab7e", "1033"],
        ]);
        const getPortalLanguageIdToLcidMap = stub(
            schemaHelperUtil,
            "getPortalLanguageIdToLcidMap"
        ).returns(portalLanguageIdCodeMap);

        const mockResponseBody = JSON.stringify({ value: "value" });
        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            url: "https://test.crm.dynamics.com",
            clone: function() { return this; },
            text: () => Promise.resolve(mockResponseBody),
            json: () => {
                return new Promise((resolve) => {
                    return resolve({ value: "value" });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        WebExtensionContext.orgUrl = ORG_URL;
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action

        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Assert
        expect(WebExtensionContext.languageIdCodeMap).deep.eq(
            languageIdCodeMap
        );

        expect(WebExtensionContext.dataverseAccessToken).eq(accessToken);
        assert.calledOnceWithExactly(dataverseAuthentication, ORG_URL, true);
        assert.notCalled(getLcidCodeMap);
        assert.notCalled(getWebsiteIdToLcidMap);
        assert.notCalled(getPortalLanguageIdToLcidMap);
        assert.notCalled(getWebsiteLanguageIdToPortalLanguageIdMap);

        //#region getCustomRequestURL calls
        assert.calledThrice(getCustomRequestURL);
        const firstGetCustomRequestURLCall = getCustomRequestURL.getCalls()[0];
        expect(firstGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(firstGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITE
        );

        const secondGetCustomRequestURLCall = getCustomRequestURL.getCalls()[1];
        expect(secondGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(secondGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITELANGUAGE
        );

        const thirdGetCustomRequestURLCall = getCustomRequestURL.getCalls()[2];
        expect(thirdGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(thirdGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.PORTALLANGUAGE
        );
        //#endregion

        //#region  Fetch
        const header = getCommonHeadersForDataverse(accessToken);
        assert.calledThrice(_mockFetch);
        const firstFetchCall = _mockFetch.getCalls()[0];
        expect(firstFetchCall.args[0], requestUrl);
        expect(firstFetchCall.args[1]?.headers).deep.eq(header);

        const secondFetchCall = _mockFetch.getCalls()[1];
        expect(secondFetchCall.args[0], requestUrl);
        expect(secondFetchCall.args[1]?.headers).deep.eq(header);

        const thirdFetchCall = _mockFetch.getCalls()[2];
        expect(thirdFetchCall.args[0], requestUrl);
        expect(thirdFetchCall.args[1]?.headers).deep.eq(header);

        //#endregion
    });

    it("authenticateAndUpdateDataverseProperties_whenFetchCallThrowException_sendFailureTelemetry", async () => {
        //Act
        const requestUrl = "make.powerPortal.com";
        const accessToken =
            "4cdf3b4d873a65135553afdf420a47dbc898ba0c1c0ece2407bbbf2bde02a68b";

        const ORG_URL = "PowerPages.com";
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"]
        ]);

        const dataverseAuthentication = stub(
            authenticationProvider,
            "dataverseAuthentication"
        ).resolves({ accessToken: accessToken, userId: "" });

        const getCustomRequestURL = stub(
            urlBuilderUtil,
            "getCustomRequestURL"
        ).returns(requestUrl);

        // Stub concurrencyHandler.handleRequest instead of fetch to avoid retry delays
        const _mockHandleRequest = stub(WebExtensionContext.concurrencyHandler, "handleRequest").rejects(new Error("Test error"));
        const languageIdCodeMap = new Map<string, string>([["1033", "en-US"]]);
        stub(schemaHelperUtil, "getLcidCodeMap").returns(languageIdCodeMap);

        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "1033"],
        ]);
        stub(schemaHelperUtil, "getWebsiteIdToLcidMap").returns(
            websiteIdToLanguage
        );

        const websiteLanguageIdToPortalLanguageMap = new Map<string, string>([
            [
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
            ],
        ]);
        stub(
            schemaHelperUtil,
            "getWebsiteLanguageIdToPortalLanguageIdMap"
        ).returns(websiteLanguageIdToPortalLanguageMap);

        const portalLanguageIdCodeMap = new Map<string, string>([
            ["d8b40829-17c8-4082-9e3f-89d60dc0ab7e", "1033"],
        ]);
        stub(schemaHelperUtil, "getPortalLanguageIdToLcidMap").returns(
            portalLanguageIdCodeMap
        );
        WebExtensionContext.orgUrl = ORG_URL;
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

        //Action
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Assert
        expect(WebExtensionContext.websiteIdToLanguage).length(1);
        expect(WebExtensionContext.languageIdCodeMap).length(1);
        expect(WebExtensionContext.portalLanguageIdCodeMap).length(1);
        expect(WebExtensionContext.websiteLanguageIdToPortalLanguageMap).length(
            1
        );
        expect(WebExtensionContext.dataverseAccessToken).eq(accessToken);

        assert.calledOnceWithExactly(dataverseAuthentication, ORG_URL, true);
        //#region  handleRequest calls (via concurrencyHandler)
        const header = getCommonHeadersForDataverse(accessToken);
        assert.calledThrice(_mockHandleRequest);
        const firstHandleRequestCall = _mockHandleRequest.getCalls()[0];
        expect(firstHandleRequestCall.args[0], requestUrl);
        expect(firstHandleRequestCall.args[1]?.headers).deep.eq(header);

        const secondHandleRequestCall = _mockHandleRequest.getCalls()[1];
        expect(secondHandleRequestCall.args[0], requestUrl);
        expect(secondHandleRequestCall.args[1]?.headers).deep.eq(header);

        const thirdHandleRequestCall = _mockHandleRequest.getCalls()[2];
        expect(thirdHandleRequestCall.args[0], requestUrl);
        expect(thirdHandleRequestCall.args[1]?.headers).deep.eq(header);

        //#endregion

        //#region getCustomRequestURL calls
        assert.calledThrice(getCustomRequestURL);
        const firstGetCustomRequestURLCall = getCustomRequestURL.getCalls()[0];
        expect(firstGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(firstGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITE
        );

        const secondGetCustomRequestURLCall = getCustomRequestURL.getCalls()[1];
        expect(secondGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(secondGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.WEBSITELANGUAGE
        );

        const thirdGetCustomRequestURLCall = getCustomRequestURL.getCalls()[2];
        expect(thirdGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(thirdGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.PORTALLANGUAGE
        );
        //#endregion
    });
});
