/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Interface representing a Feature config in ECS.
 */
export interface IECSFeature<TConfig extends Record<string, string | boolean>, TeamName extends string> {
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
     * Callback to extract the Feature-specific config from the Team config.
     * @param config overall config for the Team.
     */
    extractConfig<TTeamConfig extends TConfig>(config: TTeamConfig): Partial<TConfig>;
}

export type FeatureInfo<TConfig extends Record<string, boolean | string>, TeamName extends string> = Omit<
    IECSFeature<TConfig, TeamName>,
    'extractConfig'
>;

/**
 * Creates a Feature object based on the feature definition that includes fallback flags and the team owning the feature.
 * @param featureInfo Feature definition specifying the fallback flags and the team owning the feature.
 */
export function createFeature<TConfig extends Record<string, boolean | string>, TeamName extends string>(
    featureInfo: FeatureInfo<TConfig, TeamName>
): IECSFeature<TConfig, TeamName> {
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
