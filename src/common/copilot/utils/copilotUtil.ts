/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../../client/pac/PacWrapper";
import { ECSFeaturesClient } from "../../ecs-features/ecsFeatureClient";
import { CopilotDisableList, EnableProDevCopilot } from "../../ecs-features/ecsFeatureGates";
import { AUTH_CREATE_FAILED, AUTH_CREATE_MESSAGE, PAC_SUCCESS } from "../constants";
import { showInputBoxAndGetOrgUrl, showProgressWithNotification } from "../../utilities/Utils";

export async function createAuthProfileExp(pacWrapper: PacWrapper | undefined) {
    const userOrgUrl = await showInputBoxAndGetOrgUrl();
    if (!userOrgUrl) {
        return;
    }

    if (!pacWrapper) {
        vscode.window.showErrorMessage(AUTH_CREATE_FAILED);
        return;
    }

    const pacAuthCreateOutput = await showProgressWithNotification(vscode.l10n.t(AUTH_CREATE_MESSAGE), async () => { return await pacWrapper?.authCreateNewAuthProfileForOrg(userOrgUrl) });
    if (pacAuthCreateOutput && pacAuthCreateOutput.Status !== PAC_SUCCESS) {
        vscode.window.showErrorMessage(AUTH_CREATE_FAILED);
        return;
    }
}

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
