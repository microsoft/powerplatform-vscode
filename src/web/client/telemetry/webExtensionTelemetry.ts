/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import TelemetryReporter from "@vscode/extension-telemetry";
import { queryParameters, telemetryEventNames } from "../common/constants";

export function sendExtensionInitTelemetryEvents(args: webExtensionParameters, _telemetry: TelemetryReporter) {
    const { appName, entity, entityId, searchParams } = args;
    const telemetryData : IPortalWebExtensionInitTelemetryData = {
        eventName: telemetryEventNames.PORTAL_WEB_EXTENSION_INIT_DATA,
        properties: {
            appName: getPathParameter(appName)
        }
    }
    telemetryData.properties.entity = getPathParameter(entity);
    telemetryData.properties.entityId = getPathParameter(entityId);
    telemetryData.properties.orgUrl = getQueryParameter(queryParameters.ORG_URL, searchParams);
    telemetryData.properties.websiteId = getQueryParameter(queryParameters.WEBSITE_ID, searchParams);
    telemetryData.properties.schema = getQueryParameter(queryParameters.SCHEMA, searchParams);
    telemetryData.properties.dataSource = getQueryParameter(queryParameters.DATA_SOURCE, searchParams);
    telemetryData.properties.referrerSessionId = getQueryParameter(queryParameters.REFERRER_SESSION_ID, searchParams);
    telemetryData.properties.referrer = getQueryParameter(queryParameters.REFERRER, searchParams);

    _telemetry.sendTelemetryEvent(telemetryData.eventName, telemetryData.properties);
}

export function getPathParameter(parameter: string|undefined|null): string {
    return (parameter)? parameter : '';
}

export function getQueryParameter(parameter: string, searchParams: URLSearchParams|undefined|null): string {
    if (searchParams) {
        const queryParams = new URLSearchParams(searchParams);
        const paramValue = queryParams.get(parameter);
        return (paramValue)? paramValue: '';
    }
    else {
        return '';
    }
}

export interface webExtensionParameters {
    appName?: string;
    entity?: string;
    entityId?: string;
    searchParams?: URLSearchParams;
}

export interface IPortalWebExtensionInitTelemetryData extends IWebExtensionInitTelemetryData {
    eventName: string,
    properties: {
        'appName': string;
        'entity'?: string;
        'entityId'?: string;
        'orgUrl'?: string;
        'websiteId'?: string;
        'dataSource'?: string;
        'schema'?: string;
        'referrerSessionId'?: string;
        'referrer'?: string;
    }
}

export interface IWebExtensionInitTelemetryData {
    properties?: Record<string, string>;
}
