/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as yaml from 'yaml';
import { Constants } from './Constants';
import { PacTerminal } from '../../lib/PacTerminal';
import { POWERPAGES_SITE_FOLDER, SUCCESS, UTF8_ENCODING, CODEQL_EXTENSION_ID } from '../../../common/constants';
import { AuthInfo, OrgListOutput } from '../../pac/PacTypes';
import { extractAuthInfo } from '../commonUtility';
import { showProgressWithNotification } from '../../../common/utilities/Utils';
import PacContext from '../../pac/PacContext';
import ArtemisContext from '../../ArtemisContext';
import { ServiceEndpointCategory, WebsiteDataModel, PROVIDER_ID } from '../../../common/services/Constants';
import { SiteTreeItem } from './tree-items/SiteTreeItem';
import { PreviewSite } from '../preview-site/PreviewSite';
import { PacWrapper } from '../../pac/PacWrapper';
import { authenticateUserInVSCode, dataverseAuthentication, serviceScopeMapping } from '../../../common/services/AuthenticationProvider';
import { createAuthProfileExp } from '../../../common/utilities/PacAuthUtil';
import { IOtherSiteInfo, IWebsiteDetails, WebsiteYaml } from '../../../common/services/Interfaces';
import { getActiveWebsites, getAllWebsites } from '../../../common/utilities/WebsiteUtil';
import CurrentSiteContext from './CurrentSiteContext';
import path from 'path';
import { getWebsiteRecordId, hasWebsiteYaml, getWebsiteYamlPath } from '../../../common/utilities/WorkspaceInfoFinderUtil';
import { isEdmEnvironment } from '../../../common/copilot/dataverseMetadata';
import { IWebsiteInfo } from './models/IWebsiteInfo';
import moment from 'moment';
import { SiteVisibility } from './models/SiteVisibility';
import { getBaseEventInfo, traceError, traceInfo } from './TelemetryHelper';
import { IPowerPagesConfig, IPowerPagesConfigData } from './models/IPowerPagesConfig';
import { oneDSLoggerWrapper } from '../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { CodeQLAction } from './actions/codeQLAction';
import { getDefaultCodeQLDatabasePath } from './ActionsHubUtils';

const sortByCreatedOn = <T extends { createdOn?: string | null }>(item1: T, item2: T): number => {
    const date1 = new Date(item1.createdOn || '').valueOf(); //NaN if createdOn is null or undefined
    const date2 = new Date(item2.createdOn || '').valueOf();
    return date2 - date1; // Sort in descending order (newest first)
}

export const refreshEnvironment = async (pacTerminal: PacTerminal) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_REFRESH_ENVIRONMENT_CALLED, { methodName: refreshEnvironment.name });
    const pacWrapper = pacTerminal.getWrapper();
    try {
        const pacActiveAuth = await pacWrapper.activeAuth();
        if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
            const authInfo = extractAuthInfo(pacActiveAuth.Results);
            PacContext.setContext(authInfo);
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_REFRESH_FAILED, error as Error, { methodName: refreshEnvironment.name });
    }
}

