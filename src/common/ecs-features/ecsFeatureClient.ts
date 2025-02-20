/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { createECSRequestURL } from "./ecsFeatureUtil";
import { ECSFeatureDefinition as ECSFeatureProperties } from "./ecsFeatureProperties";
import { ECSAPIFeatureFlagFilters } from "./ecsFeatureFlagFilters";
import { ECSConfigFailedInit, ECSConfigSuccessfulInit } from "./ecsTelemetryConstants";
import { oneDSLoggerWrapper } from "../OneDSLoggerTelemetry/oneDSLoggerWrapper";

export abstract class ECSFeaturesClient {
    private static _ecsConfig: Record<string, string | boolean>;

    // Initialize ECSFeatureClient - any client config can be fetched with utility function like below
    // EnableMultifileVscodeWeb.getConfig().enableMultifileVscodeWeb
    public static async init(filters: ECSAPIFeatureFlagFilters, clientName: string, force = false) {
        if (this._ecsConfig && !force) return

        const requestURL = createECSRequestURL(filters, clientName);
        try {
            const response = await fetch(requestURL, {
                method: 'GET'
            });
            if (!response.ok) {
                throw new Error('Request failed');
            }
            const result = await response.json();

            // Initialize ECS config
            this._ecsConfig = result[clientName];

            // capture telemetry
            oneDSLoggerWrapper.getLogger().traceInfo(ECSConfigSuccessfulInit, { clientName: clientName, configFlagCount: Object.keys(this._ecsConfig).length.toString() });
        } catch (error) {
            const message = (error as Error)?.message;
            // Log error
            oneDSLoggerWrapper.getLogger().traceError(ECSConfigFailedInit, message, error as Error);
        }
    }

    public static getConfig<TConfig extends Record<string, boolean | string>, TeamName extends string>(
        feature: ECSFeatureProperties<TConfig, TeamName>
    ) {
        const featuresConfig = this._ecsConfig && feature.extractECSFeatureFlagConfig?.(this._ecsConfig as TConfig);
        return { ...feature.fallback, ...featuresConfig };
    }
}
