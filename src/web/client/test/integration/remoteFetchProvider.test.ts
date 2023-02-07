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
import {
    schemaEntityKey,
    schemaKey,
} from "../../schema/constants";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import * as commonUtil from "../../utilities/commonUtil";
import {  expect } from "chai";
import * as errorHandler from "../../common/errorHandler";

describe("remoteFetchProvider", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("fetchDataFromDataverseAndUpdateVFS_whenResposeSuccess_shouldCallAllSuccessFunction", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
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
            "webPage",
            "",
            queryParamsMap
        );

        const languageIdCodeMap = new Map<string, string>([["En", "english"]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "En"],
        ]);

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                value: '{"ddrive":"testFile","value":"value"}',
                            },
                            { name: "test Name" },
                            { _languagefield: "languagefield" },
                        ],
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
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        const parse = stub(vscode.Uri, "parse").returns(fileUri);
        const executeCommand = stub(vscode.commands, "executeCommand");
        const createDirectory = stub(portalFs, "createDirectory");
        const writeFile = stub(portalFs, "writeFile");

        //Action
        await fetchDataFromDataverseAndUpdateVFS(
            accessToken,
            entityName,
            entityId,
            queryParamsMap,
            languageIdCodeMap,
            portalFs,
            websiteIdToLanguage
        );

        //Assert
        assert.calledOnce(_mockFetch);

        assert.calledOnceWithExactly(
            sendAPITelemetry,
            requestURL,
            entityName,
            Constants.httpMethod.GET
        );
        assert.calledOnce(getRequestURL);
        assert.callCount(parse, 16);
        assert.callCount(createDirectory, 6);
        const createDirectoryCalls = createDirectory.getCalls();
        expect(createDirectoryCalls[0].args[0]).deep.eq({ path: "testuri" });
        expect(createDirectoryCalls[1].args[0]).deep.eq({ path: "testuri" });
        expect(createDirectoryCalls[2].args[0]).deep.eq({ path: "testuri" });
        expect(createDirectoryCalls[3].args[0]).deep.eq({ path: "testuri" });
        expect(createDirectoryCalls[4].args[0]).deep.eq({ path: "testuri" });
        expect(createDirectoryCalls[5].args[0]).deep.eq({ path: "testuri" });

        const updateFileDetailsInContextCalls =
            updateFileDetailsInContext.getCalls();

        assert.callCount(updateFileDetailsInContext, 6);
        expect(
            updateFileDetailsInContextCalls[0].args[0],
            "powerplatform-vfs:/testWebSite/web-pages/test Name/test.txt"
        );
        expect(
            updateFileDetailsInContextCalls[0].args[1],
            "aa563be7-9a38-4a89-9216-47f9fc6a3f14"
        );
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
        expect(
            updateFileDetailsInContextCalls[1].args[1],
            "aa563be7-9a38-4a89-9216-47f9fc6a3f14"
        );
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
        expect(
            updateFileDetailsInContextCalls[2].args[1],
            "aa563be7-9a38-4a89-9216-47f9fc6a3f14"
        );
        expect(updateFileDetailsInContextCalls[2].args[2], "webpages");
        expect(updateFileDetailsInContextCalls[2].args[3], "test.txt");
        expect(updateFileDetailsInContextCalls[2].args[4], undefined);
        expect(updateFileDetailsInContextCalls[2].args[5], "customcss.css");
        expect(
            updateFileDetailsInContextCalls[2].args[6],
            "{ source: 'value', relativePath: 'ddrive' }"
        );
        expect(updateFileDetailsInContextCalls[1].args[7], "false");

        assert.callCount(writeFile, 6);
        assert.calledTwice(updateSingleFileUrisInContext);
        assert.callCount(sendInfoTelemetry, 8);
        assert.calledTwice(executeCommand);
        assert.calledOnce(sendAPISuccessTelemetry);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResposeSuccessButDataIsNull_shouldCallShowErrorMessage", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
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
            "webPage",
            "",
            queryParamsMap
        );

        const languageIdCodeMap = new Map<string, string>([["En", "english"]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "En"],
        ]);

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
        await fetchDataFromDataverseAndUpdateVFS(
            accessToken,
            entityName,
            entityId,
            queryParamsMap,
            languageIdCodeMap,
            portalFs,
            websiteIdToLanguage
        );

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

    it("fetchDataFromDataverseAndUpdateVFS_whenResposeNotSuccess_shouldCallShowErrorMessage", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
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
            "webPage",
            "",
            queryParamsMap
        );

        const languageIdCodeMap = new Map<string, string>([["En", "english"]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "En"],
        ]);

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
        await fetchDataFromDataverseAndUpdateVFS(
            accessToken,
            entityName,
            entityId,
            queryParamsMap,
            languageIdCodeMap,
            portalFs,
            websiteIdToLanguage
        );

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

    it("fetchDataFromDataverseAndUpdateVFS_whenResposeSuccessAndSubUriIsBlank_shouldThrowError", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
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
            "webPage",
            "",
            queryParamsMap
        );

        const languageIdCodeMap = new Map<string, string>([["En", "english"]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "En"],
        ]);

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                value: '{"ddrive":"testFile","value":"value"}',
                            },
                            { name: "test Name" },
                            { _languagefield: "languagefield" },
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
        await fetchDataFromDataverseAndUpdateVFS(
            accessToken,
            entityName,
            entityId,
            queryParamsMap,
            languageIdCodeMap,
            portalFs,
            websiteIdToLanguage
        );

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledThrice(sendErrorTelemetry);
        assert.calledThrice(showErrorMessage);
        assert.callCount(getEntity, 5);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResposeSuccessAndAttributesIsBlank_shouldThrowError", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
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
            "webPage",
            "",
            queryParamsMap
        );

        const languageIdCodeMap = new Map<string, string>([["En", "english"]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "En"],
        ]);

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                value: '{"ddrive":"testFile","value":"value"}',
                            },
                            { name: "test Name" },
                            { _languagefield: "languagefield" },
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
        await fetchDataFromDataverseAndUpdateVFS(
            accessToken,
            entityName,
            entityId,
            queryParamsMap,
            languageIdCodeMap,
            portalFs,
            websiteIdToLanguage
        );

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledThrice(sendErrorTelemetry);
        assert.calledThrice(showErrorMessage);
        assert.callCount(getEntity, 5);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResposeSuccessAndAttributeExtensionIsBlank_shouldThrowError", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
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
            "webPage",
            "",
            queryParamsMap
        );

        const languageIdCodeMap = new Map<string, string>([["En", "english"]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "En"],
        ]);

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                value: '{"ddrive":"testFile","value":"value"}',
                            },
                            { name: "test Name" },
                            { _languagefield: "languagefield" },
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
        await fetchDataFromDataverseAndUpdateVFS(
            accessToken,
            entityName,
            entityId,
            queryParamsMap,
            languageIdCodeMap,
            portalFs,
            websiteIdToLanguage
        );

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledThrice(sendErrorTelemetry);
        assert.calledThrice(showErrorMessage);
        assert.callCount(getEntity, 5);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResposeSuccessAndFileNameIsDefaultfilename_shouldThrowError", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
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
            "webPage",
            "",
            queryParamsMap
        );

        const languageIdCodeMap = new Map<string, string>([["En", "english"]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([
            ["a58f4e1e-5fe2-45ee-a7c1-398073b40181", "En"],
        ]);

        const _mockFetch = stub(fetch, "default").resolves({
            ok: true,
            statusText: "statusText",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({
                        value: [
                            {
                                value: '{"ddrive":"testFile","value":"value"}',
                            },
                            { name: "test Name" },
                            { _languagefield: "languagefield" },
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
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        //Action
        await fetchDataFromDataverseAndUpdateVFS(
            accessToken,
            entityName,
            entityId,
            queryParamsMap,
            languageIdCodeMap,
            portalFs,
            websiteIdToLanguage
        );

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledTwice(sendAPITelemetry);
        assert.calledThrice(sendErrorTelemetry);
        assert.calledThrice(showErrorMessage);
        assert.callCount(getEntity, 5);
    });
});
