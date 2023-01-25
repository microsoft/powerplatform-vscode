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
import { folderExportType, schemaEntityKey } from "../../schema/constants";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import * as commonUtil from "../../utilities/commonUtil";

describe("remoteFetchProvider", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("fetchDataFromDataverseAndUpdateVFS", async () => {
        //Act
        const accessToken = "ae3308da-d75b-4666-bcb8-8f33a3dd8a8d";
        const entityName = "webPages";
        const entityId = "aa563be7-9a38-4a89-9216-47f9fc6a3f14";
        const queryParamsMap = new Map<string, string>([
            [Constants.queryParameters.ORG_URL, "powerPages.com"],
            [
                Constants.queryParameters.WEBSITE_ID,
                "a58f4e1e-5fe2-45ee-a7c1-398073b40181",
            ],
            [Constants.queryParameters.WEBSITE_NAME, "testWebSite"],
        ]);
        const languageIdCodeMap = new Map<string, string>([["", ""]]);
        const portalFs = new PortalsFS();
        const websiteIdToLanguage = new Map<string, string>([["", ""]]);

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
        const updateEntityDetailsInContext = stub(
            WebExtensionContext,
            "updateEntityDetailsInContext"
        );
        stub(WebExtensionContext.telemetry, "sendAPITelemetry");
        stub(WebExtensionContext.telemetry, "sendAPISuccessTelemetry");
        stub(WebExtensionContext.telemetry, "sendInfoTelemetry");
        stub(urlBuilderUtil, "getRequestURL").returns("make.powerpgaes.com");
        stub(schemaHelperUtil, "getEntity").returns(
            new Map<string, string>([
                [schemaEntityKey.ATTRIBUTES, "attribute"],
                [schemaEntityKey.ATTRIBUTES_EXTENSION, "attribute"],
                [schemaEntityKey.MAPPING_ATTRIBUTE_FETCH_QUERY, "getData"],
                [schemaEntityKey.EXPORT_TYPE, folderExportType.SubFolders],
                [schemaEntityKey.FILE_FOLDER_NAME, "testFolder"],
                [schemaEntityKey.FILE_NAME_FIELD, "name"],
                [schemaEntityKey.LANGUAGE_FIELD, "value"],
            ])
        );
        stub(schemaHelperUtil, "isBase64Encoded").returns(true);
        stub(commonUtil, "GetFileNameWithExtension").returns("test.txt");
        stub(schemaHelperUtil, "getAttributePath").returns({
            source: "value",
            relativePath: "ddrive",
        });

        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        stub(vscode.Uri, "parse").returns(fileUri);
        stub(portalFs, "createDirectory");
        stub(portalFs, "writeFile");

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
        // assert.calledOnce(updateFileDetailsInContext);
        // assert.calledOnce(updateEntityDetailsInContext);
    });
});
