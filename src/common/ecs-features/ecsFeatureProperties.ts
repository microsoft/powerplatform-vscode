/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Interface representing a Feature config in ECS.
 */
export interface ECSFeatureDefinition<TConfig extends Record<string, string | boolean>, TeamName extends string> {
    /**
     * Name of the Team owning the feature. Must match the "clientTeam" name configured in ECS.
     */
    teamName: TeamName;

    /**
     * Fallback config to be used while loading or if configs are unavailable.
     */
    fallback: TConfig;

    /**
     * Brief description of the feature (used for tracking/cleanup purposes)
     */
    description?: string;

    /**
     * Callback to extract the Feature-specific config from the Team config.
     * @param config overall config for the Team.
     */
    extractECSFeatureFlagConfig<TTeamConfig extends TConfig>(config: TTeamConfig): Partial<TConfig>;
}

export type ECSFeatureInfo<TConfig extends Record<string, boolean | string>, TeamName extends string> = Omit<
    ECSFeatureDefinition<TConfig, TeamName>,
    'extractECSFeatureFlagConfig'
>;

/**
 * Creates a Feature object based on the feature definition that includes fallback flags and the team owning the feature.
 * @param featureInfo Feature definition specifying the fallback flags and the team owning the feature.
 */
export function createECSFeatureDefinition<TConfig extends Record<string, boolean | string>, TeamName extends string>(
    featureInfo: ECSFeatureInfo<TConfig, TeamName>
): ECSFeatureDefinition<TConfig, TeamName> {
    return {
        ...featureInfo,
        extractECSFeatureFlagConfig: (config) => extractECSFeatureFlagConfig(config, Object.keys(featureInfo.fallback)),
    };
}

/**
 * Extracts the feature-specific config, based on the provided keys, from the overall Project Team config
 * @param teamConfig the overall config object for the Project Team
 * @param keys property names to extract from the Project Team config
 */
function extractECSFeatureFlagConfig<TConfig extends Record<string, boolean | string>, TeamConfig extends TConfig>(
    teamConfig: TeamConfig,
    keys: (keyof TConfig)[]
): Partial<TConfig> {
    const config: Partial<TConfig> = {};

    for (const key of keys) {
        if (typeof teamConfig[key] !== 'undefined') {
            config[key] = teamConfig[key];
        }
    }

    return config;
}
