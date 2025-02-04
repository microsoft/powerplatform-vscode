/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon from "sinon";
import { expect } from "chai";
import {
    dataverseAuthentication,
    getCommonHeaders,
} from "../../../../common/services/AuthenticationProvider";
import vscode from "vscode";
import * as errorHandler from "../../../../common/utilities/errorHandlerUtil";
import { oneDSLoggerWrapper } from "../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import * as copilotTelemetry from "../../../../common/copilot/telemetry/copilotTelemetry";
import { VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED } from "../../../../common/services/TelemetryConstants";

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
        expect(result.accessToken).eq("f068ee9f-a010-47b9-b1e1-7e6353730e7d");
        expect(result.userId).empty;
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

        const sendTelemetryEvent = sinon.spy(
            copilotTelemetry,
            "sendTelemetryEvent"
        );

        //Act
        await dataverseAuthentication(dataverseOrgURL);

        sinon.assert.calledWith(
            showErrorDialog,
            "Authorization Failed. Please run again to authorize it"
        );

        sinon.assert.calledTwice(sendTelemetryEvent);
        sinon.assert.calledOnce(showErrorDialog);
        sinon.assert.calledOnce(_mockgetSession);
    });

    it("dataverseAuthentication_return_blank_if_exception_thrown", async () => {
        //Action
        const errorMessage = "access token not found";
        const dataverseOrgURL = "f068ee9f-a010-47b9-b1e1-7e6353730e7d";
        const _mockgetSession = sinon
            .stub(await vscode.authentication, "getSession")
            .throws({ message: errorMessage });

        const sendTelemetryEvent = sinon.spy(
            copilotTelemetry,
            "sendTelemetryEvent"
        );

        // Act
        const result = await dataverseAuthentication(dataverseOrgURL);

        //Assert
        sinon.assert.calledOnce(sendTelemetryEvent);
        sinon.assert.calledWith(
            sendTelemetryEvent,
            {
            eventName: VSCODE_EXTENSION_DATAVERSE_AUTHENTICATION_FAILED,
            errorMsg: errorMessage
        }
        );
        sinon.assert.calledOnce(_mockgetSession);
        expect(result.accessToken).empty;
        expect(result.userId).empty;
    });
});
