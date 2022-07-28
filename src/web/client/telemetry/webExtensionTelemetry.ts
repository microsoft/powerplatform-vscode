/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import TelemetryReporter from "@vscode/extension-telemetry";
import { queryParameters, telemetryEventNames } from "../common/constants";

export function sendExtensionInitPathParametersTelemetry(appName: string | undefined, entity: string | undefined, entityId: string | undefined, _telemetry: TelemetryReporter) {
    const telemetryData: IWebExtensionInitPathTelemetryData = {
        eventName: telemetryEventNames.WEB_EXTENSION_INIT_PATH_PARAMETERS,
        properties: {
            appName: getPathParameter(appName),
            entity: getPathParameter(entity),
            entityId: getPathParameter(entityId)
        }
    }
    _telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties);
}

export function sendExtensionInitQueryParametersTelemetry(searchParams: URLSearchParams | undefined | null, _telemetry: TelemetryReporter) {
    const telemetryData: IPortalWebExtensionInitQueryParametersTelemetryData = {
        eventName: telemetryEventNames.WEB_EXTENSION_INIT_QUERY_PARAMETERS,
        properties: {
            orgUrl: getQueryParameter(queryParameters.ORG_URL, searchParams),
            websiteId: getQueryParameter(queryParameters.WEBSITE_ID, searchParams),
            dataSource: getQueryParameter(queryParameters.DATA_SOURCE, searchParams),
            schema: getQueryParameter(queryParameters.SCHEMA, searchParams),
            referrerSessionId: getQueryParameter(queryParameters.REFERRER_SESSION_ID, searchParams),
            referrer: getQueryParameter(queryParameters.REFERRER, searchParams)
        }
    }
    _telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties);
}

export function getPathParameter(parameter: string | undefined | null): string {
    return (parameter) ? parameter : '';
}

export function getQueryParameter(parameter: string, searchParams: URLSearchParams | undefined | null): string {
    if (searchParams) {
        const queryParams = new URLSearchParams(searchParams);
        const paramValue = queryParams.get(parameter);
        return (paramValue) ? paramValue : '';
    }
    else {
        return '';
    }
}

export interface IPortalWebExtensionInitQueryParametersTelemetryData extends IWebExtensionInitTelemetryData {
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

export interface IWebExtensionInitPathTelemetryData extends IWebExtensionInitTelemetryData {
    eventName: string,
    properties: {
        'appName': string;
        'entity'?: string;
        'entityId'?: string;
    }
}

export interface IWebExtensionInitTelemetryData {
    properties?: Record<string, string>;
}