const getEnvironmentDetails = () => {
    const detailsArray = [];
    detailsArray.push(vscode.l10n.t({ message: "Timestamp: {0}", args: [new Date().toISOString()], comment: "{0} is the timestamp" }));

    const authInfo = PacContext.AuthInfo;
    const orgInfo = PacContext.OrgInfo;
    const artemisResponse = ArtemisContext.ServiceResponse.response;

    if (authInfo) {
        detailsArray.push(vscode.l10n.t({ message: "Session ID: {0}", args: [vscode.env.sessionId], comment: "{0} is the Session ID" }));
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
    traceInfo(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_CALLED, { methodName: showEnvironmentDetails.name });
    try {
        const message = Constants.Strings.SESSION_DETAILS;
        const details = getEnvironmentDetails();

        const result = await vscode.window.showInformationMessage(message, { detail: details, modal: true }, Constants.Strings.COPY_TO_CLIPBOARD);

        if (result === Constants.Strings.COPY_TO_CLIPBOARD) {
            await vscode.env.clipboard.writeText(details);
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED, error as Error, { methodName: showEnvironmentDetails.name });
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
    traceInfo(Constants.EventNames.ACTIONS_HUB_SWITCH_ENVIRONMENT_CALLED, { methodName: switchEnvironment.name });
    const pacWrapper = pacTerminal.getWrapper();
    const authInfo = PacContext.AuthInfo;

    try {
        if (authInfo) {
            const selectedEnv = await vscode.window.showQuickPick(getEnvironmentList(pacTerminal, authInfo),
                {
                    placeHolder: vscode.l10n.t(Constants.Strings.SELECT_ENVIRONMENT)
                }
            );

            if (selectedEnv && selectedEnv.label !== authInfo.OrganizationFriendlyName) {
                await showProgressWithNotification(Constants.Strings.CHANGING_ENVIRONMENT, async () => await pacWrapper.orgSelect(selectedEnv.detail));
                await vscode.window.showInformationMessage(Constants.Strings.ENVIRONMENT_CHANGED_SUCCESSFULLY);
            } else {
                traceInfo(Constants.EventNames.ACTIONS_HUB_SWITCH_ENVIRONMENT_CANCELLED, { methodName: switchEnvironment.name });
            }
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_SWITCH_ENVIRONMENT_FAILED, error as Error, { methodName: switchEnvironment.name });
    }
}

const getStudioBaseUrl = (): string => {
    const artemisContext = ArtemisContext.ServiceResponse;

    switch (artemisContext.stamp) {
        case ServiceEndpointCategory.TEST:
            return Constants.StudioEndpoints.TEST;
        case ServiceEndpointCategory.PREPROD:
            return Constants.StudioEndpoints.TEST; //Studio for preprod is same as test
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

export const openActiveSitesInStudio = async () => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_ACTIVE_SITES_IN_STUDIO_CALLED, { methodName: openActiveSitesInStudio.name });
    try {
        await vscode.env.openExternal(vscode.Uri.parse(getActiveSitesUrl()));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_OPEN_ACTIVE_SITES_IN_STUDIO_FAILED, error as Error, { methodName: openActiveSitesInStudio.name });
    }
};

export const openInactiveSitesInStudio = async () => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_INACTIVE_SITES_IN_STUDIO_CALLED, { methodName: openInactiveSitesInStudio.name });
    try {
        await vscode.env.openExternal(vscode.Uri.parse(getInactiveSitesUrl()));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_OPEN_INACTIVE_SITES_IN_STUDIO_FAILED, error as Error, { methodName: openInactiveSitesInStudio.name });
    }
};

export const previewSite = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_PREVIEW_SITE_CALLED, { methodName: previewSite.name });
    try {
        await PreviewSite.clearCache(siteTreeItem.siteInfo.websiteUrl);

        await PreviewSite.launchBrowserAndDevToolsWithinVsCode(siteTreeItem.siteInfo.websiteUrl, siteTreeItem.siteInfo.dataModelVersion, siteTreeItem.siteInfo.siteVisibility);
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_PREVIEW_SITE_FAILED, error as Error, { methodName: previewSite.name });
    }
};

export const createNewAuthProfile = async (pacWrapper: PacWrapper): Promise<void> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_CREATE_AUTH_PROFILE_CALLED, { methodName: createNewAuthProfile.name });
    try {
        const orgUrl = PacContext.OrgInfo?.OrgUrl ?? '';

        // if orgUrl is present then directly authenticate in VS Code
        if (orgUrl) {
            await authenticateUserInVSCode();
            return;
        }

        const pacAuthCreateOutput = await createAuthProfileExp(pacWrapper);
        if (pacAuthCreateOutput && pacAuthCreateOutput.Status === SUCCESS) {
            const results = pacAuthCreateOutput.Results;
            if (Array.isArray(results) && results.length > 0) {
                const orgUrl = results[0].ActiveOrganization?.Item2;
                if (orgUrl) {
                    await authenticateUserInVSCode();
                } else {
                    traceError(
                        createNewAuthProfile.name,
                        new Error(Constants.Strings.ORGANIZATION_URL_MISSING),
                        { methodName: createNewAuthProfile.name }
                    );
                }
            } else {
                traceError(
                    createNewAuthProfile.name,
                    new Error(Constants.Strings.EMPTY_RESULTS_ARRAY),
                    { methodName: createNewAuthProfile.name }
                );
            }
        } else {
            traceError(
                createNewAuthProfile.name,
                new Error(Constants.Strings.PAC_AUTH_OUTPUT_FAILURE),
                { methodName: createNewAuthProfile.name }
            );
        }
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_CREATE_AUTH_PROFILE_FAILED,
            error as Error,
            { methodName: createNewAuthProfile.name }
        );
    }
};

