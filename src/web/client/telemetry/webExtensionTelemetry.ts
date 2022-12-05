/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import TelemetryReporter from "@vscode/extension-telemetry";
import { queryParameters } from "../common/constants";
import { sanitizeURL } from "../utilities/urlBuilderUtil";
import { telemetryEventNames } from "./constants";

let _telemetry: TelemetryReporter | undefined;
export interface IPortalWebExtensionInitQueryParametersTelemetryData extends IWebExtensionTelemetryData {
    eventName: string,
    properties: {
        'orgId'?: string;
        'tenantId'?: string;
        'websiteId'?: string;
        'portalId'?: string;
        'dataSource'?: string;
        'schema'?: string;
        'referrerSessionId'?: string;
        'referrer'?: string;
        'siteVisibility'?: string;
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
        'entity': string;
        'httpMethod': string;
        'entityFileExtensionType'?: string;
        'isSuccessful'?: string;
    },
    measurements: {
        'durationInMillis': number;
    }
}

export interface IWebExtensionExceptionTelemetryData extends IWebExtensionTelemetryData {
    properties: {
        'eventName': string;
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
            orgId: getQueryParameterValue(queryParameters.ORG_ID, searchParams),
            tenantId: getQueryParameterValue(queryParameters.TENANT_ID, searchParams),
            portalId: getQueryParameterValue(queryParameters.PORTAL_ID, searchParams),
            websiteId: getQueryParameterValue(queryParameters.WEBSITE_ID, searchParams),
            dataSource: getQueryParameterValue(queryParameters.DATA_SOURCE, searchParams),
            schema: getQueryParameterValue(queryParameters.SCHEMA, searchParams),
            referrerSessionId: getQueryParameterValue(queryParameters.REFERRER_SESSION_ID, searchParams),
            referrer: getQueryParameterValue(queryParameters.REFERRER, searchParams),
            siteVisibility: getQueryParameterValue(queryParameters.SITE_VISIBILITY, searchParams),
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
    const telemetryData: IWebExtensionExceptionTelemetryData = {
        properties: {
            eventName: eventName
        }
    }
    if (errorMessage) {
        const error: Error = new Error(errorMessage);
        _telemetry?.sendTelemetryException(error, telemetryData.properties);
    } else {
        _telemetry?.sendTelemetryException(new Error(), telemetryData.properties);
    }
}

export function sendInfoTelemetry(eventName: string, properties?: Record<string, string>) {
    _telemetry?.sendTelemetryEvent(eventName, properties);
}

export function sendAPITelemetry(
    URL: string,
    entity: string,
    httpMethod: string,
    entityFileExtensionType?: string, // TODO: Pass these as function properties parameters
    isSuccessful?: boolean,
    duration?: number,
    errorMessage?: string,
    eventName?: string) {
    eventName = eventName ?? telemetryEventNames.WEB_EXTENSION_API_REQUEST;

    const telemetryData: IWebExtensionAPITelemetryData = {
        eventName: eventName,
        properties: {
            url: sanitizeURL(URL),
            entity: entity,
            httpMethod: httpMethod,
            entityFileExtensionType: entityFileExtensionType,
            isSuccessful: (isSuccessful === undefined) ? "" : (isSuccessful ? "true" : "false")
        },
        measurements: {
            durationInMillis: (duration) ? duration : 0
        }
    }
    if (errorMessage) {
        const error: Error = new Error(errorMessage);
        _telemetry?.sendTelemetryException(error, { ...telemetryData.properties, eventName: eventName }, telemetryData.measurements);
    } else {
        _telemetry?.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties, telemetryData.measurements);
    }
}

export function sendAPISuccessTelemetry(URL: string, entity: string, httpMethod: string, duration: number) {
    sendAPITelemetry(URL, entity, httpMethod, undefined, true, duration, undefined, telemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS);
}

export function sendAPIFailureTelemetry(URL: string, entity: string, httpMethod: string, duration: number, errorMessage?: string) {
    sendAPITelemetry(URL, entity, httpMethod, undefined, false, duration, errorMessage, telemetryEventNames.WEB_EXTENSION_API_REQUEST_FAILURE);
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
