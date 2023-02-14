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
import { IAttributePath } from "../../utilities/schemaHelperUtil";
import * as errorHandler from "../../common/errorHandler";
import { BAD_REQUEST, httpMethod } from "../../common/constants";

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

        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";

        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        const requestInit = {
            method: "GET",
            headers: {
                authorization: "Bearer token",
                "content-type": "application/json; charset=utf-8",
                accept: "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
            },
        };
        const fetchCalls = _mockFetch.getCalls();
        assert.calledTwice(_mockFetch);
        expect(fetchCalls[0].args[0]).eq(requestUrl);
        expect(fetchCalls[0].args[1]).deep.eq(requestInit);

        expect(fetchCalls[1].args[0]).eq(requestUrl);
        expect(fetchCalls[1].args[1]).deep.eq({
            method: "PATCH",
            body: '{"dDrive":"","mimetype":"pdf"}',
            headers: {
                authorization: "Bearer token",
                "content-type": "application/json; charset=utf-8",
                accept: "application/json",
                "OData-MaxVersion": "4.0",
                "OData-Version": "4.0",
            },
        });

        assert.calledTwice(sendAPITelemetry);
        const sendAPITelemetryCalls = sendAPITelemetry.getCalls();
        expect(sendAPITelemetryCalls[0].args[0]).eq(requestUrl);
        expect(sendAPITelemetryCalls[0].args[1]).eq("");
        expect(sendAPITelemetryCalls[0].args[2]).eq("GET");
        expect(sendAPITelemetryCalls[0].args[3]).eq("");
        expect(sendAPITelemetryCalls[1].args[0]).eq(requestUrl);
        expect(sendAPITelemetryCalls[1].args[1]).eq("");
        expect(sendAPITelemetryCalls[1].args[2]).eq("PATCH");
        expect(sendAPITelemetryCalls[1].args[3]).eq("");
        assert.calledTwice(sendAPISuccessTelemetry);
        assert.calledOnce(isWebFileV2);
        assert.calledOnce(vscodeParse);
    });

    it("saveData_whenFetchRetrnsOKAndAttributePath2IsNull_shouldCallShowErrorDialog", async () => {
        //Act
        const fileUri: vscode.Uri = { fsPath: "testurii" } as vscode.Uri;

        const vscodeParse = stub(vscode.Uri, "parse").returns({
            fsPath: "testurii",
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
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");
        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        const y = showErrorDialog.getCalls();
        expect(y[0].args[0]).eq("Unable to complete the request");
        expect(y[0].args[1]).eq(
            "One or more attribute names have been changed or removed. Contact your admin."
        );
        assert.calledOnce(showErrorDialog);
        assert.calledOnceWithExactly(
            sendAPIFailureTelemetry,
            requestUrl,
            "entityName",
            httpMethod.PATCH,
            0,
            BAD_REQUEST
        );
        assert.calledOnce(vscodeParse);
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsNotOKAndIsWebFileV2IsFalse", async () => {
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

        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";

        //Action
        try {
            await saveData(accessToken, requestUrl, fileUri);
        } catch {
            //Assert
            const requestInit = {
                method: "GET",
                headers: {
                    authorization: "Bearer token",
                    "content-type": "application/json; charset=utf-8",
                    accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                },
            };
            const fetchCalls = _mockFetch.getCalls();
            assert.calledTwice(_mockFetch);
            expect(fetchCalls[0].args[0]).eq(requestUrl);
            expect(fetchCalls[0].args[1]).deep.eq(requestInit);
            assert.callCount(sendAPITelemetry, 5);
        }
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsNotOKAndStatusCodeIs304AndIsWebFileV2IsFalse", async () => {
        //Act
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            statusText: "Unauthorized",
            status: 304,
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

        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const sendInfoTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendInfoTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";

        //Action
        try {
            await saveData(accessToken, requestUrl, fileUri);
        } catch {
            //Assert
            const requestInit = {
                method: "GET",
                headers: {
                    authorization: "Bearer token",
                    "content-type": "application/json; charset=utf-8",
                    accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                },
            };

            const fetchCalls = _mockFetch.getCalls();
            assert.calledTwice(_mockFetch);
            expect(fetchCalls[0].args[0]).eq(requestUrl);
            expect(fetchCalls[0].args[1]).deep.eq(requestInit);

            expect(fetchCalls[1].args[0]).eq(requestUrl);
            expect(fetchCalls[1].args[1]).deep.eq({
                method: "PATCH",
                body: '{"dDrive":"","mimetype":"pdf"}',
                headers: {
                    authorization: "Bearer token",
                    "content-type": "application/json; charset=utf-8",
                    accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                },
            });
            assert.calledOnce(sendInfoTelemetry);
            assert.calledOnce(getColumnContent);
            assert.calledOnce(isWebFileV2);
            assert.calledOnce(vscodeParse);
            assert.calledTwice(sendAPIFailureTelemetry);
            assert.calledOnce(showErrorDialog);
            const showErrorDialogCalls = showErrorDialog.getCalls()[0];
            expect(
                showErrorDialogCalls.args[0],
                "There’s a problem on the back end"
            );
            expect(showErrorDialogCalls.args[1], "Try again");
        }
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsOKAndIsWebFileV2IsTrue", async () => {
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

        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";

        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        assert.calledOnceWithExactly(
            _mockFetch,
            "https://orgedfe4d6c.crm10.dynamics.com",
            {
                method: "GET",
                headers: {
                    authorization: "Bearer token",
                    "content-type": "application/json; charset=utf-8",
                    accept: "application/json",
                    "OData-MaxVersion": "4.0",
                    "OData-Version": "4.0",
                },
            }
        );

        assert.calledOnce(sendAPITelemetry);
        const sendAPITelemetryCalls = sendAPITelemetry.getCalls();
        expect(sendAPITelemetryCalls[0].args[0]).eq(requestUrl);
        expect(sendAPITelemetryCalls[0].args[1]).eq("");
        expect(sendAPITelemetryCalls[0].args[2]).eq("GET");
        expect(sendAPITelemetryCalls[0].args[3]).eq("");
        assert.calledOnce(sendAPISuccessTelemetry);
        assert.calledOnce(isWebFileV2);
        assert.calledOnce(vscodeParse);
    });
});