export const fetchWebsites = async (): Promise<{ activeSites: IWebsiteDetails[], inactiveSites: IWebsiteDetails[], otherSites: IOtherSiteInfo[] }> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_FETCH_WEBSITES_CALLED, { methodName: fetchWebsites.name });
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
            activeWebsiteDetails = activeWebsiteDetails.map(detail => {
                const site = allSites.find(site => site.websiteRecordId === detail.websiteRecordId);

                if (!site) {
                    return detail;
                }

                return {
                    ...detail,
                    siteManagementUrl: site.siteManagementUrl,
                    isCodeSite: site.isCodeSite,
                    createdOn: site.createdOn,
                    creator: site.creator,
                }
            });

            activeWebsiteDetails.sort(sortByCreatedOn);
            inactiveWebsiteDetails.sort(sortByCreatedOn);

            const currentEnvSiteIds = createKnownSiteIdsSet(activeWebsiteDetails, inactiveWebsiteDetails);
            const otherSites = findOtherSites(currentEnvSiteIds);

            return { activeSites: activeWebsiteDetails, inactiveSites: inactiveWebsiteDetails, otherSites: otherSites };
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_FETCH_WEBSITES_FAILED, error as Error, { methodName: fetchWebsites.name });
    }

    return { activeSites: [], inactiveSites: [], otherSites: [] };
}

export const revealInOS = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_REVEAL_IN_OS_CALLED, { methodName: revealInOS.name });
    try {
        let folderPath = CurrentSiteContext.currentSiteFolderPath;
        if (siteTreeItem && siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            folderPath = siteTreeItem.siteInfo.folderPath || "";
        }

        if (!folderPath) {
            return;
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_REVEAL_IN_OS_SUCCESSFUL, { methodName: revealInOS.name });
        await vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(folderPath));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_REVEAL_IN_OS_FAILED, error as Error, { methodName: revealInOS.name });
    }
}

export const openSiteManagement = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_SITE_MANAGEMENT_CALLED, { methodName: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId });
    try {
        if (!siteTreeItem.siteInfo.siteManagementUrl) {
            vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.SITE_MANAGEMENT_URL_NOT_FOUND));
            traceError(
                Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND,
                new Error(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND),
                { method: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            return;
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_OPEN_SITE_MANAGEMENT_SUCCESSFUL, { methodName: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId });
        await vscode.env.openExternal(vscode.Uri.parse(siteTreeItem.siteInfo.siteManagementUrl));
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_OPEN_SITE_MANAGEMENT_FAILED, error as Error, { methodName: openSiteManagement.name, siteId: siteTreeItem.siteInfo.websiteId });
    }
}

/**
 * Uploads a Power Pages site to the environment
 * @param siteTreeItem The site tree item containing site information
 * @param websitePath The path to the website folder to upload. If not passed the current site context will be used.
 */
export const uploadSite = async (siteTreeItem: SiteTreeItem, websitePath: string) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_CALLED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId });
    try {
        // Handle upload for "other" sites (sites not in the current environment)
        if (siteTreeItem && siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            await uploadOtherSite(siteTreeItem);
            return;
        }

        // Handle upload for active/inactive sites
        await uploadCurrentSite(siteTreeItem, websitePath);
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED,
            error as Error,
            { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId }
        );
    }
};

/**
 * Reads and parses the powerpages.config.json file
 * @param configFilePath Path to the configuration file
 * @returns Parsed configuration data
 */
const readPowerPagesConfig = (configFilePath: string): IPowerPagesConfigData => {
    if (!fs.existsSync(configFilePath)) {
        return { hasCompiledPath: false, hasSiteName: false };
    }

    try {
        const configContent = fs.readFileSync(configFilePath, UTF8_ENCODING);
        const config: IPowerPagesConfig = JSON.parse(configContent);

        const hasCompiledPath = Boolean(config?.compiledPath);
        const hasSiteName = Boolean(config?.siteName);

        return { hasCompiledPath, hasSiteName };
    } catch (configError) {
        traceError(Constants.EventNames.POWER_PAGES_CONFIG_PARSE_FAILED, configError as Error, { methodName: readPowerPagesConfig.name });
    }
    return { hasCompiledPath: false, hasSiteName: false };
};

/**
 * Builds the upload code site command for pac pages upload-code-site
 * @param uploadPath Root path for the upload
 * @param siteInfo Site information
 * @param configData Configuration data
 * @returns The complete upload command as a string
 */
const buildUploadCodeSiteCommand = async (
    uploadPath: string,
    siteInfo: IWebsiteInfo,
    configData: IPowerPagesConfigData
): Promise<string> => {
    const commandParts = ["pac", "pages", "upload-code-site"];

    commandParts.push("--rootPath", `"${uploadPath}"`);

    if (!configData.hasCompiledPath) {
        const compiledPath = await getCompiledOutputFolderPath();
        if (!compiledPath) {
            await vscode.window.showErrorMessage(
                vscode.l10n.t(Constants.Strings.UPLOAD_CODE_SITE_COMPILED_OUTPUT_FOLDER_NOT_FOUND)
            );
            return "";
        }
        commandParts.push("--compiledPath", `"${compiledPath}"`);
    }

    if (!configData.hasSiteName) {
        commandParts.push("--siteName", `"${siteInfo.name}"`);
    }

    return commandParts.join(" ");
};

