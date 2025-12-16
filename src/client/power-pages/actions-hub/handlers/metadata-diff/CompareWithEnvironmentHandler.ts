/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacTerminal } from "../../../../lib/PacTerminal";
import { Constants } from "../../Constants";
import { traceError, traceInfo } from "../../TelemetryHelper";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import { SUCCESS } from "../../../../../common/constants";
import { OrgInfo, OrgListOutput } from "../../../../pac/PacTypes";
import { IWebsiteDetails } from "../../../../../common/services/Interfaces";
import { getAllWebsites } from "../../../../../common/utilities/WebsiteUtil";
import { resolveSiteFromWorkspace, prepareSiteStoragePath, processComparisonResults } from "./MetadataDiffUtils";

/**
 * Environment quick pick item with full org info
 */
interface EnvironmentQuickPickItem extends vscode.QuickPickItem {
    orgInfo: OrgInfo;
}

/**
 * Gets the list of environments accessible to the user
 * @param pacTerminal The PAC terminal instance
 * @returns Array of environment quick pick items with org info
 */
async function getEnvironmentList(pacTerminal: PacTerminal): Promise<EnvironmentQuickPickItem[]> {
    const pacWrapper = pacTerminal.getWrapper();
    const envListOutput = await pacWrapper.orgList();

    if (envListOutput && envListOutput.Status === SUCCESS && envListOutput.Results) {
        const envList = envListOutput.Results as OrgListOutput[];
        return envList.map((env) => ({
            label: env.FriendlyName,
            detail: env.EnvironmentUrl,
            description: "",
            orgInfo: {
                OrgId: env.OrganizationId,
                UniqueName: "",
                FriendlyName: env.FriendlyName,
                OrgUrl: env.EnvironmentUrl,
                UserEmail: "",
                UserId: "",
                EnvironmentId: env.EnvironmentId
            }
        }));
    }

    return [];
}

/**
 * Finds a website in the given list by its website record ID
 * @param websites List of websites to search
 * @param websiteId The website record ID to find
 * @returns The matching website details or undefined
 */
function findWebsiteById(websites: IWebsiteDetails[], websiteId: string): IWebsiteDetails | undefined {
    return websites.find(website => website.websiteRecordId === websiteId);
}

export const compareWithEnvironment = (pacTerminal: PacTerminal, context: vscode.ExtensionContext) => async (resource: vscode.Uri): Promise<void> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CALLED, {
        methodName: compareWithEnvironment.name
    });

    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_WORKSPACE, {
            methodName: compareWithEnvironment.name
        });
        await vscode.window.showErrorMessage(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
        return;
    }

    const siteResolution = resolveSiteFromWorkspace(workspaceFolders[0].uri.fsPath, resource);

    if (!siteResolution) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_WEBSITE_ID_NOT_FOUND, {
            methodName: compareWithEnvironment.name
        });
        await vscode.window.showErrorMessage(Constants.Strings.WEBSITE_ID_NOT_FOUND);
        return;
    }

    // Show environment picker
    const environmentList = await getEnvironmentList(pacTerminal);

    if (environmentList.length === 0) {
        await vscode.window.showErrorMessage(Constants.Strings.NO_ENVIRONMENTS_FOUND);
        return;
    }

    const selectedEnv = await vscode.window.showQuickPick(environmentList, {
        placeHolder: Constants.Strings.SELECT_ENVIRONMENT_TO_COMPARE
    });

    if (!selectedEnv) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED, {
            methodName: compareWithEnvironment.name
        });
        return;
    }

    const selectedOrgInfo = selectedEnv.orgInfo;

    traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_ENVIRONMENT_SELECTED, {
        methodName: compareWithEnvironment.name,
        environmentId: selectedOrgInfo.EnvironmentId,
        environmentName: selectedEnv.label
    });

    // Fetch websites from selected environment
    let websiteDetails: IWebsiteDetails | undefined;

    await showProgressWithNotification(
        Constants.Strings.FETCHING_WEBSITES_FROM_ENVIRONMENT,
        async () => {
            const websites = await getAllWebsites(selectedOrgInfo);
            websiteDetails = findWebsiteById(websites, siteResolution.siteId);
            return true;
        }
    );

    if (!websiteDetails) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_WEBSITE_NOT_FOUND, {
            methodName: compareWithEnvironment.name,
            websiteId: siteResolution.siteId,
            environmentId: selectedOrgInfo.EnvironmentId
        });
        await vscode.window.showErrorMessage(Constants.Strings.WEBSITE_NOT_FOUND_IN_ENVIRONMENT);
        return;
    }

    // Determine data model version
    const dataModelVersion = websiteDetails.dataModel === "Enhanced" ? 2 : 1;

    const storagePath = context.storageUri?.fsPath;

    if (!storagePath) {
        return;
    }

    const siteStoragePath = prepareSiteStoragePath(storagePath, websiteDetails.websiteRecordId);
    const pacWrapper = pacTerminal.getWrapper();

    // Select the environment before downloading
    await pacWrapper.orgSelect(selectedOrgInfo.OrgUrl);

    const success = await showProgressWithNotification(
        Constants.StringFunctions.DOWNLOADING_SITE_FOR_COMPARISON(websiteDetails.name),
        async () => pacWrapper.downloadSiteWithProgress(
            siteStoragePath,
            websiteDetails!.websiteRecordId,
            dataModelVersion
        )
    );

    if (!success) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_FAILED,
            new Error("MetadataDiff: Action 'compare with environment' failed to download site."),
            {
                methodName: compareWithEnvironment.name,
                siteId: websiteDetails.websiteRecordId,
                dataModelVersion: dataModelVersion.toString()
            }
        );
        await vscode.window.showErrorMessage(Constants.Strings.COMPARE_WITH_LOCAL_SITE_DOWNLOAD_FAILED);
        return;
    }

    await processComparisonResults(
        siteStoragePath,
        siteResolution.localSitePath,
        websiteDetails.name,
        selectedEnv.label,
        compareWithEnvironment.name,
        websiteDetails.websiteRecordId,
        Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_COMPLETED,
        Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_NO_DIFFERENCES
    );

    await vscode.window.showInformationMessage(Constants.Strings.COMPARE_WITH_LOCAL_COMPLETED);
};
