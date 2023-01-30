/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import vscode from "vscode";
import * as nls from "vscode-nls";
import * as fetch from "node-fetch";
import sinon, { stub, assert } from "sinon";
import { saveData } from "../../dal/remoteSaveProvider";
import { schemaEntityName } from "../../schema/constants";
import * as schemaHelperUtil from "../../utilities/schemaHelperUtil";
import WebExtensionContext from "../../../client/WebExtensionContext";
import { getHeader } from "../../common/authenticationProvider";
import { httpMethod, BAD_REQUEST } from "../../common/constants";
import * as errorHandler from "../../common/errorHandler";
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import { expect } from "chai";
describe("remoteSaveProvider", () => {
    afterEach(() => {
        sinon.restore();
    });
    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsOKAndIsWebFileV2IsTrue", async () => {
        //Act
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

        const isWebFileV2OctetStream = stub(
            schemaHelperUtil,
            "isWebFileV2"
        ).returns(false);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const entityName = schemaEntityName.WEBFILES;
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert

        assert.calledOnce(_mockFetch);
        assert.calledWith(_mockFetch, requestUrl, {
            method: httpMethod.PATCH,
            body: '{"name":"testContent","testpath":"newFileContent"}',
            headers: getHeader(accessToken, true),
        });
        assert.calledOnceWithExactly(
            sendAPITelemetry,
            requestUrl,
            entityName,
            httpMethod.PATCH,
            "entityFileExtensionType"
        );
        assert.calledOnce(sendAPISuccessTelemetry);

        assert.calledOnceWithExactly(
            isWebFileV2OctetStream,
            entityName,
            "saveAttribute.testpath"
        );
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsOKAndIsWebFileV2IsFalse", async () => {
        //Act

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

        const isWebFileV2OctetStream = stub(
            schemaHelperUtil,
            "isWebFileV2"
        ).returns(false);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const entityName = schemaEntityName.WEBFILES;
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;

        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledWith(_mockFetch, requestUrl, {
            method: httpMethod.PATCH,
            body: '{"mimetype":"pdf","saveAttribute":"newFileContent"}',
            headers: getHeader(accessToken, false),
        });
        assert.calledOnceWithExactly(
            sendAPITelemetry,
            requestUrl,
            entityName,
            httpMethod.PATCH,
            "entityFileExtensionType"
        );
        assert.calledOnce(sendAPISuccessTelemetry);

        assert.calledOnceWithExactly(
            isWebFileV2OctetStream,
            entityName,
            "saveAttribute"
        );
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsOKAndRequestUrlHavingAttributeType", async () => {
        //Act

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

        const isWebFileV2OctetStream = stub(
            schemaHelperUtil,
            "isWebFileV2"
        ).returns(false);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const entityName = schemaEntityName.WEBFILES;
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;

        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledWith(
            _mockFetch,
            "https://orgedfe4d6c.crm10.dynamics.com/filecontent",
            {
                method: httpMethod.PATCH,
                body: '{"mimetype":"pdf","filecontent":"newFileContent"}',
                headers: getHeader(accessToken, false),
            }
        );
        assert.calledOnceWithExactly(
            sendAPITelemetry,
            "https://orgedfe4d6c.crm10.dynamics.com/filecontent",
            entityName,
            httpMethod.PATCH,
            "entityFileExtensionType"
        );
        assert.calledOnce(sendAPISuccessTelemetry);

        assert.calledOnceWithExactly(
            isWebFileV2OctetStream,
            entityName,
            "filecontent"
        );
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsOKAndMimeTypeIsNotDefined", async () => {
        //Act

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

        const isWebFileV2OctetStream = stub(
            schemaHelperUtil,
            "isWebFileV2"
        ).returns(false);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const entityName = schemaEntityName.WEBFILES;
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;

        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        assert.calledOnce(_mockFetch);
        assert.calledWith(
            _mockFetch,
            "https://orgedfe4d6c.crm10.dynamics.com/filecontent",
            {
                method: httpMethod.PATCH,
                body: '{"filecontent":"newFileContent"}',
                headers: getHeader(accessToken, false),
            }
        );
        assert.calledOnceWithExactly(
            sendAPITelemetry,
            "https://orgedfe4d6c.crm10.dynamics.com/filecontent",
            entityName,
            httpMethod.PATCH,
            "entityFileExtensionType"
        );
        assert.calledOnce(sendAPISuccessTelemetry);

        assert.calledOnceWithExactly(
            isWebFileV2OctetStream,
            entityName,
            "filecontent"
        );
    });

    it("saveData_shouldNotMakeFetchCall_whenRequestBodyIsNotDefined", async () => {
        //Act

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

        const isWebFileV2OctetStream = stub(
            schemaHelperUtil,
            "isWebFileV2"
        ).returns(true);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const entityName = schemaEntityName.WEBFILES;
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;

        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        assert.notCalled(_mockFetch);
        assert.notCalled(sendAPITelemetry);
        assert.notCalled(sendAPISuccessTelemetry);

        assert.calledOnceWithExactly(
            isWebFileV2OctetStream,
            entityName,
            "filecontent"
        );
    });

    it("saveData_shouldCallAllSuccessTelemetryMethods_whenFetchRetrnsOKAndColumnIsNull", async () => {
        //Act

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

        const isWebFileV2OctetStream = stub(
            schemaHelperUtil,
            "isWebFileV2"
        ).returns(true);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );
        const sendAPISuccessTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPISuccessTelemetry"
        );

        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");

        const entityName = schemaEntityName.WEBFILES;

        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;

        //Action
        await saveData(accessToken, requestUrl, fileUri);

        //Assert
        assert.notCalled(_mockFetch);

        assert.notCalled(sendAPITelemetry);
        assert.notCalled(sendAPISuccessTelemetry);

        assert.notCalled(isWebFileV2OctetStream);

        assert.calledOnceWithExactly(
            showErrorDialog,
            localize(
                "microsoft-powerapps-portals.webExtension.save.file.error",
                "Unable to complete the request"
            ),
            localize(
                "microsoft-powerapps-portals.webExtension.save.file.error.desc",
                "One or more attribute names have been changed or removed. Contact your admin."
            )
        );
        assert.calledOnceWithExactly(
            sendAPIFailureTelemetry,
            requestUrl,
            entityName,
            httpMethod.PATCH,
            0,
            BAD_REQUEST
        );
    });
    it("saveData_shouldNotCallAllSuccessTelemetryMethods_whenFetchRetrnsOKAsFalse", async () => {
        //Act

        const _mockFetch = stub(fetch, "default").resolves({
            ok: false,
            statusText: "Unauthorized",
            json: () => {
                return new Promise((resolve) => {
                    return resolve({ value: "value" });
                });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);

        const isWebFileV2OctetStream = stub(
            schemaHelperUtil,
            "isWebFileV2"
        ).returns(true);
        const sendAPITelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPITelemetry"
        );

        const sendAPIFailureTelemetry = stub(
            WebExtensionContext.telemetry,
            "sendAPIFailureTelemetry"
        );

        const showErrorDialog = stub(errorHandler, "showErrorDialog");

        const entityName = schemaEntityName.WEBFILES;
        const accessToken = "token";
        const requestUrl = "https://orgedfe4d6c.crm10.dynamics.com";
        const fileUri: vscode.Uri = { fsPath: "testuri" } as vscode.Uri;
        await saveData(accessToken, requestUrl, fileUri);

        assert.calledTwice(sendAPIFailureTelemetry);
        assert.calledTwice(showErrorDialog);
        const firstshowErrorDialogCallArgs = showErrorDialog.getCall(0).args;
        const secshowErrorDialogCallArgs = showErrorDialog.getCall(1).args;
        expect(firstshowErrorDialogCallArgs[0]).eq(
            localize(
                "microsoft-powerapps-portals.webExtension.backend.error",
                "There’s a problem on the back end"
            ),
            localize(
                "microsoft-powerapps-portals.webExtension.retry.desc",
                "Try again"
            )
        );
        expect(secshowErrorDialogCallArgs[0]).eq(
            localize(
                "microsoft-powerapps-portals.webExtension.parameter.error",
                "One or more commands are invalid or malformed"
            ),
            localize(
                "microsoft-powerapps-portals.webExtension.parameter.desc",
                "Check the parameters and try again"
            )
        );
        assert.calledOnce(_mockFetch);
        assert.calledWith(_mockFetch, requestUrl, {
            method: httpMethod.PATCH,
            body: '{"name":"testContent","testpath":"newFileContent"}',
            headers: getHeader(accessToken, true),
        });
        assert.calledOnceWithExactly(
            sendAPITelemetry,
            requestUrl,
            entityName,
            httpMethod.PATCH,
            "entityFileExtensionType"
        );

        assert.calledOnceWithExactly(
            isWebFileV2OctetStream,
            entityName,
            "saveAttribute.testpath"
        );
    });
});