/**
 * Uploads a Power Pages code site to the environment
 * @param siteInfo Information about the site to upload
 * @param uploadPath Path to the site folder to upload
 */
const uploadCodeSite = async (siteInfo: IWebsiteInfo, uploadPath: string) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_CALLED, {
        methodName: uploadCodeSite.name,
        siteIdToUpload: siteInfo.websiteId
    });

    try {
        const configFilePath = path.join(uploadPath, Constants.Strings.POWER_PAGES_CONFIG_FILE_NAME);
        const configData = readPowerPagesConfig(configFilePath);

        const uploadCommand = await buildUploadCodeSiteCommand(
            uploadPath,
            siteInfo,
            configData
        );

        if (!uploadCommand) {
            return;
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_PAC_TRIGGERED, {
            methodName: uploadCodeSite.name,
            siteIdToUpload: siteInfo.websiteId
        });

        PacTerminal.getTerminal().sendText(uploadCommand);
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_FAILED, error as Error, {
            methodName: uploadCodeSite.name,
            siteIdToUpload: siteInfo.websiteId
        });
        await vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.UPLOAD_CODE_SITE_FAILED));
    }
};

/**
 * Uploads a site that isn't in the current environment
 * @param siteTreeItem The site tree item containing site information
 */
async function uploadOtherSite(siteTreeItem: SiteTreeItem): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_CALLED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId });
    const websitePath = siteTreeItem.siteInfo.folderPath;

    if (!websitePath) {
        return;
    }

    if (siteTreeItem.siteInfo.isCodeSite) {
        await uploadCodeSite(siteTreeItem.siteInfo, websitePath);
        return;
    }

    // Check if EDM is supported to determine the correct model version
    let modelVersionParam = '';
    let dataModelVersion = 1;
    const currentOrgUrl = PacContext.OrgInfo?.OrgUrl ?? '';
    const dataverseAccessToken = await dataverseAuthentication(currentOrgUrl, true);

    if (dataverseAccessToken) {
        const isEdmSupported = await isEdmEnvironment(currentOrgUrl, dataverseAccessToken.accessToken);
        if (isEdmSupported) {
            modelVersionParam = '--modelVersion 2';
            dataModelVersion = 2;
        }
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_PAC_TRIGGERED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId, dataModelVersion });
    PacTerminal.getTerminal().sendText(`pac pages upload --path "${websitePath}" ${modelVersionParam}`);
}

/**
 * Uploads a site that's in the current environment
 * @param siteTreeItem The site tree item containing site information
 */
async function uploadCurrentSite(siteTreeItem: SiteTreeItem, websitePath: string): Promise<void> {
    traceInfo(
        Constants.EventNames.ACTIONS_HUB_UPLOAD_CURRENT_SITE_CALLED,
        {
            methodName: uploadSite.name,
            siteIdToUpload: siteTreeItem.siteInfo.websiteId,
            modelVersion: siteTreeItem.siteInfo.dataModelVersion
        }
    );

    // Public sites require confirmation to prevent accidental deployment
    if (siteTreeItem.siteInfo.siteVisibility?.toLowerCase() === SiteVisibility.Public) {
        const confirm = await vscode.window.showInformationMessage(
            Constants.Strings.SITE_UPLOAD_CONFIRMATION,
            { modal: true },
            Constants.Strings.YES
        );

        if (confirm !== Constants.Strings.YES) {
            traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CURRENT_SITE_CANCELLED_PUBLIC_SITE, {
                methodName: uploadSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                modelVersion: siteTreeItem.siteInfo.dataModelVersion
            });
            return;
        }
    }

    const websitePathToUpload = websitePath || CurrentSiteContext.currentSiteFolderPath;
    if (!websitePathToUpload) {
        vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.CURRENT_SITE_PATH_NOT_FOUND));
        return;
    }

    if (siteTreeItem.siteInfo.isCodeSite) {
        await uploadCodeSite(siteTreeItem.siteInfo, websitePathToUpload);
        return;
    }

    const modelVersion = siteTreeItem.siteInfo.dataModelVersion || 1;

    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CURRENT_SITE_PAC_TRIGGERED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId, dataModelVersion: modelVersion });
    PacTerminal.getTerminal().sendText(`pac pages upload --path "${websitePathToUpload}" --modelVersion "${modelVersion}"`);
}

/**
 * Finds Power Pages sites in the parent folder that aren't in the known sites list
 * @param knownSiteIds Set of site IDs that should be excluded from results
 * @returns Array of site information objects for sites found in the parent folder
 */
