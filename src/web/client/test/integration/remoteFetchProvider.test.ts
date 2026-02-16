/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import sinon, { stub, assert } from "sinon";
import { fetchDataFromDataverseAndUpdateVFS } from "../../dal/remoteFetchProvider";
import { PortalsFS } from "../../dal/fileSystemProvider";
import WebExtensionContext from "../../WebExtensionContext";
import * as Constants from "../../common/constants";
import * as schemaHelperUtil from "../../utilities/schemaHelperUtil";
import { schemaEntityKey, folderExportType } from "../../schema/constants";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import * as commonUtil from "../../utilities/commonUtil";
import * as folderHelperUtility from "../../utilities/folderHelperUtility";
import { expect } from "chai";
import * as authenticationProvider from "../../../../common/services/AuthenticationProvider";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { queryParameters } from "../../common/constants";
import { ECSFeaturesClient } from "../../../../common/ecs-features/ecsFeatureClient";

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

        const _mockFetch = stub(WebExtensionContext.concurrencyHandler, "handleRequest").resolves({
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
        stub(urlBuilderUtil, "getRequestURL").returns(requestURL);

        stub(folderHelperUtility, "getRequestUrlForEntities").returns([
            { entityName: entityName, requestUrl: requestURL }
        ]);
        stub(commonUtil, "isWebfileContentLoadNeeded").returns(true);
        stub(urlBuilderUtil, "getCustomRequestURL").returns(requestURL);
        stub(schemaHelperUtil, "isBase64Encoded").returns(true);
        stub(commonUtil, "GetFileNameWithExtension").returns("test.txt");
        stub(commonUtil, "getSanitizedFileName").returns("testname");
        stub(commonUtil, "getAttributeContent").returns("VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg==");
        stub(schemaHelperUtil, "getAttributePath").returns({
            source: "value",
            relativePath: "ddrive",
        });
        stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.EXPORT_TYPE, folderExportType.SubFolders],
                [schemaEntityKey.FILE_FOLDER_NAME, "web-pages"],
                [schemaEntityKey.FILE_NAME_FIELD, "name"],
                [schemaEntityKey.FILE_ID_FIELD, "powerpagecomponentid"],
                [schemaEntityKey.ATTRIBUTES, "value,value2,value3"],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [schemaEntityKey.ATTRIBUTES_EXTENSION, new Map([["value", "css"], ["value2", "js"], ["value3", "html"]]) as any],
            ])
        );
        stub(schemaHelperUtil, "encodeAsBase64").returns(false);
        stub(schemaHelperUtil, "getEntityParameters").returns([]);
        stub(urlBuilderUtil, "getMetadataInfo").returns({});
        stub(commonUtil, "convertContentToUint8Array").returns(new Uint8Array());
        stub(commonUtil, "isNullOrUndefined").returns(false);
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

        // Stub getWebpageNames to return a Set
        const webpageNamesSet = new Set<string>();
        stub(WebExtensionContext, "getWebpageNames").returns(webpageNamesSet);

        // Stub ECS feature flags
        stub(ECSFeaturesClient, "getConfig").returns({
            enableDuplicateFileHandling: false,
            disallowedDuplicateFileHandlingOrgs: "",
            enableServerLogicChanges: false
        });

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;
        WebExtensionContext.orgUrl = "PowerPages.com";

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs, { entityId: entityId, entityName: entityName });

        //Assert
        assert.callCount(_mockFetch, 4); // 3 calls from authenticateAndUpdateDataverseProperties + 1 for the entity fetch

        assert.calledWith(
            sendAPITelemetry,
            requestURL,
            entityName,
            Constants.httpMethod.GET
        );

        // parse is called multiple times: once for setWebExtensionContext, once for createDirectory, 3 times for writeFile, and once for updateSingleFileUrisInContext
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
        // sendInfoTelemetry is called 3 times by authenticateAndUpdateDataverseProperties
        assert.callCount(sendInfoTelemetry, 3);
        // sendAPISuccessTelemetry is called 4 times: 3 from authenticateAndUpdateDataverseProperties + 1 from fetch
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

        const _mockFetch = stub(WebExtensionContext.concurrencyHandler, "handleRequest").resolves({
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
        stub(urlBuilderUtil, "getRequestURL").returns(
            requestURL
        );

        stub(folderHelperUtility, "getRequestUrlForEntities").returns([
            { entityName: entityName, requestUrl: requestURL }
        ]);
        stub(urlBuilderUtil, "getCustomRequestURL").returns(requestURL);

        stub(schemaHelperUtil, "isBase64Encoded").returns(true);
        stub(commonUtil, "GetFileNameWithExtension").returns("test.txt");
        stub(commonUtil, "getSanitizedFileName").returns("testname");
        stub(commonUtil, "getAttributeContent").returns("VGhpcyBpcyBhIHRlc3Qgc3RyaW5nLg==");
        stub(schemaHelperUtil, "getAttributePath").returns({
            source: "value",
            relativePath: "ddrive",
        });
        stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.EXPORT_TYPE, folderExportType.SubFolders],
                [schemaEntityKey.FILE_FOLDER_NAME, "web-pages"],
                [schemaEntityKey.FILE_NAME_FIELD, "name"],
                [schemaEntityKey.FILE_ID_FIELD, "powerpagecomponentid"],
                [schemaEntityKey.ATTRIBUTES, "value,value2,value3"],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [schemaEntityKey.ATTRIBUTES_EXTENSION, new Map([["value", "css"], ["value2", "js"], ["value3", "html"]]) as any],
            ])
        );
        stub(schemaHelperUtil, "encodeAsBase64").returns(false);
        stub(schemaHelperUtil, "getEntityParameters").returns([]);
        stub(urlBuilderUtil, "getMetadataInfo").returns({});
        stub(commonUtil, "convertContentToUint8Array").returns(new Uint8Array());
        stub(commonUtil, "isNullOrUndefined").returns(false);
        const fileUri: vscode.Uri = {
            path: "powerplatform-vfs:/testWebSite/web-pages/testname/",
        } as vscode.Uri;
        const parse = stub(vscode.Uri, "parse").returns(fileUri);
        const executeCommand = stub(vscode.commands, "executeCommand");

        const portalFs = new PortalsFS();
        const createDirectory = stub(portalFs, "createDirectory");
        const writeFile = stub(portalFs, "writeFile");

        // Stub getWebpageNames to return a Set
        const webpageNamesSet = new Set<string>();
        stub(WebExtensionContext, "getWebpageNames").returns(webpageNamesSet);

        // Stub ECS feature flags
        stub(ECSFeaturesClient, "getConfig").returns({
            enableDuplicateFileHandling: false,
            disallowedDuplicateFileHandlingOrgs: "",
            enableServerLogicChanges: false
        });

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;
        WebExtensionContext.orgUrl = "PowerPages.com";

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );

        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.callCount(_mockFetch, 4); // 3 calls from authenticateAndUpdateDataverseProperties + 1 for entity fetch

        assert.calledWith(
            sendAPITelemetry,
            requestURL,
            entityName,
            Constants.httpMethod.GET
        );

        // parse is called multiple times: once for setWebExtensionContext, once for createDirectory, and 3 times for writeFile
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
        // sendInfoTelemetry is called 3 times by authenticateAndUpdateDataverseProperties + 2 times for file operations = 5 total
        assert.callCount(sendInfoTelemetry, 5);
        assert.calledOnce(executeCommand);
        // sendAPISuccessTelemetry is called 4 times: 3 from authenticateAndUpdateDataverseProperties + 1 from fetch
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

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;

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

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

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
        assert.called(_mockFetch);
    });

    it("fetchDataFromDataverseAndUpdateVFS_whenResponseNotSuccess_shouldCallSendAPIFailureTelemetry", async () => {
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

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;

        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
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
            status: 500,
            statusText: "Internal Server Error",
            url: "https://test.crm.dynamics.com/api/data/v9.2/webpages",
            clone: function() { return this; },
            text: () => Promise.resolve(mockResponseBody),
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

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs);

        //Assert
        assert.called(sendAPIFailureTelemetry);
        assert.calledWithMatch(sendAPIFailureTelemetry,
            sinon.match.string,
            entityName,
            Constants.httpMethod.GET,
            sinon.match.number,
            "fetchFromDataverseAndCreateFiles",
            sinon.match.string,
            '',
            "500");
        assert.called(_mockFetch);
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

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;

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

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

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
        assert.called(_mockFetch);
        assert.called(sendAPITelemetry);
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

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;

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

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

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
        assert.called(_mockFetch);
        assert.called(sendAPITelemetry);
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

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;

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

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

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
        assert.called(_mockFetch);
        assert.called(sendAPITelemetry);
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

        // Set required WebExtensionContext properties
        WebExtensionContext.websiteName = "testWebSite";
        WebExtensionContext.websiteId = "36429b2e-8b29-4020-8493-bd5e277444d8";
        WebExtensionContext.organizationId = "e5dce21c-f85f-4849-b699-920c0fad5fbf";
        WebExtensionContext.environmentId = "c4dc3686-1e6b-e428-b886-16cd0b9f4918";
        WebExtensionContext.schema = Constants.portalSchemaVersion.V2;

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

        const portalFs = new PortalsFS();
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

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
        assert.called(_mockFetch);
        assert.called(sendAPITelemetry);
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

        const _mockFetch = stub(WebExtensionContext.concurrencyHandler, 'handleRequest').callsFake((url) => {
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
        stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.EXPORT_TYPE, "SingleFolder"],
                [schemaEntityKey.FILE_FOLDER_NAME, "web-files"],
                [schemaEntityKey.FILE_NAME_FIELD, "name"],
                [schemaEntityKey.FILE_ID_FIELD, "powerpagecomponentid"],
                [schemaEntityKey.ATTRIBUTES, "value"],
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                [schemaEntityKey.ATTRIBUTES_EXTENSION, new Map([["value", "css"]]) as any],
            ])
        );
        stub(schemaHelperUtil, "encodeAsBase64").returns(false);
        stub(schemaHelperUtil, "getEntityParameters").returns([]);
        stub(urlBuilderUtil, "getMetadataInfo").returns({});
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

        stub(folderHelperUtility, "getRequestUrlForEntities").returns([
            { entityName: entityName, requestUrl: "make.powerpgaes.com" }
        ]);

        //Action
        await fetchDataFromDataverseAndUpdateVFS(portalFs, { entityId: entityId, entityName: entityName });

        //Assert
        // handleRequest is called 4 times: 3 from authenticateAndUpdateDataverseProperties + 1 for the entity fetch
        assert.callCount(_mockFetch, 4);
        assert.callCount(sendAPITelemetry, 4);
        // parse is called 3 times: once for setWebExtensionContext, once for writeFile, once for updateSingleFileUrisInContext
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

        assert.calledOnce(convertContentToUint8Array);

        assert.callCount(writeFile, 1);
        assert.calledOnce(updateSingleFileUrisInContext);
        // sendInfoTelemetry is called 3 times by authenticateAndUpdateDataverseProperties
        assert.callCount(sendInfoTelemetry, 3);
        // sendAPISuccessTelemetry is called 3 times by authenticateAndUpdateDataverseProperties + 1 for the fetch = 4 total
        assert.callCount(sendAPISuccessTelemetry, 4);
    });

    it("fetchDataFromDataverseAndUpdateVFS_forWebFile_when404Response_shouldReturnNoContentAndLogTelemetry", async () => {
        const entityName = "webfiles";
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
            { accessToken: accessToken, userId: "" }
        );

        const _mockFetch = stub(fetch, 'default').callsFake((url) => {
            // Return 404 for webfile content fetch
            if (url === 'powerPages.com/api/data/v9.2/powerpagecomponents(aa563be7-9a38-4a89-9216-47f9fc6a3f14)/filecontent') {
                return Promise.resolve({
                    ok: false,
                    status: 404,
                    statusText: "Not Found",
                    json: () => Promise.resolve({}),
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                } as any);
            } else {
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

        stub(WebExtensionContext, "updateFileDetailsInContext");
        stub(WebExtensionContext, "updateEntityDetailsInContext");
        stub(WebExtensionContext.telemetry, "sendAPITelemetry");
        stub(WebExtensionContext.telemetry, "sendAPISuccessTelemetry");
        const sendInfoTelemetry = stub(WebExtensionContext.telemetry, "sendInfoTelemetry");
        const convertContentToUint8Array = stub(commonUtil, "convertContentToUint8Array");

        stub(commonUtil, "isWebfileContentLoadNeeded").returns(true);
        stub(schemaHelperUtil, "isBase64Encoded").returns(true);
        stub(commonUtil, "GetFileNameWithExtension").returns("deleted-file.png");
        stub(schemaHelperUtil, "getAttributePath").returns({ source: "value", relativePath: "", });
        stub(WebExtensionContext, "updateSingleFileUrisInContext");
        const fileUri: vscode.Uri = { path: "powerplatform-vfs:/testWebSite/web-files/", } as vscode.Uri;
        stub(vscode.Uri, "parse").returns(fileUri);

        const portalFs = new PortalsFS();
        stub(portalFs, "writeFile");
        WebExtensionContext.setWebExtensionContext(
            entityName,
            entityId,
            queryParamsMap
        );
        await WebExtensionContext.authenticateAndUpdateDataverseProperties();

        await fetchDataFromDataverseAndUpdateVFS(portalFs, { entityId: entityId, entityName: entityName });

        // Verify that 404 response logs WEB_EXTENSION_WEBFILE_NOT_FOUND telemetry
        assert.calledWithMatch(
            sendInfoTelemetry,
            webExtensionTelemetryEventNames.WEB_EXTENSION_WEBFILE_NOT_FOUND,
            { entityId: entityId, entity: "webfiles" }
        );

        // Verify that NO_CONTENT is used (the content should be " " which is Constants.NO_CONTENT)
        assert.calledWith(convertContentToUint8Array, Constants.NO_CONTENT, true);

        assert.called(_mockFetch);
    });
});
