/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { PowerPagesClientName, ECS_REQUEST_URL_TEMPLATE } from "./constants";
import { ECSFeaturesClient } from "./ecsFeatureClient";
import { ECSAPIFeatureFlagFilters } from "./ecsFeatureFlagFilters";
import { ECSFeatureDefinition, ECSFeatureInfo, createECSFeatureDefinition } from "./ecsFeatureProperties";
import { URL, URLSearchParams } from 'url';

export function createECSRequestURL(filters: ECSAPIFeatureFlagFilters, clientName = PowerPagesClientName): string {
    const url = new URL(`${ECS_REQUEST_URL_TEMPLATE}/${clientName}/1.0.0.0`);

    const queryParams = {
        AppName: filters.AppName,
        EnvironmentID: filters.EnvID,
        UserID: filters.UserID,
        TenantID: filters.TenantID,
        region: filters.Region
    };

    url.search = new URLSearchParams(queryParams).toString();

    return url.toString();
}

export function getFeatureConfigs<TConfig extends Record<string, string | boolean>, TeamName extends string>(featureInfo: ECSFeatureInfo<TConfig, TeamName>) {
    type EnhancedFeature = ECSFeatureDefinition<TConfig, TeamName> & {
        getConfig: () => Partial<TConfig>;
    };

    const feature = createECSFeatureDefinition(featureInfo) as EnhancedFeature;
    feature.getConfig = () => ECSFeaturesClient.getConfig(feature);

    return {
        feature: feature,
    };
}