export function findOtherSites(knownSiteIds: Set<string>, fsModule = fs, yamlModule = yaml): IOtherSiteInfo[] {
    traceInfo(Constants.EventNames.ACTIONS_HUB_FIND_OTHER_SITES_CALLED, { methodName: findOtherSites.name });

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

        // Check each directory for website.yml or .powerpages-site folder
        const otherSites: IOtherSiteInfo[] = [];
        for (const dir of directories) {
            let websiteYamlPath = getWebsiteYamlPath(dir);
            let hasWebsiteYamlFile = hasWebsiteYaml(dir);
            const powerPagesSiteFolderExists = fs.existsSync(dir)
            let workingDir = dir;

            if (powerPagesSiteFolderExists) {
                workingDir = path.join(dir, POWERPAGES_SITE_FOLDER);
                websiteYamlPath = getWebsiteYamlPath(workingDir);
                hasWebsiteYamlFile = hasWebsiteYaml(workingDir);
            }

            if (hasWebsiteYamlFile) {
                try {
                    // Use the utility function to get website record ID
                    const websiteId = getWebsiteRecordId(workingDir);

                    // Only include sites that aren't already in active or inactive sites
                    if (websiteId && !knownSiteIds.has(websiteId.toLowerCase())) {
                        // Parse website.yml to get site details for the name
                        const yamlContent = fsModule.readFileSync(websiteYamlPath, UTF8_ENCODING);
                        const websiteData = yamlModule.parse(yamlContent) as WebsiteYaml;

                        otherSites.push({
                            name: websiteData?.adx_name || websiteData?.name || path.basename(dir), // Use folder name as fallback
                            websiteId: websiteId,
                            folderPath: dir,
                            isCodeSite: powerPagesSiteFolderExists
                        });
                    }
                } catch (error) {
                    traceError(
                        Constants.EventNames.ACTIONS_HUB_FIND_OTHER_SITES_YAML_PARSE_FAILED,
                        error as Error,
                        { methodName: findOtherSites.name }
                    );
                }
            }
        }

        return otherSites;
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_FIND_OTHER_SITES_FAILED,
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

    traceInfo(
        Constants.EventNames.ACTIONS_HUB_SHOW_SITE_DETAILS_CALLED,
        {
            methodName: showSiteDetails.name,
            siteId: siteInfo.websiteId,
            dataModelVersion: siteInfo.dataModelVersion
        }
    );

    try {
        const details = [
            vscode.l10n.t({ message: "Friendly name: {0}", args: [siteInfo.name], comment: "{0} is the website name" }),
            vscode.l10n.t({ message: "Website Id: {0}", args: [siteInfo.websiteId], comment: "{0} is the website ID" }),
            vscode.l10n.t({ message: "Data model version: {0}", args: [siteInfo.dataModelVersion === 1 ? WebsiteDataModel.Standard : WebsiteDataModel.Enhanced], comment: "{0} is the data model version" })
        ];

        if (siteInfo.websiteUrl) {
            details.push(vscode.l10n.t({ message: "Website Url: {0}", args: [siteInfo.websiteUrl], comment: "{0} is the website Url" }));
        }

        if (siteInfo.siteVisibility) {
            const visibility = siteInfo.siteVisibility.charAt(0).toUpperCase() + siteInfo.siteVisibility.slice(1).toLowerCase();
            details.push(vscode.l10n.t({ message: "Site visibility: {0}", args: [visibility], comment: "{0} is the site visibility" }));
        }

        details.push(vscode.l10n.t({ message: "Creator: {0}", args: [siteInfo.creator], comment: "{0} is the creator" }));
        details.push(vscode.l10n.t({ message: "Created on: {0}", args: [moment(siteInfo.createdOn).format('LL')], comment: "{0} is the created date" }));

        const formattedDetails = details.join('\n');

        const result = await vscode.window.showInformationMessage(Constants.Strings.SITE_DETAILS, { detail: formattedDetails, modal: true }, Constants.Strings.COPY_TO_CLIPBOARD);

        if (result === Constants.Strings.COPY_TO_CLIPBOARD) {
            traceInfo(
                Constants.EventNames.ACTIONS_HUB_SHOW_SITE_DETAILS_COPY_TO_CLIPBOARD,
                {
                    methodName: showSiteDetails.name,
                    siteId: siteInfo.websiteId,
                    dataModelVersion: siteInfo.dataModelVersion
                }
            );
            await vscode.env.clipboard.writeText(formattedDetails);
        }
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_SHOW_SITE_DETAILS_FAILED,
            error as Error,
            {
                methodName: showSiteDetails.name,
                siteId: siteInfo.websiteId,
                dataModelVersion: siteInfo.dataModelVersion
            }
        );
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

const getCompiledOutputFolderOptions = () => {
    const options = [
        {
            label: Constants.Strings.BROWSE,
            iconPath: new vscode.ThemeIcon("folder")
        }
    ] as { label: string, iconPath: vscode.ThemeIcon | undefined }[];

    return options;
}

const getCompiledOutputFolderPath = async () => {
    let compiledOutputPath = "";

    const option = await vscode.window.showQuickPick(getCompiledOutputFolderOptions(), {
        canPickMany: false,
        placeHolder: Constants.Strings.SELECT_COMPILED_OUTPUT_FOLDER
    });

    if (option?.label === Constants.Strings.BROWSE) {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: Constants.Strings.SELECT_FOLDER,
            title: Constants.Strings.SELECT_COMPILED_OUTPUT_FOLDER
        });

        if (folderUri && folderUri.length > 0) {
            compiledOutputPath = folderUri[0].fsPath;
        }
    } else {
        compiledOutputPath = option?.label || "";
    }
    return compiledOutputPath;

}

