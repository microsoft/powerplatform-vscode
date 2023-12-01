/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ECSFeaturesClient } from "./ecsFeatureClient";
import { ECSFeatureDefinition, ECSFeatureInfo, createECSFeatureDefinition } from "./ecsFeatureProperties";

export function powerPagesFeatureClient<TConfig extends Record<string, string | boolean>, TeamName extends string>(featureInfo: ECSFeatureInfo<TConfig, TeamName>) {
    type EnhancedFeature = ECSFeatureDefinition<TConfig, TeamName> & {
        getConfig: () => Partial<TConfig>;
        isLoaded: () => boolean;
    };

    const feature = createECSFeatureDefinition(featureInfo) as EnhancedFeature;
    feature.getConfig = () => ECSFeaturesClient.getConfig(feature);

    return {
        feature: feature,
    };
}
