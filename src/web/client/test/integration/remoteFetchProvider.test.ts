// /*
//  * Copyright (c) Microsoft Corporation. All rights reserved.
//  * Licensed under the MIT License. See License.txt in the project root for license information.
//  */

// import * as f from "node-fetch";
// import * as vscode from "vscode";
// import * as webExtensionTelemetry from "../../telemetry/webExtensionTelemetry";
// import * as UrlBuilder from "../../utilities/urlBuilderUtil";
// import { getHeader } from "../../common/authenticationProvider";
// import * as Constants from "../../common/constants";
// import { PortalsFS } from "../../dal/fileSystemProvider";
// import { SaveEntityDetails } from "../../schema/portalSchemaInterface";
// import PowerPlatformExtensionContextManager from "../../powerPlatformExtensionContext";
// import { fetchDataFromDataverseAndUpdateVFS } from "../../dal/remoteFetchProvider";
// import sinon, { assert, stub, spy } from "sinon";

// describe("remoteFetchProvider", () => {
//     afterEach(() => {
//         sinon.restore();
//     });

//     it("fetchDataFromDataverseAndUpdateVFS", async () => {
//         const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";

//         const accessToken = "token";
//         const entity = "WEBPAGES";
//         const entityId = "";
//         const queryParamsMap = new Map<string, string>([
//             [
//                 Constants.queryParameters.ORG_URL,
//                 "https://orgedfe4d6c.crm10.dynamics.com",
//             ],
//         ]);
//         const languageIdCodeMap = new Map<string, string>();
//         const portalFs = new PortalsFS();
//         const websiteIdToLanguage = new Map<string, string>([
//             ["en-us", "en-us"],
//         ]);

//         //  Mocking getRequestURL
//         const getRequestURL = stub(UrlBuilder, "getRequestURL").returns(
//             requestUrl
//         );

//         const sendAPITelemetry = stub(
//             webExtensionTelemetry,
//             "sendAPITelemetry"
//         );

//         const sendInfoTelemetry = spy(
//             webExtensionTelemetry,
//             "sendInfoTelemetry"
//         );

//         const _mockFetch = stub(f, "default").resolves({
//             ok: true,
//             json: () => {
//                 return new Promise((resolve) => {
//                     return resolve({ value: "value" });
//                 });
//             },
//         } as any);

//         stub(portalFs, "createDirectory");
//        // const vscodeparse = stub(vscode.Uri, "parse");
//         const saveDataMap = new Map<string, SaveEntityDetails>([
//             ["hjbhj", new SaveEntityDetails("", "", "", "", false, undefined)],
//         ]);
//         const getPowerPlatformExtensionContext = stub(
//             PowerPlatformExtensionContextManager,
//             "getPowerPlatformExtensionContext"
//         ).resolves(saveDataMap);

//         //  const useBase = stub(baseConversion, "useBase64");

//         await fetchDataFromDataverseAndUpdateVFS(
//             accessToken,
//             entity,
//             entityId,
//             queryParamsMap,
//             languageIdCodeMap,
//             portalFs,
//             websiteIdToLanguage
//         );

//         assert.calledOnce(_mockFetch);
//         assert.calledWith(_mockFetch, requestUrl, {
//             headers: getHeader(accessToken),
//         });
//         assert.calledWith(
//             getRequestURL,
//             requestUrl,
//             entity,
//             entityId,
//             Constants.httpMethod.GET,
//             false
//         );

//         assert.callCount(sendInfoTelemetry, 1);
//         assert.calledOnce(getRequestURL);
//         assert.calledWith(sendAPITelemetry, requestUrl);
//         assert.callCount(getPowerPlatformExtensionContext, 1);
//     });
// });
