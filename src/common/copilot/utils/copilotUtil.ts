/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ECSFeaturesClient } from "../../ecs-features/ecsFeatureClient";
import { CopilotDisableList, EnableProDevCopilot } from "../../ecs-features/ecsFeatureGates";

export function getDisabledOrgList() {
    const disallowedProDevCopilotOrgs = ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotOrgs;

    if (disallowedProDevCopilotOrgs === undefined || disallowedProDevCopilotOrgs === "") {
        return [];
    }

    return disallowedProDevCopilotOrgs.split(',').map(org => org.trim());
}

export function getDisabledTenantList() {

    const disallowedProDevCopilotTenants = ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotOrgs;

    if (disallowedProDevCopilotTenants === undefined || disallowedProDevCopilotTenants === "") {
        return [];
    }

    return disallowedProDevCopilotTenants.split(',').map(org => org.trim());
}

export function isCopilotSupportedInGeo() {
    const supportedGeoList = ECSFeaturesClient.getConfig(EnableProDevCopilot).capiSupportedProDevCopilotGeoList;

    if (supportedGeoList === undefined || supportedGeoList === "") {
        return [];
    }

    return supportedGeoList.split(',').map(org => org.trim());
}

export function isCopilotDisabledInGeo() {
    const disabledGeoList = ECSFeaturesClient.getConfig(EnableProDevCopilot).unsupportedProDevCopilotGeoList;

    if (disabledGeoList === undefined || disabledGeoList === "") {
        return [];
    }

    return disabledGeoList.split(',').map(org => org.trim());
}

export function enableCrossGeoDataFlowInGeo() {
    const enableCrossGeoDataFlowInGeo = ECSFeaturesClient.getConfig(EnableProDevCopilot).capiSupportedProDevCopilotGeoWithCrossGeoDataFlow;

    if (enableCrossGeoDataFlowInGeo === undefined || enableCrossGeoDataFlowInGeo === "") {
        return [];
    }

    return enableCrossGeoDataFlowInGeo.split(',').map(org => org.trim());
}
