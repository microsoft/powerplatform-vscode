/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAppTelemetryEnvironment, ITelemetryUserSettings, ITelemetryUserSettingsProvider } from "./interfaces";
import { TelemetryUserSettingsFileProvider } from "./TelemetryUserSettingsFileProvider";
import { parseBooleanEnvironmentVariable } from "./AppTelemetryUtility";
import { EnvironmentVariableNames } from './TelemetryConstants';
import * as process from 'process';

import path = require('path');
import os = require('os');
import uuid = require('uuid');

export function createGlobalTelemetryEnvironment(getEnvironmentVariable: (name: string) => string | undefined = getEnvironmentVariableFromProcess): IAppTelemetryEnvironment {
    return {
        optOut: parseBooleanEnvironmentVariable(getEnvironmentVariable(EnvironmentVariableNames.PpToolsTelemetryOptOut)),
        developerMode: parseBooleanEnvironmentVariable(getEnvironmentVariable(EnvironmentVariableNames.PpToolsTelemetryDeveloperMode)),
        dataBoundary: getEnvironmentVariable(EnvironmentVariableNames.PpToolsTelemetryDataBoundary),
        automationAgent: getEnvironmentVariable(EnvironmentVariableNames.PpToolsAutomationAgent),
    };
}

function getEnvironmentVariableFromProcess(name: string): string | undefined {
    return process.env[name];
}

export function getUserSettingsFromSharedInstall(logger?: Console): ITelemetryUserSettings {
    const userSettingsPath = path.join(getAppDataPath(), 'Microsoft', 'PowerAppsCli', 'usersettings.json');
    const userSettingsProvider = new TelemetryUserSettingsFileProvider(userSettingsPath);
    return getCurrentUserSettingsOrDefault(userSettingsProvider, logger);
}

function getAppDataPath(): string {
    const platform = os.platform();
    switch (platform) {
        case 'darwin':
            return '~/Library/';
        case 'linux':
            return `${process.env.HOME}/.config/`;
        case 'win32':
            return process.env.LOCALAPPDATA as string;
        default:
            throw new Error(`Platform "${platform}" is not currently supported`);
    }
}

function getCurrentUserSettingsOrDefault(provider: ITelemetryUserSettingsProvider, logger?: Console): ITelemetryUserSettings {
    try {
        return provider.GetCurrent();
    } catch (error) {
        logger?.error(`[pp-tooling-telemetry-node]: ITelemetryUserSettingsProvider.GetCurrent threw unexpected error. Returning new user settings. Error: ${error}`);

        return {
            uniqueId: uuid.v4(),
            telemetryEnabled: true,
        };
    }
}
