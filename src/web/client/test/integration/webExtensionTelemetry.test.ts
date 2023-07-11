/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon, { stub, assert } from "sinon";
import { queryParameters } from "../../common/constants";
import { sanitizeURL } from "../../utilities/urlBuilderUtil";
import { telemetryEventNames } from "../../telemetry/constants";
import { WebExtensionTelemetry } from "../../telemetry/webExtensionTelemetry";
import { vscodeExtAppInsightsResourceProvider } from "../../../../common/telemetry-generated/telemetryConfiguration";
import { expect } from "chai";

describe("webExtensionTelemetry", () => {
    afterEach(() => {
        sinon.restore();
    });
    const webExtensionTelemetry = new WebExtensionTelemetry();
    const appInsightsResource =
        vscodeExtAppInsightsResourceProvider.GetAppInsightsResourceForDataBoundary(
            undefined
        );
    webExtensionTelemetry.setTelemetryReporter("", "", appInsightsResource);

    const telemetry = webExtensionTelemetry.getTelemetryReporter();

    it("sendExtensionInitPathParametersTelemetry_whenSendProperValues_shouldCallWithAllValidData", () => {
        //Act
        const appName: string | undefined = "PowerPages";
        const entity: string | undefined = "webpage";
        const entityId: string | undefined =
            "e5dce21c-f85f-4849-b699-920c0fad5fbf";

        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");
        //Action
        webExtensionTelemetry.sendExtensionInitPathParametersTelemetry(
            appName,
            entity,
            entityId
        );

        //Assert
        const properties = {
            appName: appName,
            entity: entity,
            entityId: entityId,
        };
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            telemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
            properties
        );
    });

    it("sendExtensionInitPathParametersTelemetry_whenSendundefined_shouldCallWithAllblank", () => {
        //Act
        const appName: string | undefined = undefined;
        const entity: string | undefined = undefined;
        const entityId: string | undefined = undefined;

        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");
        //Action
        webExtensionTelemetry.sendExtensionInitPathParametersTelemetry(
            appName,
            entity,
            entityId
        );

        //Assert
        const properties = {
            appName: "",
            entity: "",
            entityId: "",
        };
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            telemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
            properties
        );
    });

    it("sendExtensionInitQueryParametersTelemetry_whenQueryParamHaveAllTheKey_shouldCallSendTelemetryEventWithValidData", () => {
        //Act
        const queryParamsMap = new Map<string, string>([
            [queryParameters.ORG_ID, "e5dce21c-f85f-4849-b699-920c0fad5fbf"],
            [queryParameters.TENANT_ID, "3fcf33c5-46c9-495e-a025-d1f2efe44667"],
            [queryParameters.PORTAL_ID, "36429b2e-8b29-4020-8493-bd5e277444d8"],
            [
                queryParameters.WEBSITE_ID,
                "edde7aaf-ccde-4f2a-9ab2-f9086ac5b4be",
            ],
            [queryParameters.DATA_SOURCE, "SQL"],
            [queryParameters.SCHEMA, "test"],
            [
                queryParameters.REFERRER_SESSION_ID,
                "4269b44f-8085-4001-88fe-3f30f1194c6f",
            ],
            [queryParameters.REFERRER, "yes"],
            [queryParameters.SITE_VISIBILITY, "false"],
        ]);

        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");
        const properties = {
            orgId: queryParamsMap.get(queryParameters.ORG_ID),
            tenantId: queryParamsMap.get(queryParameters.TENANT_ID),
            portalId: queryParamsMap.get(queryParameters.PORTAL_ID),
            websiteId: queryParamsMap.get(queryParameters.WEBSITE_ID),
            dataSource: queryParamsMap.get(queryParameters.DATA_SOURCE),
            schema: queryParamsMap.get(queryParameters.SCHEMA),
            referrerSessionId: queryParamsMap.get(
                queryParameters.REFERRER_SESSION_ID
            ),
            referrer: queryParamsMap.get(queryParameters.REFERRER),
            siteVisibility: queryParamsMap.get(queryParameters.SITE_VISIBILITY),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        //Action
        webExtensionTelemetry.sendExtensionInitQueryParametersTelemetry(
            queryParamsMap
        );

        //Assert
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            telemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
            properties
        );
    });

    it("sendExtensionInitQueryParametersTelemetry_whenQueryParamsMapIsEmpty_shouldNotThrowException", () => {
        //Act
        const queryParamsMap = new Map<string, string>([]);

        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");
        const properties = {
            orgId: queryParamsMap.get(queryParameters.ORG_ID),
            tenantId: queryParamsMap.get(queryParameters.TENANT_ID),
            portalId: queryParamsMap.get(queryParameters.PORTAL_ID),
            websiteId: queryParamsMap.get(queryParameters.WEBSITE_ID),
            dataSource: queryParamsMap.get(queryParameters.DATA_SOURCE),
            schema: queryParamsMap.get(queryParameters.SCHEMA),
            referrerSessionId: queryParamsMap.get(
                queryParameters.REFERRER_SESSION_ID
            ),
            referrer: queryParamsMap.get(queryParameters.REFERRER),
            siteVisibility: queryParamsMap.get(queryParameters.SITE_VISIBILITY),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        //Action
        webExtensionTelemetry.sendExtensionInitQueryParametersTelemetry(
            queryParamsMap
        );

        //Assert
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            telemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
            properties
        );
    });

    it("sendErrorTelemetry_whenErrorMessagePassed_shouldCallSendTelemetryExceptionWithGivenError", () => {
        //Action
        const eventName = "update";

        const errorMessage = "not a valid Id";
        const sendTelemetryException = stub(
            telemetry,
            "sendTelemetryException"
        );
        const properties = {
            eventName: eventName,
        };

        //Act
        webExtensionTelemetry.sendErrorTelemetry(eventName, errorMessage);

        //Assert
        const error: Error = new Error(errorMessage);
        assert.calledOnce(sendTelemetryException);

        const sendTelemetryExceptionCalls =
            sendTelemetryException.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(error);
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(properties);
    });

    it("sendErrorTelemetry_whenErrorMessageNotPassed_shouldCallSendTelemetryExceptionWithNewError", () => {
        //Action
        const eventName = "update";

        const sendTelemetryException = stub(
            telemetry,
            "sendTelemetryException"
        );
        const properties = {
            eventName: eventName,
        };
        //Act
        webExtensionTelemetry.sendErrorTelemetry(eventName);
        //Assert

        assert.calledOnce(sendTelemetryException);

        const sendTelemetryExceptionCalls =
            sendTelemetryException.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(new Error());
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(properties);
    });

    it("sendInfoTelemetry_whenPropertiesIsPassed_shouldCallSendTelemetryEvent", () => {
        //Act
        const eventName = "update";
        const properties = {
            eventName: eventName,
        };
        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");

        //Action

        webExtensionTelemetry.sendInfoTelemetry(eventName, properties);

        //Assert
        assert.calledOnceWithExactly(sendTelemetryEvent, eventName, properties);
    });

    it("sendInfoTelemetry_whenPropertiesIsPassed_shouldCallSendTelemetryEvent", () => {
        //Act
        const eventName = "update";
        const properties = undefined;
        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");

        //Action

        webExtensionTelemetry.sendInfoTelemetry(eventName);

        //Assert
        assert.calledOnceWithExactly(sendTelemetryEvent, eventName, properties);
    });

    it("sendAPITelemetry_whenErrorMessageIsPassed_shouldCallsendTelemetryException", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const isSuccessful = true;
        const duration = 4;
        const errorMessage = "this is error";
        const eventName = "update";

        const sendTelemetryException = stub(
            telemetry,
            "sendTelemetryException"
        );

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            eventName: "update",
            isSuccessful: "true",
        };

        //Action

        webExtensionTelemetry.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            "sendAPITelemetry_whenErrorMessageIsPassed_shouldCallsendTelemetryException",
            entityFileExtensionType, // TODO: Pass these as function properties parameters
            isSuccessful,
            duration,
            errorMessage,
            eventName
        );

        const measurements = {
            durationInMillis: duration,
        };
        //Assert
        const error: Error = new Error(errorMessage);
        assert.calledOnce(sendTelemetryException);

        const sendTelemetryExceptionCalls =
            sendTelemetryException.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(error);
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(properties);
        expect(sendTelemetryExceptionCalls.args[2]).deep.eq(measurements);
    });

    it("sendAPITelemetry_whenErrorMessageNotPassed_shouldCallsendTelemetryException", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const isSuccessful = true;
        const duration = 4;
        const errorMessage = "";
        const eventName = "update";

        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "true",
        };

        //Action

        webExtensionTelemetry.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            "sendAPITelemetry_whenErrorMessageNotPassed_shouldCallsendTelemetryException",
            entityFileExtensionType, // TODO: Pass these as function properties parameters
            isSuccessful,
            duration,
            errorMessage,
            eventName
        );

        const measurements = {
            durationInMillis: duration,
        };
        //Assert
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            eventName,
            properties,
            measurements
        );
    });

    it("sendAPITelemetry_whenIsSuccessfulAndDurationIsUndefined_shouldSetDurationInMillisAs0orIsSuccessfulAsBlankString", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const isSuccessful = undefined;
        const duration = undefined;
        const errorMessage = "";
        const eventName = "update";

        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "",
        };

        //Action

        webExtensionTelemetry.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            "sendAPITelemetry_whenIsSuccessfulAndDurationIsUndefined_shouldSetDurationInMillisAs0orIsSuccessfulAsBlankString",
            entityFileExtensionType, // TODO: Pass these as function properties parameters
            isSuccessful,
            duration,
            errorMessage,
            eventName
        );

        const measurements = {
            durationInMillis: 0,
        };
        //Assert
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            eventName,
            properties,
            measurements
        );
    });

    it("sendAPITelemetry_whenIsSuccessfulIsFalse_shouldSetIsSuccessfulAsFalse", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const isSuccessful = false;
        const duration = undefined;
        const errorMessage = "";
        const eventName = "update";

        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "false",
        };

        //Action
        webExtensionTelemetry.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            "sendAPITelemetry_whenIsSuccessfulIsFalse_shouldSetIsSuccessfulAsFalse",
            entityFileExtensionType, // TODO: Pass these as function properties parameters
            isSuccessful,
            duration,
            errorMessage,
            eventName
        );

        const measurements = {
            durationInMillis: 0,
        };
        //Assert
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            eventName,
            properties,
            measurements
        );
    });

    it("sendAPISuccessTelemetry_whenCall_shouldCallSendAPITelemetryWithoutErrorMessage", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const duration = 3;
        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");
        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "true",
        };

        const measurements = {
            durationInMillis: duration,
        };

        //Action
        webExtensionTelemetry.sendAPISuccessTelemetry(
            URL,
            entity,
            httpMethod,
            duration,
            entityFileExtensionType
        );

        //Assert
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            telemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS,
            properties,
            measurements
        );
    });

    it("sendAPIFailureTelemetry_withErrorMessage_shouldCallSendTelemetryException", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const duration = 3;
        const errorMessage = "this is error message";
        const sendTelemetryException = stub(
            telemetry,
            "sendTelemetryException"
        );
        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            eventName: telemetryEventNames.WEB_EXTENSION_API_REQUEST_FAILURE,
            isSuccessful: "false",
        };

        const measurements = {
            durationInMillis: duration,
        };

        //Action
        webExtensionTelemetry.sendAPIFailureTelemetry(
            URL,
            entity,
            httpMethod,
            duration,
            "sendAPIFailureTelemetry_withErrorMessage_shouldCallSendTelemetryException",
            errorMessage,
            entityFileExtensionType
        );

        //Assert
        const error: Error = new Error(errorMessage);
        assert.calledOnce(sendTelemetryException);

        const sendTelemetryExceptionCalls =
            sendTelemetryException.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(error);
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(properties);
        expect(sendTelemetryExceptionCalls.args[2]).deep.eq(measurements);
    });

    it("sendPerfTelemetry_whenSendProperValues_shouldCallWithAllValidData", () => {
        //Act
        const eventName = telemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS;
        const duration = 3;
        const sendTelemetryEvent = stub(telemetry, "sendTelemetryEvent");

        //Action
        webExtensionTelemetry.sendPerfTelemetry(eventName, duration);

        //Assert
        const measurements = {
            durationInMillis: 3,
        };
        assert.calledOnceWithExactly(
            sendTelemetryEvent,
            telemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS,
            undefined,
            measurements
        );
    });
});
