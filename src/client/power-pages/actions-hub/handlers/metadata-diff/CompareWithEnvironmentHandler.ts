/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacTerminal } from "../../../../lib/PacTerminal";
import PacContext from "../../../../pac/PacContext";
import { Constants } from "../../Constants";
import { traceError, traceInfo } from "../../TelemetryHelper";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import { SUCCESS } from "../../../../../common/constants";
import { OrgInfo } from "../../../../pac/PacTypes";
import { IWebsiteDetails } from "../../../../../common/services/Interfaces";
import { resolveSiteFromWorkspace, prepareSiteStoragePath, processComparisonResults } from "./MetadataDiffUtils";
import { getWebsiteName } from "../../../../../common/utilities/WorkspaceInfoFinderUtil";
import { fetchWebsites } from "../../ActionsHubUtils";
import { MultiStepInput } from "../../../../../common/utilities/MultiStepInput";

/**
 * Environment quick pick item with full org info
 */
interface EnvironmentQuickPickItem extends vscode.QuickPickItem {
    orgInfo: OrgInfo;
    iconPath?: vscode.ThemeIcon | { light: vscode.Uri; dark: vscode.Uri };
}

/**
 * Website quick pick item with full website details
 */
interface WebsiteQuickPickItem extends vscode.QuickPickItem {
    websiteDetails: IWebsiteDetails;
    iconPath?: vscode.ThemeIcon;
}

/**
 * Gets the list of environments accessible to the user, excluding the currently connected environment
 * @param pacTerminal The PAC terminal instance
 * @param context The extension context for accessing icons
 * @returns Array of environment quick pick items with org info
 */
async function getEnvironmentList(pacTerminal: PacTerminal, context: vscode.ExtensionContext): Promise<EnvironmentQuickPickItem[]> {
    const pacWrapper = pacTerminal.getWrapper();
    const envListOutput = await pacWrapper.orgList();

    if (envListOutput && envListOutput.Status === SUCCESS && envListOutput.Results) {
        const currentEnvironmentId = PacContext.OrgInfo?.EnvironmentId;
        const envList = envListOutput.Results.filter(
            (env) => env.EnvironmentIdentifier.Id !== currentEnvironmentId
        );
        return envList.map((env) => ({
            label: env.FriendlyName,
            detail: env.EnvironmentUrl,
            description: "",
            iconPath: {
                light: vscode.Uri.joinPath(context.extensionUri, 'src', 'client', 'assets', 'environment-icon', 'light', 'environment.svg'),
                dark: vscode.Uri.joinPath(context.extensionUri, 'src', 'client', 'assets', 'environment-icon', 'dark', 'environment.svg')
            },
            orgInfo: {
                OrgId: env.OrganizationId,
                UniqueName: env.UniqueName,
                FriendlyName: env.FriendlyName,
                OrgUrl: env.EnvironmentUrl,
                UserEmail: "",
                UserId: "",
                EnvironmentId: env.EnvironmentIdentifier.Id
            }
        }));
    }

    return [];
}

/**
 * Type guard to check if a quick pick item is a website item
 */
function isWebsiteQuickPickItem(item: vscode.QuickPickItem | WebsiteQuickPickItem): item is WebsiteQuickPickItem {
    return 'websiteDetails' in item;
}

/**
 * Converts website details to quick pick items for selection
 * @param activeSites List of active websites
 * @param inactiveSites List of inactive websites
 * @param localSiteId The website record ID from the local workspace (to prioritize matching site)
 * @returns Array of website quick pick items sorted by: matching site first, then active status, then name, with separators between groups
 */
function getWebsiteQuickPickItems(activeSites: IWebsiteDetails[], inactiveSites: IWebsiteDetails[], localSiteId: string): (WebsiteQuickPickItem | vscode.QuickPickItem)[] {
    const normalizedLocalSiteId = localSiteId.toLowerCase();

    // Sort function for websites within a group
    const sortByMatchingThenName = (a: IWebsiteDetails, b: IWebsiteDetails): number => {
        const aMatches = a.websiteRecordId?.toLowerCase() === normalizedLocalSiteId;
        const bMatches = b.websiteRecordId?.toLowerCase() === normalizedLocalSiteId;

        // Matching site comes first
        if (aMatches && !bMatches) {
            return -1;
        }
        if (!aMatches && bMatches) {
            return 1;
        }

        // Sort by name alphabetically
        const nameA = a.name || "";
        const nameB = b.name || "";
        return nameA.localeCompare(nameB);
    };

    // Sort each group
    const sortedActiveSites = [...activeSites].sort(sortByMatchingThenName);
    const sortedInactiveSites = [...inactiveSites].sort(sortByMatchingThenName);

    const createWebsiteItem = (website: IWebsiteDetails): WebsiteQuickPickItem => {
        const isMatchingSite = website.websiteRecordId?.toLowerCase() === normalizedLocalSiteId;
        const dataModelText = website.dataModel === "Enhanced" ? Constants.Strings.ENHANCED_DATA_MODEL : Constants.Strings.STANDARD_DATA_MODEL;
        const matchingIndicator = isMatchingSite ? ` • ${Constants.Strings.MATCHING_SITE_INDICATOR}` : "";
        return {
            label: website.name,
            detail: website.websiteUrl,
            description: `${dataModelText}${matchingIndicator}`,
            iconPath: Constants.Icons.SITE,
            websiteDetails: website
        };
    };

    const result: (WebsiteQuickPickItem | vscode.QuickPickItem)[] = [];

    // Add active sites with separator
    if (sortedActiveSites.length > 0) {
        result.push({
            label: Constants.Strings.ACTIVE_SITES,
            kind: vscode.QuickPickItemKind.Separator
        });
        result.push(...sortedActiveSites.map(createWebsiteItem));
    }

    // Add inactive sites with separator
    if (sortedInactiveSites.length > 0) {
        result.push({
            label: Constants.Strings.INACTIVE_SITES,
            kind: vscode.QuickPickItemKind.Separator
        });
        result.push(...sortedInactiveSites.map(createWebsiteItem));
    }

    return result;
}

