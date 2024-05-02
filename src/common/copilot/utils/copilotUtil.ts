/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { CopilotDisableList } from "../../ecs-features/ecsFeatureGates";

export function getDisabledOrgList() {
    console.log("copilot orgs", CopilotDisableList.getConfig().disallowedProDevCopilotOrgs);
    return CopilotDisableList.getConfig().disallowedProDevCopilotOrgs?.split(',');
}

export function getDisabledTenantList() {
    console.log("Copilot tenant", CopilotDisableList.getConfig().disallowedProDevCopilotTenants);
    return CopilotDisableList.getConfig().disallowedProDevCopilotTenants?.split(',');
}
