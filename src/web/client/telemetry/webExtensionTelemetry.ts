/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import TelemetryReporter from "@vscode/extension-telemetry";
import { queryParameters, telemetryEventNames } from "../common/constants";

let _telemetry: TelemetryReporter | undefined;
export interface IPortalWebExtensionInitQueryParametersTelemetryData extends IWebExtensionTelemetryData {
    eventName: string,
    properties: {
        'orgUrl'?: string;
        'orgId'?: string;
        'tenantId'?: string;
        'websiteId'?: string;
        'portalUrl'?: string;
        'portalId'?: string;
        'dataSource'?: string;
        'schema'?: string;
        'referrerSessionId'?: string;
        'referrer'?: string;
    }
}

export interface IWebExtensionInitPathTelemetryData extends IWebExtensionTelemetryData {
    eventName: string,
    properties: {
        'appName': string;
        'entity'?: string;
        'entityId'?: string;
    }
}

export interface IWebExtensionAPITelemetryData extends IWebExtensionTelemetryData {
    eventName: string,
    properties: {
        'url': string;
        'isSuccessful'?: string;
    },
    measurements: {
        'durationInMillis': number;
    }
}

export interface IWebExtensionPerfTelemetryData extends IWebExtensionTelemetryData {
    eventName: string,
    measurements: {
        'durationInMillis': number;
    }
}

export interface IWebExtensionTelemetryData {
    properties?: Record<string, string>;
    measurements?: Record<string, number>;
}

export function setTelemetryReporter(telemetry: TelemetryReporter) {
    _telemetry = telemetry;
}

export function sendExtensionInitPathParametersTelemetry(appName: string | undefined, entity: string | undefined, entityId: string | undefined) {
    const telemetryData: IWebExtensionInitPathTelemetryData = {
        eventName: telemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
        properties: {
            appName: getPathParameterValue(appName),
            entity: getPathParameterValue(entity),
            entityId: getPathParameterValue(entityId)
        }
    }
    _telemetry?.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties);
}

export function sendExtensionInitQueryParametersTelemetry(searchParams: URLSearchParams | undefined | null) {
    const telemetryData: IPortalWebExtensionInitQueryParametersTelemetryData = {
        eventName: telemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
        properties: {
            orgUrl: getQueryParameterValue(queryParameters.ORG_URL, searchParams),
            orgId: getQueryParameterValue(queryParameters.ORG_ID, searchParams),
            tenantId: getQueryParameterValue(queryParameters.TENANT_ID, searchParams),
            portalUrl: getQueryParameterValue(queryParameters.PORTAL_URL, searchParams),
            portalId: getQueryParameterValue(queryParameters.PORTAL_ID, searchParams),
            websiteId: getQueryParameterValue(queryParameters.WEBSITE_ID, searchParams),
            dataSource: getQueryParameterValue(queryParameters.DATA_SOURCE, searchParams),
            schema: getQueryParameterValue(queryParameters.SCHEMA, searchParams),
            referrerSessionId: getQueryParameterValue(queryParameters.REFERRER_SESSION_ID, searchParams),
            referrer: getQueryParameterValue(queryParameters.REFERRER, searchParams)
        }
    }
    _telemetry?.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties);
}

export function getPathParameterValue(parameter: string | undefined | null): string {
    return (parameter) ? parameter : '';
}

export function getQueryParameterValue(parameter: string, searchParams: URLSearchParams | undefined | null): string {
    if (searchParams) {
        const queryParams = new URLSearchParams(searchParams);
        const paramValue = queryParams.get(parameter);
        return (paramValue) ? paramValue : '';
    }
    else {
        return '';
    }
}

export function sendErrorTelemetry(eventName: string, errorMessage?: string) {
    if (errorMessage) {
        const errorMessages: string[] = [];
        errorMessages.push(errorMessage);
        _telemetry?.sendTelemetryErrorEvent(eventName, undefined, undefined, errorMessages);
    } else {
        _telemetry?.sendTelemetryErrorEvent(eventName);
    }
}

export function sendAPITelemetry(URL: string, isSuccessful?: boolean, duration?: number, errorMessage?: string, eventName?: string) {
    const telemetryData: IWebExtensionAPITelemetryData = {
        eventName: eventName ? eventName : telemetryEventNames.WEB_EXTENSION_API_REQUEST,
        properties: {
            url: URL,
            isSuccessful: (isSuccessful === undefined) ? "" : (isSuccessful ? "true" : "false")
        },
        measurements: {
            durationInMillis: (duration) ? duration : 0
        }
    }
    if (errorMessage) {
        const errorMessages: string[] = [];
        errorMessages.push(errorMessage);
        _telemetry?.sendTelemetryErrorEvent(telemetryData.eventName, telemetryData.properties, telemetryData.measurements, errorMessages);
    } else {
        _telemetry?.sendTelemetryErrorEvent(telemetryData.eventName, telemetryData.properties, telemetryData.measurements);
    }
}

export function sendAPISuccessTelemetry(URL: string, duration: number) {
    sendAPITelemetry(URL, true, duration, undefined, telemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS);
}

export function sendAPIFailureTelemetry(URL: string, duration: number, errorMessage?: string) {
    sendAPITelemetry(URL, false, duration, errorMessage, telemetryEventNames.WEB_EXTENSION_API_REQUEST_FAILURE);
}

export function sendPerfTelemetry(eventName: string, duration: number) {
    const telemetryData: IWebExtensionPerfTelemetryData = {
        eventName: eventName,
        measurements: {
            durationInMillis: (duration) ? duration : 0
        }
    }
    _telemetry?.sendTelemetryEvent(telemetryData.eventName, undefined, telemetryData.measurements);
}
