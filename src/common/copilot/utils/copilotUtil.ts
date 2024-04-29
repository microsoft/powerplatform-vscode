/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { CopilotDisableList } from "../../ecs-features/ecsFeatureGates";

export function getDisabledOrgList() {
    console.log("copilot orgs", CopilotDisableList.getConfig().DisallowedOrgs);
    return CopilotDisableList.getConfig().DisallowedOrgs?.split(',');
}

export function getDisabledTenantList() {
    console.log("Copilot tenant", CopilotDisableList.getConfig().DisallowedTenants);
    return CopilotDisableList.getConfig().DisallowedTenants?.split(',');
}