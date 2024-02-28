/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import TelemetryReporter from "@vscode/extension-telemetry";
import { AppInsightsResource } from "../../../common/pp-tooling-telemetry-node/AppInsightsResource";
import { queryParameters } from "../common/constants";
import { sanitizeURL } from "../utilities/urlBuilderUtil";
import { telemetryEventNames } from "./constants";
import { IPortalWebExtensionInitQueryParametersTelemetryData, IWebExtensionAPITelemetryData, IWebExtensionExceptionTelemetryData, IWebExtensionInitPathTelemetryData, IWebExtensionPerfTelemetryData } from "./webExtensionTelemetryInterface";
import { isNullOrUndefined } from '../utilities/commonUtil';
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

export class WebExtensionTelemetry {
    private _telemetry: TelemetryReporter | undefined;

    setTelemetryReporter(extensionId: string, extensionVersion: string, appInsightsResource: AppInsightsResource) {
        this._telemetry = new TelemetryReporter(extensionId, extensionVersion, appInsightsResource.instrumentationKey);
    }

    getTelemetryReporter() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this._telemetry!;
    }

    public sendExtensionInitPathParametersTelemetry(appName: string | undefined, entity: string | undefined, entityId: string | undefined) {
        const telemetryData: IWebExtensionInitPathTelemetryData = {
            eventName: telemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
            properties: {
                appName: this.getPathParameterValue(appName),
            }
        }

        if (entity && entityId) {
            telemetryData.properties.entity = this.getPathParameterValue(entity),
            telemetryData.properties.entityId = this.getPathParameterValue(entityId)
        }

        this._telemetry?.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties);
        oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, telemetryData.properties);
    }

    public sendExtensionInitQueryParametersTelemetry(queryParamsMap: Map<string, string>) {
        const telemetryData: IPortalWebExtensionInitQueryParametersTelemetryData = {
            eventName: telemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
            properties: {
                orgId: queryParamsMap.get(queryParameters.ORG_ID),
                tenantId: queryParamsMap.get(queryParameters.TENANT_ID),
                portalId: queryParamsMap.get(queryParameters.PORTAL_ID),
                websiteId: queryParamsMap.get(queryParameters.WEBSITE_ID),
                dataSource: queryParamsMap.get(queryParameters.DATA_SOURCE),
                schema: queryParamsMap.get(queryParameters.SCHEMA),
                referrerSessionId: queryParamsMap.get(queryParameters.REFERRER_SESSION_ID),
                referrer: queryParamsMap.get(queryParameters.REFERRER),
                siteVisibility: queryParamsMap.get(queryParameters.SITE_VISIBILITY),
                region: queryParamsMap.get(queryParameters.REGION),
                geo: queryParamsMap.get(queryParameters.GEO),
                envId: queryParamsMap.get(queryParameters.ENV_ID),
                referrerSource: queryParamsMap.get(queryParameters.REFERRER_SOURCE)
            }
        }

        if (queryParamsMap.has(queryParameters.ENTITY) && queryParamsMap.has(queryParameters.ENTITY_ID)) {
            telemetryData.properties.entity = queryParamsMap.get(queryParameters.ENTITY);
            telemetryData.properties.entityId = queryParamsMap.get(queryParameters.ENTITY_ID);
        }

        this._telemetry?.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties);
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
            this._telemetry?.sendTelemetryException(error, telemetryData.properties);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            oneDSLoggerWrapper.getLogger().traceError(eventName, errorMessage!, error, telemetryData.properties);
        } else {
            this._telemetry?.sendTelemetryException(new Error(), telemetryData.properties);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            oneDSLoggerWrapper.getLogger().traceError(eventName, errorMessage!, new Error(), telemetryData.properties);
        }
    }

    public sendInfoTelemetry(eventName: string, properties?: Record<string, string>) {
        this._telemetry?.sendTelemetryEvent(eventName, properties);
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

        eventName = eventName ?? telemetryEventNames.WEB_EXTENSION_API_REQUEST;

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
            this._telemetry?.sendTelemetryException(error, { ...telemetryData.properties, eventName: eventName }, telemetryData.measurements);
            oneDSLoggerWrapper.getLogger().traceError(eventName, errorMessage, error, telemetryData.properties, telemetryData.measurements);
        } else {
            this._telemetry?.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties, telemetryData.measurements);
            oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, telemetryData.properties,  telemetryData.measurements);
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
            !isNullOrUndefined(eventName) ? eventName : telemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS,
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
            !isNullOrUndefined(eventName) ? eventName : telemetryEventNames.WEB_EXTENSION_API_REQUEST_FAILURE,
            status);
    }

    public sendPerfTelemetry(eventName: string, duration: number) {
        const telemetryData: IWebExtensionPerfTelemetryData = {
            eventName: eventName,
            measurements: {
                durationInMillis: (duration) ? duration : 0
            }
        }
        this._telemetry?.sendTelemetryEvent(telemetryData.eventName, undefined, telemetryData.measurements);
        oneDSLoggerWrapper.getLogger().traceInfo(telemetryData.eventName, undefined, telemetryData.measurements);
    }

    private getPathParameterValue(parameter: string | undefined | null): string {
        return (parameter) ? parameter : '';
    }
}
