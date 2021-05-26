// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ExtensionContext } from "vscode";
import * as appInsights from 'applicationinsights';
import TelemetryReporter from 'vscode-extension-telemetry';
import { readUserSettings } from './localfileusersettings';

/**
 * Initializes a TelemetryReporter and completes it configuration to match our standardized tooling schema for App Insights.
 */
export function createTelemetryReporter(productName: string, context: ExtensionContext, key: string, sessionId: string): TelemetryReporter {
    const telemetry = new TelemetryReporter(context.extension.id, context.extension.packageJSON.version, key);

    // WARNING: currently, the TelemetryReporter doesn't expose its internal appInsightsClient.
    // For now, we're going to assume it's using the default client (which is true for the first time loading the extension if telemetry is enabled for VS Code)
    const client = appInsights.defaultClient;

    if (client) {
        // Setup default context (must be done after calling the ctor for the TelemetryReporter so we overwrite its defaults)
        const productVersion: string = context.extension.packageJSON.version;
        const userSettings = readUserSettings();

        // Note: TelemetryReporter sets the userId and sessionId according to the vscode environment.
        // but it also saves them to the commonProperties as the 'common.vscodemachineid' and 'common.vscodesessionid'.
        // We override the userId/sessionId to correlate with our tooling.
        client.context.tags[client.context.keys.userId] = userSettings.uniqueId;
        client.context.tags[client.context.keys.cloudRoleInstance] = '#####';
        client.context.tags[client.context.keys.cloudRole] = productName;
        client.context.tags[client.context.keys.applicationVersion] = productVersion;
        client.context.tags[client.context.keys.sessionId] = sessionId;

        // Note: we do not use the userSettings.telemetryEnabled for the extension, as we piggy back on the user's vscode settings (implemented by the TelemetryReporter).

        // TODO: Respond to the onDidChangeTelemetryEnabled event and have it call finishCreateAppInsightsClient too.
        // Unfortunately, we likely won't be able to capture its default client instance though.
        // Reference: TelemetryReporter.constructor
    }

    return telemetry;
}
