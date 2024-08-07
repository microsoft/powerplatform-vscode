/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


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
        'region'?: string;
        'geo'?: string;
        'envId'?: string;
        'entity'?: string;
        'entityId'?: string;
        'referrerSource'?: string;
        'sku'?: string;
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
        'status'?: string;
        'methodName'?: string;
    },
    measurements: {
        'durationInMillis': number;
    }
}

export interface IWebExtensionExceptionTelemetryData extends IWebExtensionTelemetryData {
    properties: {
        'eventName': string;
        'methodName': string;
        'errorMessage'?: string;
        'errorName'?: string;
        'stack'?: string
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
