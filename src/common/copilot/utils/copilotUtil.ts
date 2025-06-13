/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { COPILOT_GOVERNANCE_SETTING_NAME } from "../../ecs-features/constants";
import { ECSFeaturesClient } from "../../ecs-features/ecsFeatureClient";
import { CopilotDisableList, EnablePowerPagesGitHubCopilot, EnableProDevCopilot, EnableProdevCopilotGovernanceCheck } from "../../ecs-features/ecsFeatureGates";

export function getDisabledOrgList() {
    const disallowedProDevCopilotOrgs = ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotOrgs;

    if (disallowedProDevCopilotOrgs === undefined || disallowedProDevCopilotOrgs === "") {
        return [];
    }

    return disallowedProDevCopilotOrgs.split(',').map(org => org.trim());
}

export function getDisabledTenantList() {

    const disallowedProDevCopilotTenants = ECSFeaturesClient.getConfig(CopilotDisableList).disallowedProDevCopilotTenants;

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

export function isPowerPagesGitHubCopilotEnabled() {
    const enablePowerpagesInGithubCopilot = ECSFeaturesClient.getConfig(EnablePowerPagesGitHubCopilot).enablePowerpagesInGithubCopilot

    if(enablePowerpagesInGithubCopilot === undefined) {
        return false;
    }

    return enablePowerpagesInGithubCopilot;
}

export function isCopilotGovernanceCheckEnabled() {
    const enableCopilotGovernanceCheck = ECSFeaturesClient.getConfig(EnableProdevCopilotGovernanceCheck).enableProdevCopilotGovernanceCheck;
    if(enableCopilotGovernanceCheck === undefined) {
        return false;
    }

    return enableCopilotGovernanceCheck;
}

export function getCopilotGovernanceSetting() {
    const copilotGovernanceSetting = ECSFeaturesClient.getConfig(EnableProdevCopilotGovernanceCheck).copilotGovernanceSetting;
    if(copilotGovernanceSetting === undefined) {
        return COPILOT_GOVERNANCE_SETTING_NAME;
    }

    return copilotGovernanceSetting;
}