/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { PowerPagesClientName, ECS_REQUEST_URL_TEMPLATE } from "./constants";
import { ECSFeaturesClient } from "./ecsFeatureClient";
import { ECSAPIFeatureFlagFilters } from "./ecsFeatureFlagFilters";
import { ECSFeatureDefinition, ECSFeatureInfo, createECSFeatureDefinition } from "./ecsFeatureProperties";

export function getECSRequestURL(filters: ECSAPIFeatureFlagFilters, clientName = PowerPagesClientName): string {
    return ECS_REQUEST_URL_TEMPLATE
        .replace("{ClientName}", clientName)
        .replace("{AppName}", filters.AppName)
        .replace("{EnvironmentId}", filters.EnvID)
        .replace("{UserId}", filters.UserID)
        .replace("{TenantId}", filters.TenantID)
        .replace("{Region}", filters.Region);
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
