/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { AppInsightsResourceProvider } from "./AppInsightsResourceProvider";
import { isSupportedAgentProductVersion } from "./AppTelemetryUtility";
import { IAppTelemetryEnvironment, ITelemetryUserSettings } from "./interfaces";
import * as appInsights from "applicationinsights";

export function setupAndStartAppInsights(
    appInsightsResourceProvider: AppInsightsResourceProvider,
    environment: IAppTelemetryEnvironment
): void {
    const appInsightsResource = appInsightsResourceProvider.GetAppInsightsResourceForDataBoundary(environment.dataBoundary);
    if (!appInsightsResource.connectionString) throw new Error(`AppInsightsResource missing connectionString. (dataBoundary: '${environment.dataBoundary}')`);

    appInsights.setup(appInsightsResource.connectionString)
        // suppress confusing DNS/http warnings if AI endpoints are not reachable
        .setInternalLogging(false, false)
        .setAutoCollectExceptions(false)
        .start();
}

export function configureTelemetryClient(
    aiClient: appInsights.TelemetryClient,
    productName: string,
    productVersion: string,
    sessionId: string,
    environment: IAppTelemetryEnvironment,
    userSettings: ITelemetryUserSettings
): void {
    if (!productName) throw new Error("productName must be specified.");
    if (!productVersion) throw new Error("productVersion must be specified.");
    if (!isSupportedAgentProductVersion(productVersion)) throw new Error(`productVersion '${productVersion}' is not a supported version format.`);
    if (!sessionId) throw new Error("sessionId must be specified.");

    aiClient.config.disableAppInsights = environment.optOut ?? !(userSettings.telemetryEnabled ?? true);

    // aka: ClientAppTelemetryInitializer.cs
    aiClient.context.tags[aiClient.context.keys.userId] = userSettings.uniqueId;
    aiClient.context.tags[aiClient.context.keys.cloudRole] = productName;
    aiClient.context.tags[aiClient.context.keys.cloudRoleInstance] = '#####';
    aiClient.context.tags[aiClient.context.keys.applicationVersion] = productVersion;
    aiClient.context.tags[aiClient.context.keys.sessionId] = sessionId;
}

export function registerCommonFinalTelemetryProcessors(
    aiClient: appInsights.TelemetryClient,
    environment: IAppTelemetryEnvironment,
    logger?: Console
): void {
    if (logger && !!environment.developerMode) {
        aiClient.addTelemetryProcessor((envelope: appInsights.Contracts.EnvelopeTelemetry, context?: {
            [name: string]: any;
        }) => logTelemetryItem(logger, envelope, context));
    }
}

function logTelemetryItem(logger: Console, envelope: appInsights.Contracts.EnvelopeTelemetry, context?: {
    [name: string]: any;
}): boolean {
    if (!envelope.data || !logger) return true; // Ignore when data doesn't exist

    let telemetryType = appInsights.Contracts.baseTypeToTelemetryType(envelope.data.baseType as appInsights.Contracts.TelemetryTypeValues);
    switch (telemetryType) {
        case appInsights.Contracts.TelemetryType.Request:
            {
                let data = envelope.data.baseData as unknown as appInsights.Contracts.RequestData;
                logger.info(`[pp-tooling-telemetry-node] Processing telemetry item of type '${envelope.data.baseType}'. name: ${data.name}, responseCode: ${data.responseCode}`);
            }
            break;

        case appInsights.Contracts.TelemetryType.Event:
            {
                let data = envelope.data.baseData as unknown as appInsights.Contracts.EventData;
                logger.info(`[pp-tooling-telemetry-node] Processing telemetry item of type '${envelope.data.baseType}'. name: ${data.name}`);
            }
            break;

        case appInsights.Contracts.TelemetryType.Exception:
            {
                let data = envelope.data.baseData as unknown as appInsights.Contracts.ExceptionData;
                logger.info(`[pp-tooling-telemetry-node] Processing telemetry item of type '${envelope.data.baseType}'. problemId: '${data.problemId}'`);
            }
            break;

        default:
            logger.info(`[pp-tooling-telemetry-node] Processing telemetry item of type '${envelope.data.baseType}'`);
            break;
    }
    return true;
}
