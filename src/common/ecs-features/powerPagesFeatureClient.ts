/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ECSFeaturesClient } from "./ecsFeatureClient";
import { Feature, FeatureInfo, createFeature } from "./feature";

export function powerPagesFeatureClient<TConfig extends Record<string, string | boolean>, TeamName extends string>(featureInfo: FeatureInfo<TConfig, TeamName>) {
    type EnhancedFeature = Feature<TConfig, TeamName> & {
        getConfig: () => Partial<TConfig>;
        isLoaded: () => boolean;
    };

    const feature = createFeature(featureInfo) as EnhancedFeature;
    feature.getConfig = () => ECSFeaturesClient.getConfig(feature);

    return {
        feature: feature,
    };
}
