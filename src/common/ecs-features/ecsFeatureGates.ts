/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { PowerPagesClientName } from './constants';
import { getFeatureConfigs } from './ecsFeatureUtil';

export const {
    feature: EnableMultifileVscodeWeb
} = getFeatureConfigs({
    teamName: PowerPagesClientName,
    description: 'Enable multiple file view in Visual Studio Code Web',
    fallback: {
        enableMultifileVscodeWeb: false,
    },
});

export const {
    feature: CopilotDisableList
} = getFeatureConfigs({
    teamName: PowerPagesClientName,
    description: 'Disable Copilot',
    fallback: {
        disallowedProDevCopilotTenants: "f25493ae-1c98-41d7-8a33-0be75f5fe603",
        disallowedProDevCopilotOrgs: "",
    },
});

export const {
    feature: EnableProDevCopilot
} = getFeatureConfigs({
    teamName: PowerPagesClientName,
    description: 'Enable ProDev Copilot',
    fallback: {
        "capiSupportedProDevCopilotGeoList": "us,au,uk,eu,in",
        "unsupportedProDevCopilotGeoList": "ca",
        "capiSupportedProDevCopilotGeoWithCrossGeoDataFlow": "eu,se,ch,fr,de,no"
    },
});

export const {
    feature: EnablePowerPagesGitHubCopilot
} = getFeatureConfigs({
    teamName: PowerPagesClientName,
    description: 'Enable Power Pages GitHub Copilot',
    fallback: {
        enablePowerpagesInGithubCopilot: false,
    },
});
