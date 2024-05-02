/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ECSFeaturesClient } from "../../ecs-features/ecsFeatureClient";
import { CopilotDisableList } from "../../ecs-features/ecsFeatureGates";

export function getDisabledOrgList() {
    return ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotOrgs?.split(',').map(org => org.trim());
}

export function getDisabledTenantList() {
    return ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotTenants?.split(',').map(tenant => tenant.trim());
}
