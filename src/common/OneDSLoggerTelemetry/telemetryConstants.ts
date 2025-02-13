/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export enum EventType {
    CLICK = 'Click',
    CUSTOM = 'Custom',
    GENERAL = 'General',
    SCENARIO = 'Scenario',
    TRACE = 'Trace'
}

export enum Severity {
    DEBUG = 'Debug',
    INFO = 'Info',
    WARN = 'Warning',
    ERROR = 'Error'
}

export enum GeoNames {
    US = 'us',
    BR = 'br',
    UK = 'uk',
    JP = 'jp',
    IN = 'in',
    DE = 'de',
    AU = 'au',
    EU = 'eu',
    AS = 'as',
    CA = 'ca',
    ZA = 'za',
    FR = 'fr',
    AE = 'ae',
    CH = 'ch',
    NO = 'no',
    KR = 'kr'
}
// Custom telemetry feature flag
export const CUSTOM_TELEMETRY_FOR_POWER_PAGES_SETTING_NAME = 'enableTelemetry';

export const AUTH_KEYS = {
    USER_TYPE: 'Type:',
    CLOUD: 'Cloud:',
    TENANT_ID: 'Tenant Id:',
    TENANT_COUNTRY: 'Tenant Country:',
    USER: 'User:',
    ENTRA_ID_OBJECT_ID: 'Entra ID Object Id:',
    PUID: 'PUID:',
    USER_COUNTRY_REGION: 'User Country/Region:',
    TOKEN_EXPIRES: 'Token Expires:',
    AUTHORITY: 'Authority:',
    ENVIRONMENT_GEO: 'Environment Geo:',
    ENVIRONMENT_ID: 'Environment Id:',
    ENVIRONMENT_TYPE: 'Environment Type:',
    ORGANIZATION_ID: 'Organization Id:',
    ORGANIZATION_UNIQUE_NAME: 'Organization Unique Name:',
    ORGANIZATION_FRIENDLY_NAME: 'Organization Friendly Name:'
};
