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
        disallowedProDevCopilotTenants: "",
        disallowedProDevCopilotOrgs: "",
    },
});
