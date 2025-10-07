/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fetch from "node-fetch";
import sinon, { stub, assert } from "sinon";
import { fetchDataFromDataverseAndUpdateVFS } from "../../dal/remoteFetchProvider";
import { PortalsFS } from "../../dal/fileSystemProvider";
import WebExtensionContext from "../../WebExtensionContext";
import * as Constants from "../../common/constants";
import * as schemaHelperUtil from "../../utilities/schemaHelperUtil";
import { schemaEntityKey } from "../../schema/constants";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import * as commonUtil from "../../utilities/commonUtil";
import { expect } from "chai";
import * as authenticationProvider from "../../../../common/services/AuthenticationProvider";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { queryParameters } from "../../common/constants";

describe("remoteFetchProvider", () => {
    afterEach(() => {
        sinon.restore();
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccess_forDefaultFileInfo_shouldCallAllSuccessFunction", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

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
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                name: "testname",
                                powerpagecomponentid: entityId,
                                _powerpagesitelanguageid_value: "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
                                value: '{ "ddrive": "VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg==", "value": "value" }',
                            }]
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const updateFileDetailsInContext = stub(
            WebExtensionContext,
            "updateFileDetailsInContext"
        );
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );
        const sendInfoTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendInfoTelemetry"
        );

        const requestURL = "make.powerpgaes.com";
        const getRequestURL = stub(urlBuilderUtil, "getRequestURL").returns(requestURL);

        stub(commonUtil, "isWebfileContentLoadNeeded").returns(true);
        stub(urlBuilderUtil, "getCustomRequestURL").returns(requestURL);
        stub(schemaHelperUtil, "isBase64Encoded").returns(true);
        stub(commonUtil, "GetFileNameWithExtension").returns("test.txt");
        stub(schemaHelperUtil, "getAttributePath").returns({
            source: "value",
            relativePath: "ddrive",
        });
        const updateSingleFileUrisInContext = stub(
            WebExtensionContext,
            "updateSingleFileUrisInContext"
        );
        const fileUri: vscode.Uri = {
            path: "powerplatform-vfs:/testWebSite/web-pages/testname/",
        } as vscode.Uri;
        const parse = stub(vscode.Uri, "parse").returns(fileUri);

        const portalFs = new PortalsFS();
        const createDirectory = stub(portalFs, "createDirectory");
        const writeFile = stub(portalFs, "writeFile");
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs, { entityId: entityId, entityName: entityName });

        //Assert
        assert.callCount(_mockFetch, 4);

        assert.calledWith(
            sendAPITelemetry,
            requestURL,
            entityName,
            Constants.httpMethod.GET
        );

        assert.calledOnce(getRequestURL);
        assert.callCount(parse, 6);
        assert.callCount(createDirectory, 1);
        const createDirectoryCalls = createDirectory.getCalls();
        expect(createDirectoryCalls[0].args[0]).deep.eq({
            path: "powerplatform-vfs:/testWebSite/web-pages/testname/",
        });

        const updateFileDetailsInContextCalls =
            updateFileDetailsInContext.getCalls();

        assert.callCount(updateFileDetailsInContext, 3);
        expect(
            updateFileDetailsInContextCalls[0].args[0],
            "powerplatform-vfs:/testWebSite/web-pages/testname/test.txt"
        );
        expect(updateFileDetailsInContextCalls[0].args[1], entityId);
        expect(updateFileDetailsInContextCalls[0].args[2], "webpages");
        expect(updateFileDetailsInContextCalls[0].args[3], "test.txt");
        expect(updateFileDetailsInContextCalls[0].args[4], undefined);
        expect(updateFileDetailsInContextCalls[0].args[5], "customcss.css");
        expect(
            updateFileDetailsInContextCalls[0].args[6],
            "{ source: 'value', relativePath: 'ddrive' }"
        );
        expect(updateFileDetailsInContextCalls[0].args[7], "false");

        expect(
            updateFileDetailsInContextCalls[1].args[0],
            "powerplatform-vfs:/testWebSite/web-pages/test Name/test.txt"
        );
        expect(updateFileDetailsInContextCalls[1].args[1], entityId);
        expect(updateFileDetailsInContextCalls[1].args[2], "webpages");
        expect(updateFileDetailsInContextCalls[1].args[3], "test.txt");
        expect(updateFileDetailsInContextCalls[1].args[4], undefined);
        expect(updateFileDetailsInContextCalls[1].args[5], "customcss.css");
        expect(
            updateFileDetailsInContextCalls[1].args[6],
            "{ source: 'value', relativePath: 'ddrive' }"
        );
        expect(updateFileDetailsInContextCalls[1].args[7], "false");

        expect(
            updateFileDetailsInContextCalls[2].args[0],
            "powerplatform-vfs:/testWebSite/web-pages/test Name/test.txt"
        );
        expect(updateFileDetailsInContextCalls[2].args[1], entityId);
        expect(updateFileDetailsInContextCalls[2].args[2], "webpages");
        expect(updateFileDetailsInContextCalls[2].args[3], "test.txt");
        expect(updateFileDetailsInContextCalls[2].args[4], undefined);
        expect(updateFileDetailsInContextCalls[2].args[5], "customcss.css");
        expect(
            updateFileDetailsInContextCalls[2].args[6],
            "{ source: 'value', relativePath: 'ddrive' }"
        );
        expect(updateFileDetailsInContextCalls[1].args[7], "false");

        assert.callCount(writeFile, 3);
        assert.calledOnce(updateSingleFileUrisInContext);
        assert.callCount(sendInfoTelemetry, 5);
        assert.callCount(sendAPISuccessTelemetry, 4);
    });



    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccess_forNonDefaultFile_shouldCallAllSuccessFunction", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

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
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                name: "testname",
                                powerpagecomponentid: entityId,
                                _powerpagesitelanguageid_value: "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
                                value: '{ "ddrive": "VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg==", "value": "value" }',
                            }]
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const updateFileDetailsInContext = stub(
            WebExtensionContext,
            "updateFileDetailsInContext"
        );
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );
        const sendInfoTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendInfoTelemetry"
        );

        const requestURL = "make.powerpgaes.com";
        const getRequestURL = stub(urlBuilderUtil, "getRequestURL").returns(
            requestURL
        );

        stub(urlBuilderUtil, "getCustomRequestURL").returns(requestURL);

        stub(schemaHelperUtil, "isBase64Encoded").returns(true);
        stub(commonUtil, "GetFileNameWithExtension").returns("test.txt");
        stub(schemaHelperUtil, "getAttributePath").returns({
            source: "value",
            relativePath: "ddrive",
        });
        const fileUri: vscode.Uri = {
            path: "powerplatform-vfs:/testWebSite/web-pages/testname/",
        } as vscode.Uri;
        const parse = stub(vscode.Uri, "parse").returns(fileUri);
        const executeCommand = stub(vscode.commands, "executeCommand");

        const portalFs = new PortalsFS();
        const createDirectory = stub(portalFs, "createDirectory");
        const writeFile = stub(portalFs, "writeFile");
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.callCount(_mockFetch, 4);

        assert.calledWith(
            sendAPITelemetry,
            requestURL,
            entityName,
            Constants.httpMethod.GET
        );

        assert.calledOnce(getRequestURL);
        assert.callCount(parse, 5);
        assert.callCount(createDirectory, 1);
        const createDirectoryCalls = createDirectory.getCalls();
        expect(createDirectoryCalls[0].args[0]).deep.eq({
            path: "powerplatform-vfs:/testWebSite/web-pages/testname/",
        });

        const updateFileDetailsInContextCalls =
            updateFileDetailsInContext.getCalls();

        assert.callCount(updateFileDetailsInContext, 3);
        expect(
            updateFileDetailsInContextCalls[0].args[0],
            "powerplatform-vfs:/testWebSite/web-pages/testname/test.txt"
        );
        expect(updateFileDetailsInContextCalls[0].args[1], entityId);
        expect(updateFileDetailsInContextCalls[0].args[2], "webpages");
        expect(updateFileDetailsInContextCalls[0].args[3], "test.txt");
        expect(updateFileDetailsInContextCalls[0].args[4], undefined);
        expect(updateFileDetailsInContextCalls[0].args[5], "customcss.css");
        expect(
            updateFileDetailsInContextCalls[0].args[6],
            "{ source: 'value', relativePath: 'ddrive' }"
        );
        expect(updateFileDetailsInContextCalls[0].args[7], "false");

        expect(
            updateFileDetailsInContextCalls[1].args[0],
            "powerplatform-vfs:/testWebSite/web-pages/test Name/test.txt"
        );
        expect(updateFileDetailsInContextCalls[1].args[1], entityId);
        expect(updateFileDetailsInContextCalls[1].args[2], "webpages");
        expect(updateFileDetailsInContextCalls[1].args[3], "test.txt");
        expect(updateFileDetailsInContextCalls[1].args[4], undefined);
        expect(updateFileDetailsInContextCalls[1].args[5], "customcss.css");
        expect(
            updateFileDetailsInContextCalls[1].args[6],
            "{ source: 'value', relativePath: 'ddrive' }"
        );
        expect(updateFileDetailsInContextCalls[1].args[7], "false");

        expect(
            updateFileDetailsInContextCalls[2].args[0],
            "powerplatform-vfs:/testWebSite/web-pages/test Name/test.txt"
        );
        expect(updateFileDetailsInContextCalls[2].args[1], entityId);
        expect(updateFileDetailsInContextCalls[2].args[2], "webpages");
        expect(updateFileDetailsInContextCalls[2].args[3], "test.txt");
        expect(updateFileDetailsInContextCalls[2].args[4], undefined);
        expect(updateFileDetailsInContextCalls[2].args[5], "customcss.css");
        expect(
            updateFileDetailsInContextCalls[2].args[6],
            "{ source: 'value', relativePath: 'ddrive' }"
        );
        expect(updateFileDetailsInContextCalls[1].args[7], "false");

        assert.callCount(writeFile, 3);
        assert.callCount(sendInfoTelemetry, 7);
        assert.calledOnce(executeCommand);
        assert.callCount(sendAPISuccessTelemetry, 4);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessButDataIsNull_shouldSendErrorTelemetry", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        "@odata.count": 1,
                        "@Microsoft.Dynamics.CRM.totalrecordcount": 1,
                        "value": null
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.calledOnceWithMatch(sendErrorTelemetry,
            webExtensionTelemetryEventNames.WEB_EXTENSION_CONTENT_FILE_CREATION_FAILED,
            "createContentFiles");
        assert.calledOnce(_mockFetch);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseNotSuccess_shouldCallSendErrorTelemetry", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        "@odata.count": 0,
                        "@Microsoft.Dynamics.CRM.totalrecordcount": 0,
                        "value": [],
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        const sendErrorTelemetryCalls = sendErrorTelemetry.getCalls();

        assert.callCount(sendErrorTelemetry, 5);
        assert.calledWithMatch(sendErrorTelemetryCalls[0], webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_WEBSITE_ID_TO_LANGUAGE_SYSTEM_ERROR,
            "populateWebsiteIdToLanguageMap",
            "Only absolute URLs are supported");
        assert.calledWithMatch(sendErrorTelemetryCalls[1], webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_WEBSITE_LANGUAGE_ID_TO_PORTALLANGUAGE_SYSTEM_ERROR,
            "populateWebsiteLanguageIdToPortalLanguageMap",
            "Only absolute URLs are supported");
        assert.calledWithMatch(sendErrorTelemetryCalls[2], webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_LANGUAGE_ID_TO_CODE_SYSTEM_ERROR,
            "populateLanguageIdToCode",
            "Only absolute URLs are supported");
        assert.calledWithMatch(sendErrorTelemetryCalls[3], webExtensionTelemetryEventNames.WEB_EXTENSION_POPULATE_SHARED_WORKSPACE_SYSTEM_ERROR,
            "populateSharedWorkspace",
            "Web extension populate shared workspace system error");
        assert.calledWithMatch(sendErrorTelemetryCalls[4],
            webExtensionTelemetryEventNames.WEB_EXTENSION_FETCH_DATAVERSE_AND_CREATE_FILES_SYSTEM_ERROR,
            "fetchFromDataverseAndCreateFiles",
            `{"ok":false,"statusText":"statusText"}`);
        assert.calledOnce(_mockFetch);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndSubUriIsBlank_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

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
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                name: "testname",
                                _powerpagesitelanguageid_value:
                                    "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
                                powerpagecomponentid: entityId,
                            },
                        ],
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const getEntity = stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.EXPORT_TYPE, ""],
                [schemaEntityKey.FILE_FOLDER_NAME, ""],
            ])
        );
        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledOnce(sendErrorTelemetry);
        assert.callCount(getEntity, 2);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndAttributesIsBlank_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                name: "testname",
                                _powerpagesitelanguageid_value:
                                    "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
                                powerpagecomponentid: entityId,
                            },
                        ],
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const getEntity = stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.EXPORT_TYPE, ""],
                [schemaEntityKey.FILE_FOLDER_NAME, "repairCenter"],
                [schemaEntityKey.ATTRIBUTES, ""],
            ])
        );
        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledOnce(sendErrorTelemetry);
        assert.callCount(getEntity, 2);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndAttributeExtensionIsBlank_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                name: "testname",
                                _powerpagesitelanguageid_value:
                                    "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
                                powerpagecomponentid: entityId,
                            },
                        ],
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const getEntity = stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.EXPORT_TYPE, "pdf"],
                [schemaEntityKey.FILE_FOLDER_NAME, "repairCenter"],
                [schemaEntityKey.ATTRIBUTES, "attributr"],
                [schemaEntityKey.ATTRIBUTES_EXTENSION, ""],
            ])
        );
        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledOnce(sendErrorTelemetry);
        assert.callCount(getEntity, 2);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndFileNameIsDefaultFilename_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                name: "testname",
                                _powerpagesitelanguageid_value:
                                    "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
                                powerpagecomponentid: entityId,
                            },
                        ],
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const getEntity = stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.EXPORT_TYPE, "pdf"],
                [schemaEntityKey.FILE_FOLDER_NAME, "repairCenter"],
                [schemaEntityKey.ATTRIBUTES, "attributr"],
                [schemaEntityKey.ATTRIBUTES_EXTENSION, "pdf"],
                [schemaEntityKey.FILE_NAME_FIELD, ""],
            ])
        );
        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledOnce(sendErrorTelemetry);
        assert.callCount(getEntity, 2);
    });

    it("fetchDataFromDataverseAndUpdateVFS_forWebFile_whenResponseSuccess_forDefaultFileInfo_shouldCallAllSuccessFunction", async () => {
        //Act
        const entityName = "webfiles";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"]
        ]);

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
                "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
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

        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        stub(authenticationProvider, "dataverseAuthentication").resolves(
            { accessToken: accessToken, userId: "" }
        );

        const _mockFetch = stub(fetch, 'default').callsFake((url) => {
            // Customize the response based on input parameters (url, options, etc.)
            if (url === 'powerPages.com/api/data/v9.2/powerpagecomponents(aa563be7-9a38-4a89-9216-47f9fc6a3f14)/filecontent') {
                return Promise.resolve({
                    ok: true,
                    statusText: "statusText",
                    json: () => {
                        return new Promise((resolve) => {
                            return resolve({
                                value: "iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHCAMAAAACh/xsAAAAGFBMVEXaQivfWkb43Nf////rlYj99PL20MrtoZUWcxnPAAAAIElEQVR4nGNgwA8YmZiZQTQLKzOIwcjGDAIM7KxgmhkABHsAUGHBzX8AAAAddEVYdFNvZnR3YXJlAEBsdW5hcGFpbnQvcG5nLWNvZGVj9UMZHgAAAABJRU5ErkJggg=="
                            });
                        });
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);
            } else {
                // You can handle other cases or provide a default response
                return Promise.resolve({
                    ok: true,
                    statusText: "statusText",
                    json: () => {
                        return new Promise((resolve) => {
                            return resolve({
                                value: [
                                    {
                                        name: "testname",
                                        powerpagecomponentid: entityId,
                                        _powerpagesitelanguageid_value: "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",
                                        value: '{ "ddrive": "VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg==", "value": "value" }',
                                    }]
                            });
                        });
                    },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);
            }
        });

        const updateFileDetailsInContext = stub(WebExtensionContext, "updateFileDetailsInContext");
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        const sendAPITelemetry = stub(WebExtensionContext.telemetry, "sendAPITelemetry");
        const sendAPISuccessTelemetry = stub(WebExtensionContext.telemetry, "sendAPISuccessTelemetry");
        const sendInfoTelemetry = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");
        const convertContentToUint8Array = stub(commonUtil, "convertContentToUint8Array");

        stub(commonUtil, "isWebfileContentLoadNeeded").returns(true);
        stub(schemaHelperUtil, "isBase64Encoded").returns(true);
        stub(commonUtil, "GetFileNameWithExtension").returns("circle-1.png");
        stub(schemaHelperUtil, "getAttributePath").returns({ source: "value", relativePath: "", });
        const updateSingleFileUrisInContext = stub(WebExtensionContext, "updateSingleFileUrisInContext");
        const fileUri: vscode.Uri = { path: "powerplatform-vfs:/testWebSite/web-files/", } as vscode.Uri;
        const parse = stub(vscode.Uri, "parse").returns(fileUri);

        const portalFs = new PortalsFS();
        const writeFile = stub(portalFs, "writeFile");
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs, { entityId: entityId, entityName: entityName });

        //Assert
        assert.callCount(_mockFetch, 5);
        assert.callCount(sendAPITelemetry, 5);
        assert.callCount(parse, 3);

        assert.callCount(updateFileDetailsInContext, 1);
        assert.calledOnceWithExactly(updateFileDetailsInContext,
            "powerplatform-vfs:/testWebSite/web-files/circle-1.png",
            entityId,
            "webfiles",
            "circle-1.png",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            undefined as any as string,
            "css",
            { source: 'value', relativePath: '' },
            false,
            undefined,
            true,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {}
        );

        assert.calledWith(convertContentToUint8Array,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAHCAMAAAACh/xsAAAAGFBMVEXaQivfWkb43Nf////rlYj99PL20MrtoZUWcxnPAAAAIElEQVR4nGNgwA8YmZiZQTQLKzOIwcjGDAIM7KxgmhkABHsAUGHBzX8AAAAddEVYdFNvZnR3YXJlAEBsdW5hcGFpbnQvcG5nLWNvZGVj9UMZHgAAAABJRU5ErkJggg==',
            true
        );

        assert.callCount(writeFile, 1);
        assert.calledOnce(updateSingleFileUrisInContext);
        assert.callCount(sendInfoTelemetry, 5);
        assert.callCount(sendAPISuccessTelemetry, 5);
    });
});
