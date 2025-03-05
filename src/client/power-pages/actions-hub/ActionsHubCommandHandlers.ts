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
import { isEdmEnvironment } from '../../../common/copilot/dataverseMetadata';
import { IWebsiteInfo } from './models/IWebsiteInfo';

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

        if (result === Constants.Strings.COPY_TO_CLIPBOARD) {
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

const getStudioBaseUrl = (): string => {
    const artemisContext = ArtemisContext.ServiceResponse;

    switch (artemisContext.stamp) {
        case ServiceEndpointCategory.TEST:
            return Constants.StudioEndpoints.TEST;
        case ServiceEndpointCategory.PREPROD:
            return Constants.StudioEndpoints.PREPROD;
        case ServiceEndpointCategory.PROD:
            return Constants.StudioEndpoints.PROD;
        case ServiceEndpointCategory.DOD:
            return Constants.StudioEndpoints.DOD;
        case ServiceEndpointCategory.GCC:
            return Constants.StudioEndpoints.GCC;
        case ServiceEndpointCategory.HIGH:
            return Constants.StudioEndpoints.HIGH;
        case ServiceEndpointCategory.MOONCAKE:
            return Constants.StudioEndpoints.MOONCAKE;
    }

    return "";
}

const getPPHomeUrl = (): string => {
    const baseEndpoint = getStudioBaseUrl();

    if (!baseEndpoint) {
        return "";
    }

    return `${baseEndpoint}/environments/${PacContext.AuthInfo?.EnvironmentId}/portals/home`;
}

const getActiveSitesUrl = () => `${getPPHomeUrl()}/?tab=active`;

const getInactiveSitesUrl = () => `${getPPHomeUrl()}/?tab=inactive`;

export const openActiveSitesInStudio = async () => await vscode.env.openExternal(vscode.Uri.parse(getActiveSitesUrl()));

export const openInactiveSitesInStudio = async () => await vscode.env.openExternal(vscode.Uri.parse(getInactiveSitesUrl()));

export const previewSite = async (siteTreeItem: SiteTreeItem) => {
    await PreviewSite.clearCache(siteTreeItem.siteInfo.websiteUrl);

    await PreviewSite.launchBrowserAndDevToolsWithinVsCode(siteTreeItem.siteInfo.websiteUrl, siteTreeItem.siteInfo.dataModelVersion, siteTreeItem.siteInfo.siteVisibility);
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

export const revealInOS = async (siteTreeItem: SiteTreeItem) => {
    let folderPath = CurrentSiteContext.currentSiteFolderPath;
    if (siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
        folderPath = siteTreeItem.siteInfo.folderPath || "";
    }

    if (!folderPath) {
        return;
    }

    await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(folderPath));
}

export const openSiteManagement = async (siteTreeItem: SiteTreeItem) => {
    if (!siteTreeItem.siteInfo.siteManagementUrl) {
        vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.SITE_MANAGEMENT_URL_NOT_FOUND));
        oneDSLoggerWrapper.getLogger().traceError(
            Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND,
            Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND,
            new Error(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND),
            { method: openSiteManagement.name }
        );
        return;
    }
    await vscode.env.openExternal(vscode.Uri.parse(siteTreeItem.siteInfo.siteManagementUrl));
}

/**
 * Uploads a Power Pages site to the environment
 * @param siteTreeItem The site tree item containing site information
 * @param websitePath The path to the website folder to upload. If not passed the current site context will be used.
 */
export const uploadSite = async (siteTreeItem: SiteTreeItem, websitePath: string) => {
    try {
        // Handle upload for "other" sites (sites not in the current environment)
        if (siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            await uploadOtherSite(siteTreeItem);
            return;
        }

        // Handle upload for active/inactive sites
        await uploadCurrentSite(siteTreeItem, websitePath);
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(
            Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED,
            error as string,
            error as Error,
            { methodName: uploadSite.name }
        );
    }
};

/**
 * Uploads a site that isn't in the current environment
 * @param siteTreeItem The site tree item containing site information
 */
async function uploadOtherSite(siteTreeItem: SiteTreeItem): Promise<void> {
    const websitePath = siteTreeItem.siteInfo.folderPath;

    if (!websitePath) {
        return;
    }

    // Check if EDM is supported to determine the correct model version
    let modelVersionParam = '';
    const currentOrgUrl = PacContext.OrgInfo?.OrgUrl ?? '';
    const dataverseAccessToken = await dataverseAuthentication(currentOrgUrl, true);

    if (dataverseAccessToken) {
        const isEdmSupported = await isEdmEnvironment(currentOrgUrl, dataverseAccessToken.accessToken);
        if (isEdmSupported) {
            modelVersionParam = ' --modelVersion 2';
        }
    }

    // Execute the upload command
    oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE, {
        methodName: uploadSite.name,
        siteId: siteTreeItem.siteInfo.websiteId,
        siteName: siteTreeItem.siteInfo.name
    });

    PacTerminal.getTerminal().sendText(`pac pages upload --path "${websitePath}" ${modelVersionParam}`);
}

/**
 * Uploads a site that's in the current environment
 * @param siteTreeItem The site tree item containing site information
 */
