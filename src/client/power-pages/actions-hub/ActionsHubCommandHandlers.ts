/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { Constants } from './Constants';
import { oneDSLoggerWrapper } from '../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { PacTerminal } from '../../lib/PacTerminal';
import { SUCCESS, UTF8_ENCODING, WEBSITE_YML } from '../../../common/constants';
import { AuthInfo, OrgListOutput } from '../../pac/PacTypes';
import { extractAuthInfo } from '../commonUtility';
import { showProgressWithNotification } from '../../../common/utilities/Utils';
import PacContext from '../../pac/PacContext';
import ArtemisContext from '../../ArtemisContext';
import { ServiceEndpointCategory } from '../../../common/services/Constants';
import { SiteTreeItem } from './tree-items/SiteTreeItem';
import { PreviewSite } from '../preview-site/PreviewSite';
import { PacWrapper } from '../../pac/PacWrapper';
import { dataverseAuthentication } from '../../../common/services/AuthenticationProvider';
import { createAuthProfileExp } from '../../../common/utilities/PacAuthUtil';
import { IOtherSiteInfo, IWebsiteDetails, WebsiteYaml } from '../../../common/services/Interfaces';
import { getActiveWebsites, getAllWebsites } from '../../../common/utilities/WebsiteUtil';
import CurrentSiteContext from './CurrentSiteContext';
import path from 'path';
import { getWebsiteRecordId } from '../../../common/utilities/WorkspaceInfoFinderUtil';

export const refreshEnvironment = async (pacTerminal: PacTerminal) => {
    const pacWrapper = pacTerminal.getWrapper();
    try {
        const pacActiveAuth = await pacWrapper.activeAuth();
        if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
            const authInfo = extractAuthInfo(pacActiveAuth.Results);
            PacContext.setContext(authInfo);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_REFRESH_FAILED, error as string, error as Error, { methodName: refreshEnvironment.name }, {});
    }
}

const getEnvironmentDetails = () => {
    const detailsArray = [];
    detailsArray.push(vscode.l10n.t({ message: "Timestamp: {0}", args: [new Date().toISOString()], comment: "{0} is the timestamp" }));

    const authInfo = PacContext.AuthInfo;
    const orgInfo = PacContext.OrgInfo;
    const artemisResponse = ArtemisContext.ServiceResponse.response;

    if (authInfo) {
        detailsArray.push(vscode.l10n.t({ message: "Tenant ID: {0}", args: [authInfo.TenantId], comment: "{0} is the Tenant ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Object ID: {0}", args: [authInfo.EntraIdObjectId], comment: "{0} is the Object ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Organization ID: {0}", args: [authInfo.OrganizationId], comment: "{0} is the Organization ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Unique name: {0}", args: [authInfo.OrganizationUniqueName], comment: "{0} is the Unique name" }));
        detailsArray.push(vscode.l10n.t({ message: "Instance url: {0}", args: [orgInfo?.OrgUrl], comment: "{0} is the Instance Url" }));
        detailsArray.push(vscode.l10n.t({ message: "Environment ID: {0}", args: [authInfo.EnvironmentId], comment: "{0} is the Environment ID" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster environment: {0}", args: [artemisResponse.environment], comment: "{0} is the Cluster environment" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster category: {0}", args: [artemisResponse.clusterCategory], comment: "{0} is the Cluster category" }));
        detailsArray.push(vscode.l10n.t({ message: "Cluster geo name: {0}", args: [artemisResponse.geoName], comment: "{0} is the cluster geo name" }));
    }

    return detailsArray.join('\n');
};

export const showEnvironmentDetails = async () => {
    try {
        const message = Constants.Strings.SESSION_DETAILS;
        const details = getEnvironmentDetails();

        const result = await vscode.window.showInformationMessage(message, { detail: details, modal: true }, Constants.Strings.COPY_TO_CLIPBOARD);

        if (result == Constants.Strings.COPY_TO_CLIPBOARD) {
            await vscode.env.clipboard.writeText(details);
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED, error as string, error as Error, { methodName: showEnvironmentDetails.name }, {});
    }
};

const getEnvironmentList = async (pacTerminal: PacTerminal, authInfo: AuthInfo): Promise<{ label: string, description: string, detail: string }[]> => {
    const pacWrapper = pacTerminal.getWrapper();
    const envListOutput = await pacWrapper.orgList();
    if (envListOutput && envListOutput.Status === SUCCESS && envListOutput.Results) {
        const envList = envListOutput.Results as OrgListOutput[];
        return envList.map((env) => {
            return {
                label: env.FriendlyName,
                detail: env.EnvironmentUrl,
                description: authInfo.OrganizationFriendlyName === env.FriendlyName ? Constants.Strings.CURRENT : ""
            }
        });
    }

    return [];
}

