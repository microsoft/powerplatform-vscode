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

describe("WebExtensionContext", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("setWebExtensionContext_whenInitlizeValue_shuldReturnSameValuesFromGetter", () => {
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

        stub(vscode.authentication, "getSession").resolves({
            accessToken: "",
        } as vscode.AuthenticationSession);
        const accessToken = "de7a896e-3d05-4090-97b7-6d3d36ccae3f";
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

    it("updateSingleFileUrisInContext_whenUriPasses_shouldSetDefaultFileUri", () => {
        //Act
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;

        //Action
        WebExtensionContext.updateSingleFileUrisInContext(fileUri);

        //Assert
        expect(WebExtensionContext.defaultFileUri).eq(fileUri);
    });

    it("authenticateAndUpdateDataverseProperties_whenSessionDontHaveAccessToken_shouldThrowError", () => {
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
    });

    it("authenticateAndUpdateDataverseProperties_withAccessToken", async () => {
        //Act

        const languageIdCodeMap = new Map<string, string>([["En", "English"]]);
        const requestUrl = "make.powerPortal.com";
        const accessToken =
            "4cdf3b4d873a65135553afdf420a47dbc898ba0c1c0ece2407bbbf2bde02a68b";

        const entityName = "webPages";
        const entityId = "3355d5ec-b38d-46ca-a150-c00386b0a4be";
        const queryParamsMap = new Map<string, string>([
            [schemaKey.SCHEMA_VERSION, "powerPage"],
            [Constants.queryParameters.ORG_URL, "PowerPages.com"],
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
                return new Promise(() => {
                    return { value: "value" };
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

        WebExtensionContext.authenticateAndUpdateDataverseProperties().then(
            (a) => {
                expect(WebExtensionContext.websiteIdToLanguage).eq(
                    languageIdCodeMap
                );

                expect(
                    WebExtensionContext.websiteLanguageIdToPortalLanguageMap
                ).eq(languageIdCodeMap);

                expect(WebExtensionContext.languageIdCodeMap).eq(
                    languageIdCodeMap
                );

                expect(WebExtensionContext.dataverseAccessToken).eq(
                    accessToken
                );
                assert.calledOnceWithExactly(
                    dataverseAuthentication,
                    "PowerPages.com"
                );

                assert.calledOnce(getCustomRequestURL);
                assert.calledOnce(sendAPITelemetry);
                assert.calledTwice(sendAPISuccessTelemetry);
                assert.calledOnce(getLanguageIdCodeMap);
                assert.calledOnce(getWebsiteIdToLanguageMap);
                assert.calledOnce(getwebsiteLanguageIdToPortalLanguageMap);
                assert.callCount(_mockFetch, 6);
            }
        );

        //Assert
    });
});