const getDownloadPath = async () => {
    let downloadPath = "";
    const config = vscode.workspace.getConfiguration(Constants.Strings.CONFIGURATION_NAME);
    const hasConfiguredDownloadPath = config.has(Constants.Strings.DOWNLOAD_SETTING_NAME);

    if (hasConfiguredDownloadPath) {
        const configuredDownloadPath = config.get<string>(Constants.Strings.DOWNLOAD_SETTING_NAME) || "";
        if (fs.existsSync(configuredDownloadPath)) {
            return configuredDownloadPath;
        }
    }

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

const executeCodeSiteDownloadCommand = (siteInfo: IWebsiteInfo, downloadPath: string) => {
    const downloadCommandParts = ["pac", "pages", "download-code-site"];
    downloadCommandParts.push("--overwrite");
    downloadCommandParts.push(`--path "${downloadPath}"`);
    downloadCommandParts.push(`--webSiteId ${siteInfo.websiteId}`);

    const downloadCommand = downloadCommandParts.join(" ");

    traceInfo(
        Constants.EventNames.ACTIONS_HUB_DOWNLOAD_CODE_SITE_PAC_TRIGGERED,
        {
            methodName: executeCodeSiteDownloadCommand.name,
            siteId: siteInfo.websiteId
        }
    );
    PacTerminal.getTerminal().sendText(downloadCommand);
}

const executeSiteDownloadCommand = (siteInfo: IWebsiteInfo, downloadPath: string) => {
    const modelVersion = siteInfo.dataModelVersion;
    const downloadCommandParts = ["pac", "pages", "download"];
    downloadCommandParts.push("--overwrite");
    downloadCommandParts.push(`--path "${downloadPath}"`);
    downloadCommandParts.push(`--webSiteId ${siteInfo.websiteId}`);
    downloadCommandParts.push(`--modelVersion "${modelVersion}"`);

    const downloadCommand = downloadCommandParts.join(" ");

    traceInfo(
        Constants.EventNames.ACTIONS_HUB_DOWNLOAD_SITE_PAC_TRIGGERED,
        {
            methodName: executeSiteDownloadCommand.name,
            siteId: siteInfo.websiteId,
            dataModelVersion: modelVersion
        }
    );
    PacTerminal.getTerminal().sendText(downloadCommand);
}

export const downloadSite = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(
        Constants.EventNames.ACTIONS_HUB_DOWNLOAD_SITE_CALLED,
        {
            methodName: downloadSite.name,
            siteId: siteTreeItem.siteInfo.websiteId,
            dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
        }
    );

    try {
        let downloadPath = "";
        const { siteInfo } = siteTreeItem;

        if (siteInfo && siteInfo.isCurrent && CurrentSiteContext.currentSiteFolderPath) {
            downloadPath = path.dirname(CurrentSiteContext.currentSiteFolderPath);
        } else {
            downloadPath = await getDownloadPath();
        }

        if (!downloadPath) {
            return;
        }

        if (siteInfo.isCodeSite) {
            executeCodeSiteDownloadCommand(siteInfo, downloadPath);
        } else {
            executeSiteDownloadCommand(siteInfo, downloadPath);
        }
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_DOWNLOAD_SITE_FAILED,
            error as Error,
            {
                methodName: downloadSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );
    }
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
    traceInfo(
        Constants.EventNames.ACTIONS_HUB_OPEN_SITE_IN_STUDIO_CALLED,
        {
            methodName: openInStudio.name,
            siteId: siteTreeItem.siteInfo.websiteId,
            dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
        }
    );
    try {
        const environmentId = PacContext.AuthInfo?.EnvironmentId || "";
        const studioUrl = getStudioUrl(environmentId, siteTreeItem.siteInfo.websiteId);

        if (!studioUrl) {
            return;
        }

        await vscode.env.openExternal(vscode.Uri.parse(studioUrl));
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_OPEN_SITE_IN_STUDIO_FAILED,
            error as Error,
            {
                methodName: openInStudio.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );
    }
}

