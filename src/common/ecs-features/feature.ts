/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Interface representing a Feature.
 */
export interface Feature<TConfig extends Record<string, string | boolean>, TeamName extends string> {
    /**
     * Name of the Team owning the feature. Must match the "clientTeam" name configured in ECS.
     */
    teamName: TeamName;

    /**
     * Fallback config to be used while loading or if configs are unavailable.
     */
    fallback: TConfig;

    /**
      * Aliases of the devs who originally defined the feature (used for tracking/cleanup purposes)
      */
    owners?: string[];

    /**
     * Brief description of the feature (used for tracking/cleanup purposes)
     */
    description?: string;

    /**
     * Creation date for the feature (used for tracking/cleanup purposes)
     */
    createdOn?: string;

    /**
     * URL for the corresponding rollout or experiment in ECS.
     */
    ecsURL?: string;

    /**
     * Callback to extract the Feature-specific config from the Team config.
     * @param config overall config for the Team.
     */
    extractConfig<TTeamConfig extends TConfig>(config: TTeamConfig): Partial<TConfig>;
}

export type FeatureInfo<TConfig extends Record<string, boolean | string>, TeamName extends string> = Omit<
    Feature<TConfig, TeamName>,
    'extractConfig'
>;

/**
 * Creates a Feature object based on the provided teamName and default config
 * @param teamName Name of the team owning the feature.
 * @param fallback Fallback config to be used while loading or if configs are unavailable.
 */
export function createFeature<TConfig extends Record<string, boolean | string>, TeamName extends string>(
    featureInfo: FeatureInfo<TConfig, TeamName>
): Feature<TConfig, TeamName> {
    return {
        ...featureInfo,
        extractConfig: (config) => extractFeatureConfig(config, Object.keys(featureInfo.fallback)),
    };
}

/**
 * Extracts the feature-specific config, based on the provided keys, from the overall Project Team config
 * @param teamConfig the overall config object for the Project Team
 * @param keys property names to extract from the Project Team config
 */
function extractFeatureConfig<TConfig extends Record<string, boolean | string>, TeamConfig extends TConfig>(
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
