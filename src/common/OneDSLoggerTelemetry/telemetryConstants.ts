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
