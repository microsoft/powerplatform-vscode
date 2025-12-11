/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import * as yaml from "yaml";
import path from "path";
import os from "os";
import { traceError, traceInfo } from "./TelemetryHelper";
import { Constants } from "./Constants";
import { IOtherSiteInfo, IWebsiteDetails, WebsiteYaml } from "../../../common/services/Interfaces";
import PacContext from "../../pac/PacContext";
import ArtemisContext from "../../ArtemisContext";
import { getActiveWebsites, getAllWebsites } from "../../../common/utilities/WebsiteUtil";
import { ServiceEndpointCategory } from "../../../common/services/Constants";
import { getWebsiteRecordId, getWebsiteYamlPath, hasWebsiteYaml } from "../../../common/utilities/WorkspaceInfoFinderUtil";
import { POWERPAGES_SITE_FOLDER, UTF8_ENCODING } from "../../../common/constants";

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

export const getDefaultCodeQLDatabasePath = (): string => {
    // Use a temporary directory for the CodeQL database
    const tempDir = os.tmpdir();
    const dbName = `codeql-database-${Date.now()}`;
    return path.join(tempDir, dbName);
};

const sortByCreatedOn = <T extends { createdOn?: string | null }>(item1: T, item2: T): number => {
    const date1 = new Date(item1.createdOn || '').valueOf(); //NaN if createdOn is null or undefined
    const date2 = new Date(item2.createdOn || '').valueOf();
    return date2 - date1; // Sort in descending order (newest first)
}

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

export const getStudioBaseUrl = (): string => {
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

/**
 * Recursively collects all files from a directory
 * @param dir Directory to scan
 * @param baseDir Base directory for calculating relative paths
 * @returns Map of relative path to absolute path
 */
export function getAllFiles(dir: string, baseDir: string = dir): Map<string, string> {
    const files = new Map<string, string>();

    if (!fs.existsSync(dir)) {
        return files;
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        // Skip folders starting with '.' like .github, .portalconfig etc.
        if (entry.name.startsWith(".")) {
            continue;
        }

        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const subFiles = getAllFiles(fullPath, baseDir);
            subFiles.forEach((value, key) => files.set(key, value));
        } else if (entry.isFile()) {
            const relativePath = path.relative(baseDir, fullPath);
            files.set(relativePath, fullPath);
        }
    }

    return files;
}