export const switchEnvironment = async (pacTerminal: PacTerminal) => {
    const pacWrapper = pacTerminal.getWrapper();
    const authInfo = PacContext.AuthInfo;

    if (authInfo) {
        const selectedEnv = await vscode.window.showQuickPick(getEnvironmentList(pacTerminal, authInfo),
            {
                placeHolder: vscode.l10n.t(Constants.Strings.SELECT_ENVIRONMENT)
            }
        );

        if (selectedEnv && selectedEnv.label !== authInfo.OrganizationFriendlyName) {
            await showProgressWithNotification(Constants.Strings.CHANGING_ENVIRONMENT, async () => await pacWrapper.orgSelect(selectedEnv.detail));
        }
    }
}

const getStudioUrl = (): string => {
    const artemisContext = ArtemisContext.ServiceResponse;

    let baseEndpoint = "";

    switch (artemisContext.stamp) {
        case ServiceEndpointCategory.TEST:
            baseEndpoint = Constants.StudioEndpoints.TEST;
            break;
        case ServiceEndpointCategory.PREPROD:
            baseEndpoint = Constants.StudioEndpoints.PREPROD;
            break;
        case ServiceEndpointCategory.PROD:
            baseEndpoint = Constants.StudioEndpoints.PROD;
            break;
        case ServiceEndpointCategory.DOD:
            baseEndpoint = Constants.StudioEndpoints.DOD;
            break;
        case ServiceEndpointCategory.GCC:
            baseEndpoint = Constants.StudioEndpoints.GCC;
            break;
        case ServiceEndpointCategory.HIGH:
            baseEndpoint = Constants.StudioEndpoints.HIGH;
            break;
        case ServiceEndpointCategory.MOONCAKE:
            baseEndpoint = Constants.StudioEndpoints.MOONCAKE;
            break;
        default:
            break;
    }

    return `${baseEndpoint}/environments/${PacContext.AuthInfo?.EnvironmentId}/portals/home`;
}

const getActiveSitesUrl = () => `${getStudioUrl()}/?tab=active`;

const getInactiveSitesUrl = () => `${getStudioUrl()}/?tab=inactive`;

export const openActiveSitesInStudio = async () => await vscode.env.openExternal(vscode.Uri.parse(getActiveSitesUrl()));

export const openInactiveSitesInStudio = async () => await vscode.env.openExternal(vscode.Uri.parse(getInactiveSitesUrl()));

export const previewSite = async (siteTreeItem: SiteTreeItem) => {
    await PreviewSite.clearCache(siteTreeItem.siteInfo.websiteUrl);

    await PreviewSite.launchBrowserAndDevToolsWithinVsCode(siteTreeItem.siteInfo.websiteUrl);
};

export const createNewAuthProfile = async (pacWrapper: PacWrapper): Promise<void> => {
    try {
        const pacAuthCreateOutput = await createAuthProfileExp(pacWrapper);
        if (pacAuthCreateOutput && pacAuthCreateOutput.Status === SUCCESS) {
            const results = pacAuthCreateOutput.Results;
            if (Array.isArray(results) && results.length > 0) {
                const orgUrl = results[0].ActiveOrganization?.Item2;
                if (orgUrl) {
                    // DV authentication is required to ensure PAC and VSCode accounts are in sync
                    await dataverseAuthentication(orgUrl, true);
                } else {
                    oneDSLoggerWrapper.getLogger().traceError(
                        createNewAuthProfile.name,
                        Constants.EventNames.ORGANIZATION_URL_MISSING,
                        new Error(Constants.EventNames.ORGANIZATION_URL_MISSING),
                        {}
                    );
                }
            } else {
                oneDSLoggerWrapper.getLogger().traceError(
                    createNewAuthProfile.name,
                    Constants.EventNames.EMPTY_RESULTS_ARRAY,
                    new Error(Constants.EventNames.EMPTY_RESULTS_ARRAY),
                    {}
                );
            }
        } else {
            oneDSLoggerWrapper.getLogger().traceError(
                createNewAuthProfile.name,
                Constants.EventNames.PAC_AUTH_OUTPUT_FAILURE,
                new Error(Constants.EventNames.PAC_AUTH_OUTPUT_FAILURE),
                {}
            );
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(
            createNewAuthProfile.name,
            error as string,
            error as Error,
            { methodName: createNewAuthProfile.name },
            {}
        );
    }
};

export const fetchWebsites = async (): Promise<{ activeSites: IWebsiteDetails[], inactiveSites: IWebsiteDetails[], otherSites: IOtherSiteInfo[] }> => {
    try {
        const orgInfo = PacContext.OrgInfo;
        if (ArtemisContext.ServiceResponse?.stamp && orgInfo) {
            let allSites: IWebsiteDetails[] = [];
            let activeWebsiteDetails: IWebsiteDetails[] = [];
            [activeWebsiteDetails, allSites] = await Promise.all([
                getActiveWebsites(ArtemisContext.ServiceResponse?.stamp, orgInfo.EnvironmentId),
                getAllWebsites(orgInfo)
            ]);
            const activeSiteIds = new Set(activeWebsiteDetails.map(activeSite => activeSite.websiteRecordId));
            const inactiveWebsiteDetails = allSites?.filter(site => !activeSiteIds.has(site.websiteRecordId)) || [];
            activeWebsiteDetails = activeWebsiteDetails.map(detail => ({ ...detail, siteManagementUrl: allSites.find(site => site.websiteRecordId === detail.websiteRecordId)?.siteManagementUrl ?? "" }));

            const currentEnvSiteIds = createKnownSiteIdsSet(activeWebsiteDetails, inactiveWebsiteDetails);
            const otherSites = findOtherSites(currentEnvSiteIds);

            return { activeSites: activeWebsiteDetails, inactiveSites: inactiveWebsiteDetails, otherSites: otherSites };
        }
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED, error as string, error as Error, { methodName: fetchWebsites.name }, {});
    }

    return { activeSites: [], inactiveSites: [], otherSites: [] };
}

