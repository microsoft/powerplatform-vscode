/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// This module represents types with parallels in the BatchedTelemetry libraries found in the CRM.DevToolsCore repo.

export interface IAppTelemetryEnvironment {
    readonly optOut?: boolean;
    readonly developerMode?: boolean;
    readonly dataBoundary?: string;
    readonly automationAgent?: string;
}

export interface ITelemetryUserSettings {
    readonly uniqueId: string;
    readonly telemetryEnabled?: boolean;
}

export interface ITelemetryUserSettingsProvider {
    GetCurrent(): ITelemetryUserSettings;
}
