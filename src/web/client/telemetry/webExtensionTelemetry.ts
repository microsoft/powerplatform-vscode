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
        'websiteId'?: string;
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
    }
}

export interface IWebExtensionTelemetryData {
    properties?: Record<string, string>;
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

export function sendAPITelemetry(URL: string, isSuccessful?: boolean, errorMessage?: string, eventName?: string) {
    const telemetryData: IWebExtensionAPITelemetryData = {
        eventName: eventName ? eventName : telemetryEventNames.WEB_EXTENSION_API_REQUEST,
        properties: {
            url: URL,
            isSuccessful: (isSuccessful === undefined) ? "" : (isSuccessful ? "true" : "false")
        }
    }
    if (errorMessage) {
        const errorMessages: string[] = [];
        errorMessages.push(errorMessage);
        _telemetry?.sendTelemetryErrorEvent(telemetryData.eventName, telemetryData.properties, undefined, errorMessages);
    } else {
        _telemetry?.sendTelemetryErrorEvent(telemetryData.eventName, telemetryData.properties);
    }
}

export function sendAPISuccessTelemetry(URL: string) {
    sendAPITelemetry(URL, true, undefined, telemetryEventNames.WEB_EXTENSION_API_REQUEST_SUCCESS);
}

export function sendAPIFailureTelemetry(URL: string, errorMessage?: string) {
    sendAPITelemetry(URL, false, errorMessage, telemetryEventNames.WEB_EXTENSION_API_REQUEST_FAILURE);
}