export const revealInOS = async () => {
    if (CurrentSiteContext.currentSiteFolderPath) {
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(CurrentSiteContext.currentSiteFolderPath));
    }
}

export const openSiteManagement = async (siteTreeItem: SiteTreeItem) => {
    if (!siteTreeItem.siteInfo.siteManagementUrl) {
        vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.SITE_MANAGEMENT_URL_NOT_FOUND));
        oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND, Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND, new Error(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND), { method: openSiteManagement.name });
        return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(siteTreeItem.siteInfo.siteManagementUrl));
}

export const uploadSite = async (siteTreeItem: SiteTreeItem) => {

    //Show a modal dialog to take confirmation from the user
    if (siteTreeItem.siteInfo.siteVisibility.toLowerCase() === Constants.SiteVisibility.PUBLIC) {
        const confirm = await vscode.window.showInformationMessage(
            Constants.Strings.SITE_UPLOAD_CONFIRMATION,
            { modal: true },
            Constants.Strings.YES
        );

        if (confirm !== Constants.Strings.YES) {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_CANCELLED, { methodName: uploadSite.name });
            return;
        }
    }
    oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE, { methodName: uploadSite.name });
    const websitePath = CurrentSiteContext.currentSiteFolderPath;
    const modelVersion = siteTreeItem.siteInfo.dataModelVersion;
    PacTerminal.getTerminal().sendText(`pac pages upload --path "${websitePath}" --modelVersion "${modelVersion}"`);
}

/**
 * Finds Power Pages sites in the parent folder that aren't in the known sites list
 * @param knownSiteIds Set of site IDs that should be excluded from results
 * @returns Array of site information objects for sites found in the parent folder
 */
export function findOtherSites(knownSiteIds: Set<string>, fsModule = fs, yamlModule = yaml): IOtherSiteInfo[] {
    // Get the workspace folders
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return [];
    }

    const currentWorkspaceFolder = workspaceFolders[0].uri.fsPath;
    const parentFolder = path.dirname(currentWorkspaceFolder);

    try {
        // Get directories in the parent folder
        const items = fsModule.readdirSync(parentFolder, { withFileTypes: true });
        const directories = items
            .filter(item => item.isDirectory())
            .map(item => path.join(parentFolder, item.name));

        // Make sure we include the current workspace folder
        if (!directories.includes(currentWorkspaceFolder)) {
            directories.push(currentWorkspaceFolder);
        }

        const otherSites: IOtherSiteInfo[] = [];

        // Check each directory for website.yml
        for (const dir of directories) {
            const websiteYamlPath = path.join(dir, WEBSITE_YML);

            if (fsModule.existsSync(websiteYamlPath)) {
                try {
                    // Use the utility function to get website record ID
                    const websiteId = getWebsiteRecordId(dir);
                    
                    // Only include sites that aren't already in active or inactive sites
                    if (websiteId && !knownSiteIds.has(websiteId.toLowerCase())) {
                        // Parse website.yml to get site details for the name
                        const yamlContent = fsModule.readFileSync(websiteYamlPath, UTF8_ENCODING);
                        const websiteData = yamlModule.parse(yamlContent) as WebsiteYaml;
                        
                        otherSites.push({
                            name: websiteData?.adx_name || path.basename(dir), // Use folder name as fallback
                            websiteId: websiteId,
                            folderPath: dir
                        });
                    }
                } catch (error) {
                    oneDSLoggerWrapper.getLogger().traceError(
                        Constants.EventNames.OTHER_SITES_YAML_PARSE_FAILED,
                        error as string,
                        error as Error,
                        { methodName: findOtherSites.name }
                    );
                }
            }
        }

        return otherSites;
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(
            Constants.EventNames.OTHER_SITES_FILESYSTEM_ERROR,
            error as string,
            error as Error,
            { methodName: findOtherSites.name }
        );
        return [];
    }
}

export function createKnownSiteIdsSet(
    activeSites: IWebsiteDetails[] | undefined, 
    inactiveSites: IWebsiteDetails[] | undefined
): Set<string> {
    const knownSiteIds = new Set<string>();
    
    activeSites?.forEach(site => {
        if (site.websiteRecordId) {
            knownSiteIds.add(site.websiteRecordId.toLowerCase());
        }
    });
    
    inactiveSites?.forEach(site => {
        if (site.websiteRecordId) {
            knownSiteIds.add(site.websiteRecordId.toLowerCase());
        }
    });
    
    return knownSiteIds;
}
