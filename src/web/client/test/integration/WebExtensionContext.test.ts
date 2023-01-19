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
import * as authenticationProvider from "../../common/authenticationProvider";
import { telemetryEventNames } from "../../telemetry/constants";
import { IAttributePath } from "../../utilities/schemaHelperUtil";
import * as schemaHelperUtil from "../../utilities/schemaHelperUtil";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import { getHeader } from "../../common/authenticationProvider";

describe("WebExtensionContext", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("setWebExtensionContext_whenSetValue_shuldReturnSameValuesFromGetter", () => {
        //Act
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            ["_fetchQueryParameters", schemaEntityKey.FETCH_QUERY_PARAMETERS],
            [schemaEntityKey.DATAVERSE_ENTITY_NAME, "DATAVERSE_ENTITY_NAME"],
            [schemaKey.SCHEMA_VERSION, "1.1"],
            [schemaKey.DATA, "schemaKey.DATA"],
            [schemaKey.DATAVERSE_API_VERSION, "1.0"],
            [Constants.queryParameters.WEBSITE_NAME, "powerPages"],
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
        expect(WebExtensionContext.currentSchemaVersion).eq("1.1");
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
            [schemaKey.SCHEMA_VERSION, "1.1"],
            [Constants.queryParameters.ORG_URL, "PowerPages.com"],
        ]);

        stub(authenticationProvider, "dataverseAuthentication").resolves("");
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
            await WebExtensionContext.reAuthenticate();
        } catch {
            assert.calledOnce(noPermissions);
            expect(WebExtensionContext.dataverseAccessToken).eq("");
            assert.calledOnceWithExactly(
                sendErrorTelemetry,
                telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_MISSING
            );
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
            [schemaKey.SCHEMA_VERSION, "1.1"],
            [Constants.queryParameters.ORG_URL, "PowerPages.com"],
        ]);

        stub(authenticationProvider, "dataverseAuthentication").resolves(
            accessToken
        );

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action
        await WebExtensionContext.reAuthenticate();

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

        //Action
        await WebExtensionContext.updateFileDetailsInContext(
            fileUri,
            entityId,
            entityName,
            odataEtag,
            fileExtension,
            attributePath,
            encodeAsBase64,
            mimeType
        );

        //Assert
        const fileMap = WebExtensionContext.fileDataMap.getFileMap.get(
            fsPath.fsPath
        );

        const expectedResult = {
            _entityId: entityId,
            _entityName: entityName,
            _entityEtag: odataEtag,
            _entityFileExtensionType: fileExtension,
            _attributePath: attributePath,
            _encodeAsBase64: encodeAsBase64,
            _mimeType: mimeType,
            _hasDirtyChanges: false,
        };

        expect(fileMap).deep.eq(expectedResult);
    });

    it("updateFileDetailsInContext_whenPassAllParamsExcpetMimeType_shouldSetFileDataMap", async () => {
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

        //Action
        await WebExtensionContext.updateFileDetailsInContext(
            fileUri,
            entityId,
            entityName,
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
            _entityEtag: odataEtag,
            _entityFileExtensionType: fileExtension,
            _attributePath: attributePath,
            _encodeAsBase64: encodeAsBase64,
            _mimeType: undefined,
            _hasDirtyChanges: false,
        };

        expect(fileMap).deep.eq(expectedResult);
    });

    it("updateEntityDetailsInContext_whenPassAllParamsExcpet_shouldSetColumnContent", async () => {
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

    it("authenticateAndUpdateDataverseProperties_withNoAccessToken_shouldNotMapToWebsiteIdToLanguageAndLanguageIdCodeMap", () => {
        //Act

        stub(vscode.authentication, "getSession").resolves({
            accessToken: "",
        } as vscode.AuthenticationSession);

        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, "1.1"],
            [Constants.queryParameters.ORG_URL, "PowerPages.com"],
        ]);

        stub(authenticationProvider, "dataverseAuthentication").resolves("");

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action

        WebExtensionContext.authenticateAndUpdateDataverseProperties();
        //Assert

        expect(WebExtensionContext.websiteIdToLanguage).empty;

        // expect(
        //     WebExtensionContext.websiteLanguageIdToPortalLanguageMap
        // ).deep.eq(languageIdCodeMap);

        expect(WebExtensionContext.languageIdCodeMap).empty;
    });

    it("authenticateAndUpdateDataverseProperties_withAccessToken_shouldMapWebsiteIdToLanguageAndLanguageIdCodeMap", async () => {
        //Act
        const languageIdCodeMap = new Map<string, string>([["En", "English"]]);
        const requestUrl = "make.powerPortal.com";
        const accessToken =
            "4cdf3b4d873a65135553afdf420a47dbc898ba0c1c0ece2407bbbf2bde02a68b";

        const ORG_URL = "PowerPages.com";
        const SCHEMA_VERSION = "powerPage";
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, SCHEMA_VERSION],
            [Constants.queryParameters.ORG_URL, ORG_URL],
        ]);

        const dataverseAuthentication = stub(
            authenticationProvider,
            "dataverseAuthentication"
        ).resolves(accessToken);

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

        const getLanguageIdCodeMap = stub(
            schemaHelperUtil,
            "getLanguageIdCodeMap"
        ).returns(languageIdCodeMap);

        const getwebsiteLanguageIdToPortalLanguageMap = stub(
            schemaHelperUtil,
            "getwebsiteLanguageIdToPortalLanguageMap"
        ).returns(languageIdCodeMap);

        const getWebsiteIdToLanguageMap = stub(
            schemaHelperUtil,
            "getWebsiteIdToLanguageMap"
        ).returns(languageIdCodeMap);

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

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action

        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Assert
        expect(WebExtensionContext.websiteIdToLanguage).deep.eq(
            languageIdCodeMap
        );

        // expect(
        //     WebExtensionContext.websiteLanguageIdToPortalLanguageMap
        // ).deep.eq(languageIdCodeMap);

        expect(WebExtensionContext.languageIdCodeMap).deep.eq(
            languageIdCodeMap
        );

        expect(WebExtensionContext.dataverseAccessToken).eq(accessToken);
        assert.calledOnceWithExactly(dataverseAuthentication, ORG_URL);
        assert.callCount(sendAPISuccessTelemetry, 3);
        assert.calledOnceWithExactly(
            getLanguageIdCodeMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );
        assert.calledOnceWithExactly(
            getWebsiteIdToLanguageMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );
        assert.calledOnceWithExactly(
            getwebsiteLanguageIdToPortalLanguageMap,
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

        const thrirdGetCustomRequestURLCall = getCustomRequestURL.getCalls()[2];
        expect(thrirdGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(thrirdGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.PORTALLANGUAGE
        );
        //#endregion

        //#region  Fetch
        const header = getHeader(accessToken);
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
    });

    it("authenticateAndUpdateDataverseProperties_whenFetchCallFails_shouldNotMapToWebsiteIdToLanguageAndLanguageIdCodeMap", async () => {
        //Act
        const languageIdCodeMap = new Map<string, string>([["En", "English"]]);
        const requestUrl = "make.powerPortal.com";
        const accessToken =
            "4cdf3b4d873a65135553afdf420a47dbc898ba0c1c0ece2407bbbf2bde02a68b";

        const ORG_URL = "PowerPages.com";
        const SCHEMA_VERSION = "powerPage";
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, SCHEMA_VERSION],
            [Constants.queryParameters.ORG_URL, ORG_URL],
        ]);

        const dataverseAuthentication = stub(
            authenticationProvider,
            "dataverseAuthentication"
        ).resolves(accessToken);

        const getCustomRequestURL = stub(
            urlBuilderUtil,
            "getCustomRequestURL"
        ).returns(requestUrl);

        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const getLanguageIdCodeMap = stub(
            schemaHelperUtil,
            "getLanguageIdCodeMap"
        ).returns(languageIdCodeMap);

        const getwebsiteLanguageIdToPortalLanguageMap = stub(
            schemaHelperUtil,
            "getwebsiteLanguageIdToPortalLanguageMap"
        ).returns(languageIdCodeMap);

        const getWebsiteIdToLanguageMap = stub(
            schemaHelperUtil,
            "getWebsiteIdToLanguageMap"
        ).returns(languageIdCodeMap);

        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({ value: "value" });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action

        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Assert
        expect(WebExtensionContext.websiteIdToLanguage).deep.eq(
            languageIdCodeMap
        );

        // expect(
        //     WebExtensionContext.websiteLanguageIdToPortalLanguageMap
        // ).deep.eq(languageIdCodeMap);

        expect(WebExtensionContext.languageIdCodeMap).deep.eq(
            languageIdCodeMap
        );

        expect(WebExtensionContext.dataverseAccessToken).eq(accessToken);
        assert.calledOnceWithExactly(dataverseAuthentication, ORG_URL);
        assert.calledThrice(sendAPISuccessTelemetry);
        assert.calledOnceWithExactly(
            getLanguageIdCodeMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );
        assert.calledOnceWithExactly(
            getWebsiteIdToLanguageMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );
        assert.calledOnceWithExactly(
            getwebsiteLanguageIdToPortalLanguageMap,
            { value: "value" },
            SCHEMA_VERSION.toLowerCase()
        );

        assert.calledThrice(sendAPIFailureTelemetry);

        //#region sendAPITelemetry calls
        assert.calledThrice(sendAPITelemetry);
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

        const thrirdGetCustomRequestURLCall = getCustomRequestURL.getCalls()[2];
        expect(thrirdGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(thrirdGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.PORTALLANGUAGE
        );
        //#endregion

        //#region  Fetch
        const header = getHeader(accessToken);
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

    it("authenticateAndUpdateDataverseProperties_whenFetchCallThrowException_shouldNotMapToWebsiteIdToLanguageAndLanguageIdCodeMap", async () => {
        //Act
        const languageIdCodeMap = new Map<string, string>([["En", "English"]]);
        const requestUrl = "make.powerPortal.com";
        const accessToken =
            "4cdf3b4d873a65135553afdf420a47dbc898ba0c1c0ece2407bbbf2bde02a68b";

        const ORG_URL = "PowerPages.com";
        const SCHEMA_VERSION = "powerPage";
        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, SCHEMA_VERSION],
            [Constants.queryParameters.ORG_URL, ORG_URL],
        ]);

        const dataverseAuthentication = stub(
            authenticationProvider,
            "dataverseAuthentication"
        ).resolves(accessToken);

        const getCustomRequestURL = stub(
            urlBuilderUtil,
            "getCustomRequestURL"
        ).returns(requestUrl);

        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const _mockFetch = stub(fetch, "default").throws();
        const getLanguageIdCodeMap = stub(
            schemaHelperUtil,
            "getLanguageIdCodeMap"
        ).returns(languageIdCodeMap);

        const getwebsiteLanguageIdToPortalLanguageMap = stub(
            schemaHelperUtil,
            "getwebsiteLanguageIdToPortalLanguageMap"
        ).returns(languageIdCodeMap);

        const getWebsiteIdToLanguageMap = stub(
            schemaHelperUtil,
            "getWebsiteIdToLanguageMap"
        ).returns(languageIdCodeMap);
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        //Action

        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Assert

        expect(WebExtensionContext.websiteIdToLanguage).empty;

        // expect(
        //     WebExtensionContext.websiteLanguageIdToPortalLanguageMap
        // ).deep.eq(languageIdCodeMap);

        expect(WebExtensionContext.languageIdCodeMap).empty;

        expect(WebExtensionContext.dataverseAccessToken).eq(accessToken);

        assert.calledOnceWithExactly(dataverseAuthentication, ORG_URL);
        //#region  Fetch
        const header = getHeader(accessToken);
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
        assert.calledThrice(sendAPIFailureTelemetry);

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

        const thrirdGetCustomRequestURLCall = getCustomRequestURL.getCalls()[2];
        expect(thrirdGetCustomRequestURLCall.args[0]).eq(ORG_URL);
        expect(thrirdGetCustomRequestURLCall.args[1]).eq(
            Constants.initializationEntityName.PORTALLANGUAGE
        );
        //#endregion

        assert.neverCalledWith(getLanguageIdCodeMap);
        assert.neverCalledWith(getWebsiteIdToLanguageMap);
        assert.neverCalledWith(getwebsiteLanguageIdToPortalLanguageMap);
    });
});
