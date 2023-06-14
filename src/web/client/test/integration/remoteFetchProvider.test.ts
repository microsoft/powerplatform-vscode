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
import { schemaEntityKey, schemaKey } from "../../schema/constants";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import * as commonUtil from "../../utilities/commonUtil";
import { expect } from "chai";
import * as errorHandler from "../../common/errorHandler";
import * as authenticationProvider from "../../common/authenticationProvider";

describe("remoteFetchProvider", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccess_shouldCallAllSuccessFunction", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
            [schemaKey.SCHEMA_VERSION, "portalschemav2"],
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
            accessToken
        );

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                name: "testname" ,
                                powerpagecomponentid: entityId ,
                                _powerpagesitelanguageid_value: "d8b40829-17c8-4082-9e3f-89d60dc0ab7e",                                 
                                value: '{ "ddrive": "VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg==", "value": "value" }',
                        } ]
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
        const updateSingleFileUrisInContext = stub(
            WebExtensionContext,
            "updateSingleFileUrisInContext"
        );
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
        assert.callCount(parse, 7);
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
        assert.callCount(sendInfoTelemetry, 3);
        assert.calledOnce(executeCommand);
        assert.callCount(sendAPISuccessTelemetry, 4);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessButDataIsNull_shouldCallShowErrorMessage", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
            [schemaKey.SCHEMA_VERSION, "portalschemav2"],
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
            accessToken
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: null,
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert

        assert.calledOnce(showErrorDialog);

        expect(showErrorDialog.getCalls()[0].args[0]).eq(
            "There was a problem opening the workspace"
        );
        expect(showErrorDialog.getCalls()[0].args[1]).eq(
            "We encountered an error preparing the file for edit."
        );
        assert.calledOnce(sendAPIFailureTelemetry);

        assert.calledOnce(_mockFetch);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseNotSuccess_shouldCallShowErrorMessage", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
            [schemaKey.SCHEMA_VERSION, "portalschemav2"],
        ]);

        const showErrorMessage = stub(vscode.window, "showErrorMessage");
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
            accessToken
        );

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: null,
                    });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.calledOnce(showErrorDialog);
        expect(showErrorDialog.getCalls()[0].args[0]).eq(
            "There was a problem opening the workspace"
        );
        expect(showErrorDialog.getCalls()[0].args[1]).eq(
            "We encountered an error preparing the file for edit."
        );
        assert.calledTwice(sendAPIFailureTelemetry);

        assert.calledOnce(_mockFetch);

        assert.calledOnce(showErrorMessage);
        const showErrorMessageCalls = showErrorMessage.getCalls();
        expect(showErrorMessageCalls[0].args[0]).eq(
            "Failed to fetch file content."
        );
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndSubUriIsBlank_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
            [schemaKey.SCHEMA_VERSION, "portalschemav2"],
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
            accessToken
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
        const showErrorMessage = stub(vscode.window, "showErrorMessage");
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
        assert.calledOnce(showErrorMessage);
        assert.callCount(getEntity, 4);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndAttributesIsBlank_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
            [schemaKey.SCHEMA_VERSION, "portalschemav2"],
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
            accessToken
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
        const showErrorMessage = stub(vscode.window, "showErrorMessage");
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
        assert.calledOnce(showErrorMessage);
        assert.callCount(getEntity, 4);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndAttributeExtensionIsBlank_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
            [schemaKey.SCHEMA_VERSION, "portalschemav2"],
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
            accessToken
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
        const showErrorMessage = stub(vscode.window, "showErrorMessage");
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
        assert.calledOnce(showErrorMessage);
        assert.callCount(getEntity, 4);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseSuccessAndFileNameIsDefaultFilename_shouldThrowError", async () => {
        //Act
        const entityName = "webpages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
            [schemaKey.SCHEMA_VERSION, "portalschemav2"],
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
            accessToken
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
        const showErrorMessage = stub(vscode.window, "showErrorMessage");
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
        assert.calledOnce(showErrorMessage);
        assert.callCount(getEntity, 4);
    });
});
