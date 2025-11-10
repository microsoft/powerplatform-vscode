/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { queryParameters } from "../common/constants";
import { sanitizeURL } from "../utilities/urlBuilderUtil";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { IPortalWebExtensionInitQueryParametersTelemetryData, IWebExtensionAPITelemetryData, IWebExtensionExceptionTelemetryData, IWebExtensionInitPathTelemetryData, IWebExtensionPerfTelemetryData } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryInterface";
import { getEnvironmentIdFromUrl, isNullOrUndefined } from '../utilities/commonUtil';
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

export class WebExtensionTelemetry {

    public sendExtensionInitPathParametersTelemetry(appName: string | undefined, entity: string | undefined, entityId: string | undefined) {
        const telemetryData: IWebExtensionInitPathTelemetryData = {
            eventName: webExtensionTelemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
            properties: {
                appName: this.getPathParameterValue(appName),
            }
        }

        if (entity && entityId) {
            telemetryData.properties.entity = this.getPathParameterValue(entity),
                telemetryData.properties.entityId = this.getPathParameterValue(entityId)
        }

        oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, telemetryData.properties);
    }

    public sendExtensionInitQueryParametersTelemetry(queryParamsMap: Map<string, string>) {
        const telemetryData: IPortalWebExtensionInitQueryParametersTelemetryData = {
            eventName: webExtensionTelemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
            properties: {
                orgId: queryParamsMap.get(queryParameters.ORG_ID),
                portalId: queryParamsMap.get(queryParameters.PORTAL_ID),
                referrerSessionId: queryParamsMap.get(queryParameters.REFERRER_SESSION_ID),
                referrer: queryParamsMap.get(queryParameters.REFERRER),
                geo: queryParamsMap.get(queryParameters.GEO),
                envId: getEnvironmentIdFromUrl(),
                referrerSource: queryParamsMap.get(queryParameters.REFERRER_SOURCE),
                sku: queryParamsMap.get(queryParameters.SKU)
            }
        }

        if (queryParamsMap.has(queryParameters.ENTITY) && queryParamsMap.has(queryParameters.ENTITY_ID)) {
            telemetryData.properties.entity = queryParamsMap.get(queryParameters.ENTITY);
            telemetryData.properties.entityId = queryParamsMap.get(queryParameters.ENTITY_ID);
        }

        oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, telemetryData.properties);
    }

    public sendErrorTelemetry(eventName: string, methodName: string, errorMessage?: string, error?: Error) {
        const telemetryData: IWebExtensionExceptionTelemetryData = {
            properties: {
                eventName: eventName,
                methodName: methodName
            }
        }
        if (error) {
            telemetryData.properties.errorMessage = errorMessage;
            telemetryData.properties.errorName = error.name;
            telemetryData.properties.stack = error.stack;
        }
        if (errorMessage || error) {
            const error: Error = new Error(errorMessage);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            oneDSLoggerWrapper.getLogger().traceError(eventName, errorMessage!, error, telemetryData.properties);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            oneDSLoggerWrapper.getLogger().traceError(eventName, errorMessage!, new Error(), telemetryData.properties);
        }
    }

    public sendInfoTelemetry(eventName: string, properties?: Record<string, string>) {
        oneDSLoggerWrapper.getLogger().traceInfo(eventName, properties);
    }

    public sendAPITelemetry(
        URL: string,
        entity: string,
        httpMethod: string,
        methodName: string,
        entityFileExtensionType?: string, // TODO: Pass these as function properties parameters
        isSuccessful?: boolean,
        duration?: number,
        errorMessage?: string,
        eventName?: string,
        status?: string) {

        eventName = eventName ?? webExtensionTelemetryEventNames.WEB_EXTENSION_API_REQUEST;

        const telemetryData: IWebExtensionAPITelemetryData = {
            eventName: eventName,
            properties: {
                url: sanitizeURL(URL),
                entity: entity,
                httpMethod: httpMethod,
                entityFileExtensionType: entityFileExtensionType,
                isSuccessful: (isSuccessful === undefined) ? "" : (isSuccessful ? "true" : "false"),
                status: status,
                methodName: methodName
            },
            measurements: {
                durationInMillis: (duration) ? duration : 0
            }
        }
        if (errorMessage) {
            const error: Error = new Error(errorMessage);
            oneDSLoggerWrapper.getLogger().traceError(eventName, errorMessage, error, telemetryData.properties, telemetryData.measurements);
        } else {
            oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, telemetryData.properties, telemetryData.measurements);
        }
    }

    public sendAPISuccessTelemetry(
        URL: string,
        entity: string,
        httpMethod: string,
        duration: number,
        methodName: string,
        eventName?: string,
        entityFileExtensionType?: string,
        status?: string
    ) {
        this.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            methodName,
            entityFileExtensionType,
            true,
            duration,
            undefined,
            !isNullOrUndefined(eventName) ? eventName : webExtensionTelemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS,
            status);
    }

    public sendAPIFailureTelemetry(
        URL: string,
        entity: string,
        httpMethod: string,
        duration: number,
        methodName: string,
        errorMessage?: string,
        entityFileExtensionType?: string, // TODO: Pass these as function properties parameters
        status?: string,
        eventName?: string
    ) {
        this.sendAPITelemetry(
            URL,
            entity,
            httpMethod,
            methodName,
            entityFileExtensionType,
            false,
            duration,
            errorMessage,
            !isNullOrUndefined(eventName) ? eventName : webExtensionTelemetryEventNames.WEB_EXTENSION_API_REQUEST_FAILURE,
            status);
    }

    public sendPerfTelemetry(eventName: string, duration: number) {
        const telemetryData: IWebExtensionPerfTelemetryData = {
            eventName: eventName,
            measurements: {
                durationInMillis: (duration) ? duration : 0
            }
        }
        oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, undefined, telemetryData.measurements);
    }

    private getPathParameterValue(parameter: string | undefined | null): string {
        return (parameter) ? parameter : '';
    }
}
