/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ClientName } from './constants';
import { powerPagesFeatureClient } from './powerPagesFeatureClient';

export const {
    feature: EnableMultifileVscodeWeb
} = powerPagesFeatureClient({
    teamName: ClientName,
    owners: ['nityagi'],
    description: 'Enable multiple file view in Visual Studio Code Web',
    createdOn: '06/23/2023',
    fallback: {
        enableMultifileVscodeWeb: false,
    },
});
