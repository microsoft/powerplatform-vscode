/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ClientName } from './ECSConstants';

/*
 * Sample Feature Flag
 * How to use?
 *    Use the useFeature hook to get the flag value.
 *    e.g. const { enableSampleFeatureFlag } = usePowerPagesSampleFeature();
 * To access feature flag from outside react component
 *    pass feature object directly to getConfig function from featuresClient.
 *    eg. const { enableSampleFeatureFlag } = powerPagesFeaturesClient.getConfig(PowerPagesSampleFeature);
 * How to deploy?
 *    Navigate to https://ecs.skype.com/
 *    Create Feature Rollout => Select team "PortalMakerExperiences" => Select Default Template => Specify rollout name, description => Click Edit Config param
 *    Enter exact feature name what you specified in fallback block in JSON format e.g. { "enableSampleFeatureFlag": true}
 *    Update allocation using slider, Hit Save & Run, Get approval on ECS PR
 *    Deployment will start in few mins after PR is merged in ECS repo.
 */

export const {
    useFeature: useEnableMultifileVscodeWeb,
    feature: EnableMultifileVscodeWeb,
    withFeature: withEnableMultifileVscodeWeb,
} = createPowerPagesFeature({
    teamName: ClientName,
    owners: ['nityagi'],
    description: 'Enable multiple file view in Visual Studio Code Web',
    createdOn: '06/23/2023',
    fallback: {
        enableMultifileVscodeWeb: false,
    },
});