async function uploadCurrentSite(siteTreeItem: SiteTreeItem, websitePath: string): Promise<void> {
    // Public sites require confirmation to prevent accidental deployment
    if (siteTreeItem.siteInfo.siteVisibility?.toLowerCase() === Constants.SiteVisibility.PUBLIC) {
        const confirm = await vscode.window.showInformationMessage(
            Constants.Strings.SITE_UPLOAD_CONFIRMATION,
            { modal: true },
            Constants.Strings.YES
        );

        if (confirm !== Constants.Strings.YES) {
            oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_CANCELLED, {
                methodName: uploadSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                siteName: siteTreeItem.siteInfo.name
            });
            return;
        }
    }

    const websitePathToUpload = websitePath || CurrentSiteContext.currentSiteFolderPath;
    if (!websitePathToUpload) {
        vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.CURRENT_SITE_PATH_NOT_FOUND));
        return;
    }

    const modelVersion = siteTreeItem.siteInfo.dataModelVersion || 1;

    oneDSLoggerWrapper.getLogger().traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE, {
        methodName: uploadSite.name,
        siteId: siteTreeItem.siteInfo.websiteId,
        siteName: siteTreeItem.siteInfo.name,
        modelVersion: modelVersion.toString()
    });

    PacTerminal.getTerminal().sendText(`pac pages upload --path "${websitePathToUpload}" --modelVersion "${modelVersion}"`);
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

export const showSiteDetails = async (siteTreeItem: SiteTreeItem) => {
    const siteInfo = siteTreeItem.siteInfo;
    const details = [
        vscode.l10n.t({ message: "Friendly name: {0}", args: [siteInfo.name], comment: "{0} is the website name" }),
        vscode.l10n.t({ message: "Website ID: {0}", args: [siteInfo.websiteId], comment: "{0} is the website ID" }),
        vscode.l10n.t({ message: "Data model version: v{0}", args: [siteInfo.dataModelVersion], comment: "{0} is the data model version" })
    ].join('\n');

    const result = await vscode.window.showInformationMessage(Constants.Strings.SITE_DETAILS, { detail: details, modal: true }, Constants.Strings.COPY_TO_CLIPBOARD);

    if (result === Constants.Strings.COPY_TO_CLIPBOARD) {
        await vscode.env.clipboard.writeText(details);
    }
}

const getDownloadFolderOptions = () => {
    const options = [
        {
            label: Constants.Strings.BROWSE,
            iconPath: new vscode.ThemeIcon("folder")
        }
    ] as { label: string, iconPath: vscode.ThemeIcon | undefined }[];

    if (CurrentSiteContext.currentSiteFolderPath) {
        options.push({
            label: path.dirname(CurrentSiteContext.currentSiteFolderPath),
            iconPath: undefined
        });
    }

    return options;
}

const getDownloadPath = async () => {
    let downloadPath = "";
    const option = await vscode.window.showQuickPick(getDownloadFolderOptions(), {
        canPickMany: false,
        placeHolder: Constants.Strings.SELECT_DOWNLOAD_FOLDER
    });

    if (option?.label === Constants.Strings.BROWSE) {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: Constants.Strings.SELECT_FOLDER,
            title: Constants.Strings.SELECT_DOWNLOAD_FOLDER
        });

        if (folderUri && folderUri.length > 0) {
            downloadPath = folderUri[0].fsPath;
        }
    } else {
        downloadPath = option?.label || "";
    }
    return downloadPath;
}


const executeSiteDownloadCommand = (siteInfo: IWebsiteInfo, downloadPath: string) => {
    const modelVersion = siteInfo.dataModelVersion;
    const downloadCommandParts = ["pac", "pages", "download"];
    downloadCommandParts.push("--overwrite");
    downloadCommandParts.push(`--path "${downloadPath}"`);
    downloadCommandParts.push(`--webSiteId ${siteInfo.websiteId}`);
    downloadCommandParts.push(`--modelVersion "${modelVersion}"`);

    const downloadCommand = downloadCommandParts.join(" ");

    PacTerminal.getTerminal().sendText(downloadCommand);
}

export const downloadSite = async (siteTreeItem: SiteTreeItem) => {
    let downloadPath = "";
    const { siteInfo } = siteTreeItem;

    if (siteInfo.isCurrent && CurrentSiteContext.currentSiteFolderPath) {
        downloadPath = path.dirname(CurrentSiteContext.currentSiteFolderPath);
    } else {
        downloadPath = await getDownloadPath();
    }

    if (!downloadPath) {
        return;
    }

    executeSiteDownloadCommand(siteInfo, downloadPath);
}

const getStudioUrl = (environmentId: string, websiteId: string) => {
    if (!environmentId || !websiteId) {
        return "";
    }

    const baseEndpoint = getStudioBaseUrl();

    if (!baseEndpoint) {
        return "";
    }

    return `${baseEndpoint}/e/${environmentId}/sites/${websiteId}/pages`;
}

export const openInStudio = async (siteTreeItem: SiteTreeItem) => {
    const environmentId = PacContext.AuthInfo?.EnvironmentId || "";
    const studioUrl = getStudioUrl(environmentId, siteTreeItem.siteInfo.websiteId);

    if (!studioUrl) {
        return;
    }

    await vscode.env.openExternal(vscode.Uri.parse(studioUrl));
}