export const reactivateSite = async (siteTreeItem: SiteTreeItem) => {
    const { websiteId, name, websiteUrl, languageCode, dataModelVersion } = siteTreeItem.siteInfo;
    const environmentId = PacContext.AuthInfo?.EnvironmentId || "";

    if (!websiteId || !environmentId || !name || !languageCode || !dataModelVersion) {
        oneDSLoggerWrapper.getLogger().traceError(Constants.EventNames.ACTIONS_HUB_SITE_REACTIVATION_FAILED, Constants.Strings.MISSING_REACTIVATION_URL_INFO, new Error(Constants.Strings.MISSING_REACTIVATION_URL_INFO), { methodName: reactivateSite.name, ...getBaseEventInfo() });

        await vscode.window.showErrorMessage(Constants.Strings.MISSING_REACTIVATION_URL_INFO);
        return;
    }

    const isNewDataModel = siteTreeItem.siteInfo.dataModelVersion === 2;

    let siteAddress = websiteUrl;
    if(siteAddress === null || siteAddress === undefined) {
        siteAddress = ""; // Studio generates a new URL for the site
    }

    const reactivateSiteUrl = `${getStudioBaseUrl()}/e/${environmentId}/portals/create?reactivateWebsiteId=${websiteId}&siteName=${encodeURIComponent(name)}&siteAddress=${encodeURIComponent(siteAddress)}&siteLanguageId=${languageCode}&isNewDataModel=${isNewDataModel}`;

    await vscode.env.openExternal(vscode.Uri.parse(reactivateSiteUrl));
};

export const runCodeQLScreening = async (siteTreeItem?: SiteTreeItem) => {
    const startTime = Date.now();
    let siteInfo = null;

    if (siteTreeItem) {
        siteInfo = {
            websiteId: siteTreeItem.siteInfo.websiteId,
            contextValue: siteTreeItem.contextValue,
            isCodeSite: siteTreeItem.siteInfo.isCodeSite,
            dataModelVersion: siteTreeItem.siteInfo.dataModelVersion,
            hasValidPath: !!siteTreeItem.siteInfo.folderPath
        };
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_STARTED, {
        methodName: runCodeQLScreening.name,
        hasSiteTreeItem: !!siteTreeItem,
        siteInfo: siteInfo,
        ...getBaseEventInfo()
    });

    try {
        // Get the current site path
        let sitePath = "";
        if (siteTreeItem && siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            sitePath = siteTreeItem.siteInfo.folderPath || "";
        } else {
            sitePath = CurrentSiteContext.currentSiteFolderPath || "";
        }

        if (!sitePath) {
            await vscode.window.showErrorMessage(Constants.Strings.CODEQL_CURRENT_SITE_PATH_NOT_FOUND);

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_FAILED, new Error('Site path not found'), {
                methodName: runCodeQLScreening.name,
                reason: 'site_path_not_found',
                duration: Date.now() - startTime,
                siteInfo: siteInfo,
                ...getBaseEventInfo()
            });

            return;
        }

        const powerPagesSiteFolderExists = fs.existsSync(sitePath);

        // Check if CodeQL extension is installed
        const codeQLExtension = vscode.extensions.getExtension(CODEQL_EXTENSION_ID);

        if (!codeQLExtension) {
                                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_PROMPTED, {
                methodName: runCodeQLScreening.name,
                extensionId: CODEQL_EXTENSION_ID,
                sitePath: sitePath,
                powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                siteInfo: siteInfo,
                ...getBaseEventInfo()
            });

            // Prompt user to install the CodeQL extension
            const install = await vscode.window.showWarningMessage(
                Constants.Strings.CODEQL_EXTENSION_NOT_INSTALLED,
                Constants.Strings.INSTALL,
                Constants.Strings.CANCEL
            );

            if (install === Constants.Strings.INSTALL) {
                                    traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_ACCEPTED, {
                    methodName: runCodeQLScreening.name,
                    userAction: 'install_extension',
                    extensionId: CODEQL_EXTENSION_ID,
                    sitePath: sitePath,
                    powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                    siteInfo: siteInfo,
                    ...getBaseEventInfo()
                });

                await vscode.commands.executeCommand('workbench.extensions.installExtension', CODEQL_EXTENSION_ID);
                return;
            } else {
                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_DECLINED, {
                    methodName: runCodeQLScreening.name,
                    userAction: 'cancelled_install',
                    extensionId: CODEQL_EXTENSION_ID,
                    duration: Date.now() - startTime,
                    siteInfo: siteInfo,
                    ...getBaseEventInfo()
                });
                return;
            }
        }

        // Extension is already installed, log this event
        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_FOUND, {
            methodName: runCodeQLScreening.name,
            extensionId: CODEQL_EXTENSION_ID,
            sitePath: sitePath,
            powerPagesSiteFolderExists: powerPagesSiteFolderExists,
            siteInfo: siteInfo,
            ...getBaseEventInfo()
        });

        // Use default database location (site folder)
        const databaseLocation = getDefaultCodeQLDatabasePath();

        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_DATABASE_CREATED, {
            methodName: runCodeQLScreening.name,
            sitePath: sitePath,
            databaseLocation: databaseLocation,
            powerPagesSiteFolderExists: powerPagesSiteFolderExists,
            extensionAlreadyInstalled: true,
            siteInfo: siteInfo,
            ...getBaseEventInfo()
        });

        const codeQLAction = new CodeQLAction();

        try {
            const analysisResults = await showProgressWithNotification(
                Constants.Strings.CODEQL_SCREENING_STARTED,
                async () => {
                    // Use a custom method that allows specifying the database location
                    return await codeQLAction.executeCodeQLAnalysisWithCustomPath(sitePath, databaseLocation, powerPagesSiteFolderExists);
                }
            );

            const duration = Date.now() - startTime;
            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_COMPLETED, {
                methodName: runCodeQLScreening.name,
                sitePath: sitePath,
                databaseLocation: databaseLocation,
                powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                duration: duration,
                issuesFound: analysisResults?.issueCount || 0,
                hasIssues: (analysisResults?.issueCount || 0) > 0,
                siteInfo: siteInfo,
                ...getBaseEventInfo()
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            traceError(
                Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_FAILED,
                error as Error,
                {
                    methodName: runCodeQLScreening.name,
                    sitePath: sitePath,
                    databaseLocation: databaseLocation,
                    powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                    duration: duration,
                    errorMessage: errorMessage,
                    siteInfo: siteInfo,
                    ...getBaseEventInfo()
                }
            );
            await vscode.window.showErrorMessage(Constants.Strings.CODEQL_SCREENING_FAILED);
        } finally {
            codeQLAction.dispose();
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        traceError(
            Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_FAILED,
            error as Error,
            {
                methodName: runCodeQLScreening.name,
                duration: duration,
                errorMessage: errorMessage,
                siteInfo: siteInfo,
                ...getBaseEventInfo()
            }
        );
        await vscode.window.showErrorMessage(Constants.Strings.CODEQL_SCREENING_FAILED);
    }
};


