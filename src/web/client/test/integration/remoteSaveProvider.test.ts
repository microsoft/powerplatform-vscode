/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import vscode from "vscode";
import * as fetch from "node-fetch";
import sinon, { stub, assert } from "sinon";
import { saveData } from "../../dal/remoteSaveProvider";
import * as schemaHelperUtil from "../../utilities/schemaHelperUtil";
import WebExtensionContext from "../../../client/WebExtensionContext";
import { expect } from "chai";
import { BAD_REQUEST } from "../../common/constants";
import * as urlBuilderUtil from "../../utilities/urlBuilderUtil";
import { IAttributePath } from "../../common/interfaces";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { getUserAgent } from "../../../../common/utilities/Utils";
import * as errorHandler from "../../../../common/utilities/errorHandlerUtil";

describe("remoteSaveProvider", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("saveData_whenFetchRetrnsOKAndIsWebFileV2IsFalse_shouldCallAllSuccessTelemetryMethods", async () => {
        //Act
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
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

        const vscodeParse = stub(vscode.Uri, "parse").returns({
            fsPath: "testuri",
        } as vscode.Uri);
        const isWebFileV2 = stub(schemaHelperUtil, "isWebFileV2").returns(
            false
        );
        WebExtensionContext.fileDataMap.setEntity(
            "",
            "",
            "",
            "",
            "",
            "",
            {
                relativePath: "relative",
                source: "dDrive",
            } as IAttributePath,
            true,
            "pdf"
        );
        WebExtensionContext.entityDataMap.setEntity(
            "",
            "",
            "",
            {
                relativePath: "relative",
                source: "dDrive",
            } as IAttributePath,
            "some content here"
        );

        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        stub(urlBuilderUtil, "getRequestURL").returns(requestUrl);

        //Action
        await saveData(fileUri);

        //Assert
        const fetchCalls = _mockFetch.getCalls();
        assert.calledOnce(_mockFetch);
        expect(fetchCalls[0].args[0]).eq(requestUrl);
        expect(fetchCalls[0].args[1]).deep.eq({
            method: "PATCH",
            body: '{"dDrive":"some content here","mimetype":"pdf"}',
            headers: {
                authorization: "Bearer ae3308da-d75b-4666-bcb8-8f33a3dd8a8d",
                "content-type": "application/json; charset=utf-8",
                accept: "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
                "x-ms-user-agent": getUserAgent()
            },
        });

        assert.calledOnce(sendAPITelemetry);
        const sendAPITelemetryCalls = sendAPITelemetry.getCalls();
        expect(sendAPITelemetryCalls[0].args[0]).eq(requestUrl);
        expect(sendAPITelemetryCalls[0].args[1]).eq("");
        expect(sendAPITelemetryCalls[0].args[2]).eq("PATCH");
        expect(sendAPITelemetryCalls[0].args[3]).eq("saveDataToDataverse");
        assert.calledOnce(sendAPISuccessTelemetry);
        assert.calledOnce(isWebFileV2);
        assert.calledOnce(vscodeParse);
    });

    it("saveData_whenFetchReturnsOKAndAttributePath2IsNull_shouldCallShowErrorDialog", async () => {
        //Act
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;

        const vscodeParse = stub(vscode.Uri, "parse").returns({
            fsPath: "testuri",
        } as vscode.Uri);
        stub(schemaHelperUtil, "isWebFileV2").returns(false);
        WebExtensionContext.fileDataMap.setEntity(
            "",
            "",
            "entityName",
            "",
            "",
            "",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            null as any,
            true,
            "pdf"
        );

        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        stub(urlBuilderUtil, "getRequestURL").returns(requestUrl);
        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");
        //Action
        await saveData(fileUri);

        //Assert
        const y = showErrorDialog.getCalls();
        expect(y[0].args[0]).eq("Unable to complete the request");
        expect(y[0].args[1]).eq(
            "One or more attribute names have been changed or removed. Contact your admin."
        );
        assert.calledOnce(showErrorDialog);
        assert.calledOnce(sendErrorTelemetry);
        assert.calledOnceWithExactly(
            sendErrorTelemetry,
            webExtensionTelemetryEventNames.WEB_EXTENSION_GET_SAVE_PARAMETERS_ERROR,
            "getSaveParameters",
            BAD_REQUEST
        );
        assert.calledOnce(vscodeParse);
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchReturnsNotOKAndIsWebFileV2IsFalse", async () => {
        //Act
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            statusText: "failCall",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({ value: "value" });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        stub(vscode.Uri, "parse").returns({
            fsPath: "testuri",
        } as vscode.Uri);
        stub(schemaHelperUtil, "isWebFileV2").returns(false);
        WebExtensionContext.fileDataMap.setEntity(
            "",
            "",
            "",
            "",
            "",
            "",
            {
                relativePath: "relative",
                source: "dDrive",
            } as IAttributePath,
            true,
            "pdf"
        );

        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        stub(urlBuilderUtil, "getRequestURL").returns(requestUrl);

        //Action
        try {
            await saveData(fileUri);
        } catch {
            //Assert
            const requestInit = {
                method: "PATCH",
                body: '{"dDrive":"some content here","mimetype":"pdf"}',
                headers: {
                    authorization:
                        "Bearer ae3308da-d75b-4666-bcb8-8f33a3dd8a8d",
                    "content-type": "application/json; charset=utf-8",
                    accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                    "x-ms-user-agent": getUserAgent()
                },
            };
            const fetchCalls = _mockFetch.getCalls();
            assert.calledOnce(_mockFetch);
            expect(fetchCalls[0].args[0]).eq(requestUrl);
            expect(fetchCalls[0].args[1]).deep.eq(requestInit);
            assert.callCount(sendAPITelemetry, 1);
        }
    });

    it("saveData_shouldErrorOnDataverseSaveCall_whenFetchReturnsNotOKAndStatusCodeIs304AndIsWebFileV2IsFalse", async () => {
        //Act
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            statusText: "Unauthorized",
            status: 403,
            json: () => {
                return new Promise((resolve) => {
                    return resolve({ value: "value" });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const vscodeParse = stub(vscode.Uri, "parse").returns({
            fsPath: "testuri",
        } as vscode.Uri);
        const isWebFileV2 = stub(schemaHelperUtil, "isWebFileV2").returns(
            false
        );
        const getColumnContent = stub(
            WebExtensionContext.entityDataMap,
            "getColumnContent"
        ).returns("");
        WebExtensionContext.fileDataMap.setEntity(
            "",
            "",
            "",
            "",
            "",
            "",
            {
                relativePath: "relative",
                source: "dDrive",
            } as IAttributePath,
            true,
            "pdf"
        );

        const sendErrorTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        stub(urlBuilderUtil, "getRequestURL").returns(requestUrl);

        //Action
        try {
            await saveData(fileUri);
        } catch {
            //Assert
            const fetchCalls = _mockFetch.getCalls();
            assert.calledOnce(_mockFetch);
            expect(fetchCalls[0].args[0]).eq(requestUrl);
            expect(fetchCalls[0].args[1]).deep.eq({
                method: "PATCH",
                body: '{"dDrive":"","mimetype":"pdf"}',
                headers: {
                    authorization:
                        "Bearer ae3308da-d75b-4666-bcb8-8f33a3dd8a8d",
                    "content-type": "application/json; charset=utf-8",
                    accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                    "x-ms-user-agent": getUserAgent()
                },
            });
            assert.calledOnce(getColumnContent);
            assert.calledOnce(isWebFileV2);
            assert.calledOnce(vscodeParse);
            assert.calledOnce(sendErrorTelemetry);
            assert.calledOnce(showErrorDialog);
            const showErrorDialogCalls = showErrorDialog.getCalls()[0];
            expect(
                showErrorDialogCalls.args[0],
                "There’s a problem on the back end"
            );
            expect(showErrorDialogCalls.args[1], "Try again");
        }
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchReturnsOKAndIsWebFileV2IsTrue", async () => {
        //Act
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
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

        const vscodeParse = stub(vscode.Uri, "parse").returns({
            fsPath: "testuri",
        } as vscode.Uri);
        const isWebFileV2 = stub(schemaHelperUtil, "isWebFileV2").returns(true);
        WebExtensionContext.fileDataMap.setEntity(
            "",
            "",
            "",
            "testfilename",
            "",
            "",
            {
                relativePath: "relative",
                source: "dDrive",
            } as IAttributePath,
            true,
            "pdf"
        );

        WebExtensionContext.entityDataMap.setEntity(
            "",
            "",
            "",
            {
                relativePath: "relative",
                source: "dDrive",
            } as IAttributePath,
            "some content here"
        );

        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        stub(urlBuilderUtil, "getRequestURL").returns(requestUrl);

        //Action
        await saveData(fileUri);

        //Assert
        assert.calledOnceWithExactly(
            _mockFetch,
            "https://orgedfe4d6c.crm10.dynamics.com",
            {
                method: "PATCH",
                body: 'some content here',
                headers: {
                    authorization:
                        "Bearer ae3308da-d75b-4666-bcb8-8f33a3dd8a8d",
                    "content-type": "application/json; charset=utf-8",
                    accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                    'x-ms-file-name': 'testfilename',
                    "x-ms-user-agent": getUserAgent()
                },
            }
        );

        assert.calledOnce(sendAPITelemetry);
        const sendAPITelemetryCalls = sendAPITelemetry.getCalls();
        expect(sendAPITelemetryCalls[0].args[0]).eq(requestUrl);
        expect(sendAPITelemetryCalls[0].args[1]).eq("");
        expect(sendAPITelemetryCalls[0].args[2]).eq("PATCH");
        expect(sendAPITelemetryCalls[0].args[3]).eq("saveDataToDataverse");
        assert.calledOnce(sendAPISuccessTelemetry);
        assert.calledOnce(isWebFileV2);
        assert.calledOnce(vscodeParse);
    });
});
