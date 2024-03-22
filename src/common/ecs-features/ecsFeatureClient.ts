/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import TelemetryReporter from "@vscode/extension-telemetry";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { createECSRequestURL } from "./ecsFeatureUtil";
import { ECSFeatureDefinition as ECSFeatureProperties } from "./ecsFeatureProperties";
import { ECSAPIFeatureFlagFilters } from "./ecsFeatureFlagFilters";

export abstract class ECSFeaturesClient {
    private static _ecsConfig: Record<string, string | boolean>;
    private static _featuresConfig = {};

    // Initialize ECSFeatureClient and reference this for accessing any client config like below
    // ECSFeaturesClient.getConfig(EnableMultifileVscodeWeb).enableMultifileVscodeWeb
    public static async init(telemetry: ITelemetry | TelemetryReporter, filters: ECSAPIFeatureFlagFilters, clientName?: string) {
        if (this._ecsConfig) return;

        const requestURL = createECSRequestURL(filters, clientName);
        try {
            const response = await fetch(requestURL, {
                method: 'GET'
            });
            if (!response.ok) {
                throw new Error('Request failed');
            }
            const result = await response.json();
            // Update telemetry in other PR
            // telemetry.sendTelemetryEvent('ECSConfig', {});

            // Initialize ECS config
            return result;
        } catch (error) {
            return null;
        }
    }


    public static getConfig<TConfig extends Record<string, boolean | string>, TeamName extends string>(
        feature: ECSFeatureProperties<TConfig, TeamName>
    ) {
        if (Object.keys(this._featuresConfig).length === 0) {
            this._featuresConfig = this._ecsConfig && feature.extractECSFeatureFlagConfig?.(this._ecsConfig as TConfig);
        }

        return Object.keys(this._featuresConfig).length === 0 ? feature.fallback : this._featuresConfig;
    }
}
