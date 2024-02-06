/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon from "sinon";
import { expect } from "chai";
import {
    dataverseAuthentication,
    getCommonHeaders,
} from "../../common/authenticationProvider";
import vscode from "vscode";
import WebExtensionContext from "../../WebExtensionContext";
import { telemetryEventNames } from "../../telemetry/constants";
import * as errorHandler from "../../common/errorHandler";
import {oneDSLoggerWrapper} from "../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let traceError: any

describe("Authentication Provider", () => {
    before(() => {
        oneDSLoggerWrapper.instantiate();
        traceError = sinon.stub(oneDSLoggerWrapper.getLogger(), "traceError")
    })

    after(() => {
        traceError.restore()
    })

    afterEach(() => {
        // Restore the default sandbox here
        sinon.restore();
    });
    it("getHeader", () => {
        const accessToken = "f068ee9f-a010-47b9-b1e1-7e6353730e7d";
        const result = getCommonHeaders(accessToken);
        expect(result.authorization).eq("Bearer " + accessToken);
        expect(result["content-type"]).eq("application/json; charset=utf-8");
        expect(result.accept).eq("application/json");
        expect(result["OData-MaxVersion"]).eq("4.0");
        expect(result["OData-Version"]).eq("4.0");
    });

    it("dataverseAuthentication", async () => {
        const dataverseOrgURL = "f068ee9f-a010-47b9-b1e1-7e6353730e7d";
        const accessToken = "f068ee9f-a010-47b9-b1e1-7e6353730e7d";
        const _mockgetSession = sinon
            .stub(await vscode.authentication, "getSession")
            .resolves({
                accessToken: accessToken,
                account: {} as vscode.AuthenticationSessionAccountInformation,
                id: "",
                scopes: [],
            });

        const result = await dataverseAuthentication(dataverseOrgURL);
        sinon.assert.calledOnce(_mockgetSession);
        expect(accessToken).eq(result);
    });

    it("dataverseAuthentication_return_blank_if_accessToken_is_null", async () => {
        //Action
        const dataverseOrgURL = "f068ee9f-a010-47b9-b1e1-7e6353730e7d";
        const _mockgetSession = sinon
            .stub(await vscode.authentication, "getSession")
            .resolves({
                accessToken: "",
                account: {
                    id: "f068ee9f-a010-47b9-b1e1-7e6353730e7d",
                } as vscode.AuthenticationSessionAccountInformation,
                id: "",
                scopes: [],
            });

        const showErrorDialog = sinon.spy(errorHandler, "showErrorDialog");

        const sendErrorTelemetry = sinon.spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

        //Act
        const result = await dataverseAuthentication(dataverseOrgURL);

        sinon.assert.calledWith(
            showErrorDialog,
            "Authorization Failed. Please run again to authorize it"
        );

        sinon.assert.calledWith(
            sendErrorTelemetry,
            telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED
        );

        sinon.assert.calledOnce(showErrorDialog);
        sinon.assert.calledOnce(sendErrorTelemetry);
        sinon.assert.calledOnce(_mockgetSession);
        expect(result).empty;
    });

    it("dataverseAuthentication_return_blank_if_exception_thrown", async () => {
        //Action
        const errorMessage = "access token not found";
        const dataverseOrgURL = "f068ee9f-a010-47b9-b1e1-7e6353730e7d";
        const _mockgetSession = sinon
            .stub(await vscode.authentication, "getSession")
            .throws({ message: errorMessage });

        const sendError = sinon.spy(
            WebExtensionContext.telemetry,
            "sendErrorTelemetry"
        );

        // Act
        const result = await dataverseAuthentication(dataverseOrgURL);

        //Assert
        sinon.assert.calledOnce(sendError);
        sinon.assert.calledWith(
            sendError,
            telemetryEventNames.WEB_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED,
            dataverseAuthentication.name,
            errorMessage
        );
        sinon.assert.calledOnce(_mockgetSession);
        expect(result).empty;
    });
});