export const compareWithEnvironment = (pacTerminal: PacTerminal, context: vscode.ExtensionContext) => async (resource: vscode.Uri): Promise<void> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CALLED, {
        methodName: compareWithEnvironment.name
    });

    // Start fetching environment list immediately to minimize perceived latency
    const environmentListPromise = getEnvironmentList(pacTerminal, context);

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

    const storagePath = context.storageUri?.fsPath;

    if (!storagePath) {
        return;
    }

    const title = Constants.Strings.COMPARE_SITE_WITH_ENVIRONMENT;
    const totalSteps = 2;

    interface CompareWithEnvironmentState {
        selectedEnv: EnvironmentQuickPickItem;
        selectedWebsite: WebsiteQuickPickItem;
        activeSites: IWebsiteDetails[];
        inactiveSites: IWebsiteDetails[];
    }

    async function collectInputs(): Promise<CompareWithEnvironmentState | undefined> {
        const state = {} as Partial<CompareWithEnvironmentState>;

        try {
            await MultiStepInput.run(input => pickEnvironment(input, state));
        } catch (err) {
            // Check if this is a "no environments found" error
            if (err instanceof Error && err.message === Constants.Strings.NO_ENVIRONMENTS_FOUND) {
                await vscode.window.showErrorMessage(Constants.Strings.NO_ENVIRONMENTS_FOUND);
            }
            // User cancelled the input flow or error occurred
            return undefined;
        }

        if (!state.selectedEnv || !state.selectedWebsite) {
            return undefined;
        }

        return state as CompareWithEnvironmentState;
    }

    async function pickEnvironment(input: MultiStepInput, state: Partial<CompareWithEnvironmentState>) {
        // Use showQuickPickAsync to show the quick pick immediately while items load
        const selectedEnv = await input.showQuickPickAsync<EnvironmentQuickPickItem, { title: string; step: number; totalSteps: number; itemsPromise: Promise<EnvironmentQuickPickItem[]>; placeholder: string; loadingPlaceholder: string }>({
            title,
            step: 1,
            totalSteps,
            itemsPromise: environmentListPromise.then(items => {
                if (items.length === 0) {
                    throw new Error(Constants.Strings.NO_ENVIRONMENTS_FOUND);
                }
                return items;
            }),
            placeholder: Constants.Strings.SELECT_ENVIRONMENT_TO_COMPARE,
            loadingPlaceholder: Constants.Strings.LOADING,
        });

        if (!selectedEnv || !('orgInfo' in selectedEnv)) {
            return;
        }

        state.selectedEnv = selectedEnv as EnvironmentQuickPickItem;

        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_ENVIRONMENT_SELECTED, {
            methodName: compareWithEnvironment.name,
            environmentId: state.selectedEnv.orgInfo.EnvironmentId,
            environmentName: state.selectedEnv.label
        });

        return (input: MultiStepInput) => pickWebsite(input, state, siteResolution!);
    }

    async function pickWebsite(input: MultiStepInput, state: Partial<CompareWithEnvironmentState>, siteInfo: NonNullable<typeof siteResolution>) {
        const selectedEnv = state.selectedEnv!;

        // Fetch websites from selected environment
        let activeSites: IWebsiteDetails[] = [];
        let inactiveSites: IWebsiteDetails[] = [];

        await showProgressWithNotification(
            Constants.StringFunctions.FETCHING_WEBSITES_FROM_ENVIRONMENT(selectedEnv.label),
            async () => {
                const result = await fetchWebsites(selectedEnv.orgInfo, false);
                activeSites = result.activeSites;
                inactiveSites = result.inactiveSites;
                return true;
            }
        );

        if (activeSites.length === 0 && inactiveSites.length === 0) {
            traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_WEBSITE_NOT_FOUND, {
                methodName: compareWithEnvironment.name,
                environmentId: selectedEnv.orgInfo.EnvironmentId
            });
            await vscode.window.showErrorMessage(Constants.Strings.NO_SITES_FOUND_IN_ENVIRONMENT);
            return;
        }

        state.activeSites = activeSites;
        state.inactiveSites = inactiveSites;

        // Get website quick pick items (includes separators for grouping)
        const websiteQuickPickItems = getWebsiteQuickPickItems(activeSites, inactiveSites, siteInfo.siteId);

        const selectedWebsite = await input.showQuickPick<WebsiteQuickPickItem | vscode.QuickPickItem, { title: string; step: number; totalSteps: number; placeholder: string; items: (WebsiteQuickPickItem | vscode.QuickPickItem)[] }>({
            title,
            step: 2,
            totalSteps,
            placeholder: Constants.Strings.SELECT_WEBSITE_TO_COMPARE,
            items: websiteQuickPickItems,
        });

        if (!selectedWebsite || !isWebsiteQuickPickItem(selectedWebsite)) {
            return;
        }

        state.selectedWebsite = selectedWebsite;
    }

    // Collect inputs using multi-step quick pick
    const state = await collectInputs();

    if (!state) {
        traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED, {
            methodName: compareWithEnvironment.name
        });
        return;
    }

    const { selectedEnv, selectedWebsite } = state;
    const websiteDetails = selectedWebsite.websiteDetails;

    // Check if selected website is different from local site and show confirmation
    const isMatchingSite = websiteDetails.websiteRecordId?.toLowerCase() === siteResolution.siteId.toLowerCase();
    if (!isMatchingSite) {
        const config = vscode.workspace.getConfiguration(Constants.Strings.CONFIGURATION_NAME);
        const shouldConfirm = config.get<boolean>("confirmDifferentWebsiteComparison", true);

        if (shouldConfirm) {
            const confirmation = await vscode.window.showWarningMessage(
                Constants.Strings.DIFFERENT_WEBSITE_CONFIRMATION,
                { modal: true },
                Constants.Strings.YES,
                Constants.Strings.YES_DONT_ASK_AGAIN
            );

            if (confirmation === Constants.Strings.YES_DONT_ASK_AGAIN) {
                await config.update("confirmDifferentWebsiteComparison", false, vscode.ConfigurationTarget.Global);
            } else if (confirmation !== Constants.Strings.YES) {
                traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED, {
                    methodName: compareWithEnvironment.name,
                    reason: "User cancelled after different website confirmation"
                });
                return;
            }
        }
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_WEBSITE_SELECTED, {
        methodName: compareWithEnvironment.name,
        websiteId: websiteDetails.websiteRecordId,
        websiteName: websiteDetails.name,
        environmentId: selectedEnv.orgInfo.EnvironmentId
    });

    // Determine data model version
    const dataModelVersion = websiteDetails.dataModel === "Enhanced" ? 2 : 1;

    const siteStoragePath = prepareSiteStoragePath(storagePath, websiteDetails.websiteRecordId);
    const pacWrapper = pacTerminal.getWrapper();

    const downloadStartTime = Date.now();
    const success = await showProgressWithNotification(
        Constants.StringFunctions.DOWNLOADING_SITE_FOR_COMPARISON(websiteDetails.name),
        async () => pacWrapper.downloadSiteWithProgress(
            siteStoragePath,
            websiteDetails!.websiteRecordId,
            dataModelVersion,
            selectedEnv.orgInfo.OrgUrl
        )
    );
    const downloadDurationMs = Date.now() - downloadStartTime;

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

    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SITE_DOWNLOAD_COMPLETED, {
        methodName: compareWithEnvironment.name,
        siteId: websiteDetails.websiteRecordId,
        environmentId: selectedEnv.orgInfo.EnvironmentId,
        dataModelVersion: dataModelVersion,
        downloadDurationMs: downloadDurationMs
    });

    // Get local site name from website.yml
    const localSiteName = getWebsiteName(siteResolution.localSitePath) || Constants.Strings.LOCAL_SITE;

    const hasDifferences = await processComparisonResults(
        siteStoragePath,
        siteResolution.localSitePath,
        websiteDetails.name,
        localSiteName,
        selectedEnv.label,
        compareWithEnvironment.name,
        websiteDetails.websiteRecordId,
        Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_COMPLETED,
        Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_NO_DIFFERENCES,
        siteResolution.comparisonSubPath,
        selectedEnv.orgInfo.EnvironmentId,
        dataModelVersion,
        websiteDetails.websiteUrl,
        websiteDetails.siteVisibility,
        websiteDetails.creator,
        websiteDetails.createdOn
    );

    if (hasDifferences) {
        await vscode.window.showInformationMessage(Constants.Strings.COMPARE_WITH_LOCAL_COMPLETED);
    }
};
