/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon, { stub, assert } from "sinon";
import { queryParameters } from "../../common/constants";
import { sanitizeURL } from "../../utilities/urlBuilderUtil";
import { webExtensionTelemetryEventNames } from "../../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { WebExtensionTelemetry } from "../../telemetry/webExtensionTelemetry";
import * as commonUtil from "../../utilities/commonUtil";
import { expect } from "chai";
import { oneDSLoggerWrapper } from "../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

describe("webExtensionTelemetry", () => {
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

    beforeEach(() => {
        traceInfoStub = sinon.stub();
        traceErrorStub = sinon.stub();

        sinon.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: traceInfoStub,
            traceWarning: sinon.stub(),
            traceError: traceErrorStub,
            featureUsage: sinon.stub()
        });
    });

    afterEach(() => {
        sinon.restore();
    });
    const webExtensionTelemetry = new WebExtensionTelemetry();

    it("sendExtensionInitPathParametersTelemetry_whenSendProperValues_shouldCallWithAllValidData", () => {
        //Act
        const appName: string | undefined = "PowerPages";
        const entity: string | undefined = "webpage";
        const entityId: string | undefined =
            "e5dce21c-f85f-4849-b699-920c0fad5fbf";

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
            traceInfoStub,
            webExtensionTelemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
            properties
        );
    });

    it("sendExtensionInitPathParametersTelemetry_whenSendundefined_shouldCallWithAllblank", () => {
        //Act
        const appName: string | undefined = undefined;
        const entity: string | undefined = undefined;
        const entityId: string | undefined = undefined;

        //Action
        webExtensionTelemetry.sendExtensionInitPathParametersTelemetry(
            appName,
            entity,
            entityId
        );

        //Assert
        const properties = {
            appName: "",
        };
        assert.calledOnceWithExactly(
            traceInfoStub,
            webExtensionTelemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
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
            [queryParameters.REGION, "NAM"],
            [queryParameters.GEO, "US"],
            [queryParameters.ENV_ID, "c4dc3686-1e6b-e428-b886-16cd0b9f4918"],
            [queryParameters.ENTITY, "webpage"],
            [
                queryParameters.ENTITY_ID,
                "e5dce21c-f85f-4849-b699-920c0fad5fbf",
            ],
            [queryParameters.REFERRER_SOURCE, "test"],
        ]);

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
            region: queryParamsMap.get(queryParameters.REGION),
            geo: queryParamsMap.get(queryParameters.GEO),
            envId: queryParamsMap.get(queryParameters.ENV_ID),
            entity: queryParamsMap.get(queryParameters.ENTITY),
            entityId: queryParamsMap.get(queryParameters.ENTITY_ID),
            referrerSource: queryParamsMap.get(queryParameters.REFERRER_SOURCE),
            sku: queryParamsMap.get(queryParameters.SKU),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        stub(commonUtil, "getEnvironmentIdFromUrl").returns(
            "c4dc3686-1e6b-e428-b886-16cd0b9f4918"
        );

        //Action
        webExtensionTelemetry.sendExtensionInitQueryParametersTelemetry(
            queryParamsMap
        );

        //Assert
        assert.calledOnceWithExactly(
            traceInfoStub,
            webExtensionTelemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
            properties
        );
    });

    it("sendExtensionInitQueryParametersTelemetry_whenQueryParamsMapIsEmpty_shouldNotThrowException", () => {
        //Act
        const queryParamsMap = new Map<string, string>([]);

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
            region: queryParamsMap.get(queryParameters.REGION),
            geo: queryParamsMap.get(queryParameters.GEO),
            envId: queryParamsMap.get(queryParameters.ENV_ID),
            referrerSource: queryParamsMap.get(queryParameters.REFERRER_SOURCE),
            sku: queryParamsMap.get(queryParameters.SKU),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;

        //Action
        webExtensionTelemetry.sendExtensionInitQueryParametersTelemetry(
            queryParamsMap
        );

        //Assert
        assert.calledOnceWithExactly(
            traceInfoStub,
            webExtensionTelemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
            properties
        );
    });

    it("sendErrorTelemetry_whenErrorMessagePassed_shouldCallSendTelemetryExceptionWithGivenError", () => {
        //Action
        const eventName = "update";
        const methodName = "triggeredMethod";

        const errorMessage = "not a valid Id";

        const properties = {
            eventName: eventName,
            methodName: methodName
        };

        //Act
        webExtensionTelemetry.sendErrorTelemetry(eventName, methodName, errorMessage);

        //Assert
        const error: Error = new Error(errorMessage);
        assert.calledOnce(traceErrorStub);

        const sendTelemetryExceptionCalls =
            traceErrorStub.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(eventName);
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(errorMessage);
        expect(sendTelemetryExceptionCalls.args[2]).deep.eq(error);
        expect(sendTelemetryExceptionCalls.args[3]).deep.eq(properties);
    });

    it("sendErrorTelemetry_whenErrorMessageNotPassed_shouldCallSendTelemetryExceptionWithNewError", () => {
        //Action
        const eventName = "update";
        const methodName = "triggeredMethod";

        const properties = {
            eventName: eventName,
            methodName: methodName
        };
        //Act
        webExtensionTelemetry.sendErrorTelemetry(eventName, methodName);
        //Assert

        assert.calledOnce(traceErrorStub);

        const sendTelemetryExceptionCalls =
            traceErrorStub.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(eventName);
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(undefined);
        expect(sendTelemetryExceptionCalls.args[2]).deep.eq(new Error());
        expect(sendTelemetryExceptionCalls.args[3]).deep.eq(properties);
    });

    it("sendInfoTelemetry_whenPropertiesIsPassed_shouldCallSendTelemetryEvent", () => {
        //Act
        const eventName = "update";
        const properties = {
            eventName: eventName,
        };

        //Action
        webExtensionTelemetry.sendInfoTelemetry(eventName, properties);

        //Assert
        assert.calledOnceWithExactly(traceInfoStub, eventName, properties);
    });

    it("sendInfoTelemetry_whenPropertiesIsPassed_shouldCallSendTelemetryEvent", () => {
        //Act
        const eventName = "update";
        const properties = undefined;

        //Action

        webExtensionTelemetry.sendInfoTelemetry(eventName);

        //Assert
        assert.calledOnceWithExactly(traceInfoStub, eventName, properties);
    });

    it("sendAPITelemetry_whenErrorMessageIsPassed_shouldCallSendTelemetryException", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const isSuccessful = true;
        const duration = 4;
        const errorMessage = "this is error";
        const eventName = "update";

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            methodName: "sendAPITelemetry_whenErrorMessageIsPassed_shouldCallSendTelemetryException",
            isSuccessful: "true",
            status: "200"
        };

        //Action

        webExtensionTelemetry.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            "sendAPITelemetry_whenErrorMessageIsPassed_shouldCallSendTelemetryException",
            entityFileExtensionType, // TODO: Pass these as function properties parameters
            isSuccessful,
            duration,
            errorMessage,
            eventName,
            "200"
        );

        const measurements = {
            durationInMillis: duration,
        };
        //Assert
        const error: Error = new Error(errorMessage);
        assert.calledOnce(traceErrorStub);

        const sendTelemetryExceptionCalls =
            traceErrorStub.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(eventName);
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(errorMessage);
        expect(sendTelemetryExceptionCalls.args[2]).deep.eq(error);
        expect(sendTelemetryExceptionCalls.args[3]).deep.eq(properties);
        expect(sendTelemetryExceptionCalls.args[4]).deep.eq(measurements);
    });

    it("sendAPITelemetry_whenErrorMessageNotPassed_shouldCallSendTelemetryException", () => {
        //Act
        const URL = "powerPages.com";
        const entity = "webPages";
        const httpMethod = "GET";
        const entityFileExtensionType = "adx";
        const isSuccessful = true;
        const duration = 4;
        const errorMessage = "";
        const eventName = "update";

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "true",
            status: "200",
            methodName: "sendAPITelemetry_whenErrorMessageNotPassed_shouldCallSendTelemetryException"
        };

        //Action

        webExtensionTelemetry.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            "sendAPITelemetry_whenErrorMessageNotPassed_shouldCallSendTelemetryException",
            entityFileExtensionType, // TODO: Pass these as function properties parameters
            isSuccessful,
            duration,
            errorMessage,
            eventName,
            "200"
        );

        const measurements = {
            durationInMillis: duration,
        };
        //Assert
        assert.calledOnceWithExactly(
            traceInfoStub,
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

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "",
            status: "200",
            methodName: "sendAPITelemetry_whenIsSuccessfulAndDurationIsUndefined_shouldSetDurationInMillisAs0orIsSuccessfulAsBlankString"
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
            eventName,
            "200"
        );

        const measurements = {
            durationInMillis: 0,
        };
        //Assert
        assert.calledOnceWithExactly(
            traceInfoStub,
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

        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "false",
            status: "200",
            methodName: "sendAPITelemetry_whenIsSuccessfulIsFalse_shouldSetIsSuccessfulAsFalse"
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
            eventName,
            "200"
        );

        const measurements = {
            durationInMillis: 0,
        };
        //Assert
        assert.calledOnceWithExactly(
            traceInfoStub,
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
        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "true",
            methodName: "sendAPISuccessTelemetry_whenCall_shouldCallSendAPITelemetryWithoutErrorMessage",
            status: "200"
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
            "sendAPISuccessTelemetry_whenCall_shouldCallSendAPITelemetryWithoutErrorMessage",
            "WebExtensionApiRequestSuccess",
            entityFileExtensionType,
            "200"
        );

        //Assert
        assert.calledOnceWithExactly(
            traceInfoStub,
            webExtensionTelemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS,
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
        const properties = {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: "false",
            status: "200",
            methodName: "sendAPIFailureTelemetry_withErrorMessage_shouldCallSendTelemetryException"
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
            entityFileExtensionType,
            "200"
        );

        //Assert
        const error: Error = new Error(errorMessage);
        assert.calledOnce(traceErrorStub);

        const sendTelemetryExceptionCalls =
            traceErrorStub.getCalls()[0];

        expect(sendTelemetryExceptionCalls.args[0]).deep.eq(webExtensionTelemetryEventNames.WEB_EXTENSION_API_REQUEST_FAILURE);
        expect(sendTelemetryExceptionCalls.args[1]).deep.eq(errorMessage);
        expect(sendTelemetryExceptionCalls.args[2]).deep.eq(error);
        expect(sendTelemetryExceptionCalls.args[3]).deep.eq(properties);
        expect(sendTelemetryExceptionCalls.args[4]).deep.eq(measurements);
    });

    it("sendPerfTelemetry_whenSendProperValues_shouldCallWithAllValidData", () => {
        //Act
        const eventName = webExtensionTelemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS;
        const duration = 3;

        //Action
        webExtensionTelemetry.sendPerfTelemetry(eventName, duration);

        //Assert
        const measurements = {
            durationInMillis: 3,
        };
        assert.calledOnceWithExactly(
            traceInfoStub,
            webExtensionTelemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS,
            undefined,
            measurements
        );
    });
});
