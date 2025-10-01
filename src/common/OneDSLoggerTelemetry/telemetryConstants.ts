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

export const EndpointUrls = {
    INTERNAL: 'https://self.pipe.aria.int.microsoft.com/OneCollector/1.0/',
    US: 'https://us-mobile.events.data.microsoft.com/OneCollector/1.0/',
    EU: 'https://eu-mobile.events.data.microsoft.com/OneCollector/1.0/',
    GOV_AND_HIGH: 'https://tb.events.data.microsoft.com/OneCollector/1.0/',
    DOD: 'https://pf.events.data.microsoft.com/OneCollector/1.0/',
    MOONCAKE: 'https://collector.azure.cn/OneCollector/1.0/'
} as const;

export const InstrumentationKeys = {
    INTERNAL: 'ffdb4c99ca3a4ad5b8e9ffb08bf7da0d-65357ff3-efcd-47fc-b2fd-ad95a52373f4-7402',
    US_AND_EU: '197418c5cb8c4426b201f9db2e87b914-87887378-2790-49b0-9295-51f43b6204b1-7172',
    GOV: '47d84c9b995341e19219d73ab0c6bcd2-e951660d-d17d-4de3-83c3-6a766bd23de8-7007',
    HIGH: '4a07e143372c46aabf3841dc4f0ef795-a753031e-2005-4282-9451-a086fea4234a-6942',
    DOD: 'af47f3d608774379a53fa07cf36362ea-69701588-1aad-43ee-8b52-f71125849774-6656',
    MOONCAKE: 'f9b6e63b5e394453ba8f58f7a7b9aea7-f38fcfa2-eb34-48bc-9ae2-61fba4abbd39-7390'
} as const;