export const loginToMatch = async (serviceEndpointStamp: ServiceEndpointCategory): Promise<void> => {
    // Also track that user clicked the login prompt
    traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_PROMPT_CLICKED, {
        methodName: loginToMatch.name,
        serviceEndpointStamp: serviceEndpointStamp || 'undefined'
    });

    try {
        // Force VS Code authentication flow by clearing existing session and creating a new one
        // This will ensure the authentication dialog is shown even if user is already authenticated
        const PPAPI_WEBSITES_ENDPOINT = serviceScopeMapping[serviceEndpointStamp];

        traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CALLED, {
            methodName: loginToMatch.name,
            endpoint: PPAPI_WEBSITES_ENDPOINT || 'undefined',
            hasEndpoint: !!PPAPI_WEBSITES_ENDPOINT,
            serviceEndpointStamp: serviceEndpointStamp || 'undefined'
        });

        const session = await vscode.authentication.getSession(PROVIDER_ID, [PPAPI_WEBSITES_ENDPOINT], {
            clearSessionPreference: true,
            forceNewSession: true
        });

        if (session) {
            traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_SUCCEEDED, {
                methodName: loginToMatch.name,
                hasAccessToken: !!session.accessToken,
                accountId: session.account?.id || 'undefined',
                sessionScopes: session.scopes?.length || 0,
                serviceEndpointStamp: serviceEndpointStamp || 'undefined'
            });
        } else {
            traceInfo(Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_CANCELLED, {
                methodName: loginToMatch.name,
                reason: 'no_session_returned',
                serviceEndpointStamp: serviceEndpointStamp || 'undefined'
            });
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorType = error instanceof Error ? error.constructor.name : typeof error;

        traceError(
            Constants.EventNames.ACTIONS_HUB_LOGIN_TO_MATCH_FAILED,
            error as Error,
            {
                methodName: loginToMatch.name,
                errorType: errorType,
                errorMessage: errorMessage,
                serviceEndpointStamp: serviceEndpointStamp || 'undefined',
                hasStamp: !!serviceEndpointStamp
            }
        );

        await vscode.window.showErrorMessage(
            Constants.Strings.AUTHENTICATION_FAILED
        );
    }
};
