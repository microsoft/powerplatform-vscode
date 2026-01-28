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
import ArtemisContext from "../../ArtemisContext";
import { getActiveWebsites, getAllWebsites } from "../../../common/utilities/WebsiteUtil";
import { ServiceEndpointCategory } from "../../../common/services/Constants";
import { getWebsiteRecordId, getWebsiteYamlPath, hasWebsiteYaml } from "../../../common/utilities/WorkspaceInfoFinderUtil";
import { POWERPAGES_SITE_FOLDER, UTF8_ENCODING } from "../../../common/constants";
import { OrgInfo } from "../../pac/PacTypes";

/**
 * Common binary file extensions that cannot be diffed in the text diff viewer
 */
const BINARY_FILE_EXTENSIONS = new Set([
    // Images
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp", ".bmp", ".tiff", ".tif",
    // Fonts
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    // Media
    ".mp4", ".mp3", ".wav", ".ogg", ".webm", ".avi", ".mov",
    // Documents
    ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    // Archives
    ".zip", ".rar", ".7z", ".tar", ".gz",
    // Other binary
    ".exe", ".dll", ".so", ".dylib"
]);

/**
 * Checks if a file is a binary file based on its extension.
 * Binary files cannot be meaningfully diffed as text.
 * @param filePath The file path to check
 * @param includeSvg Whether to treat SVG as binary (true for diff viewing, false for export since SVG is text)
 * @returns True if the file is binary, false otherwise
 */
export function isBinaryFile(filePath: string, includeSvg: boolean = true): boolean {
    const lowerPath = filePath.toLowerCase();
    const lastDotIndex = lowerPath.lastIndexOf(".");

    if (lastDotIndex === -1) {
        return false;
    }

    const extension = lowerPath.substring(lastDotIndex);

    // SVG is text-based but may be treated as binary for diff viewing purposes
    if (extension === ".svg") {
        return includeSvg;
    }

    return BINARY_FILE_EXTENSIONS.has(extension);
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

export const fetchWebsites = async (orgInfo: OrgInfo, shouldReturnOtherSites: boolean): Promise<{ activeSites: IWebsiteDetails[], inactiveSites: IWebsiteDetails[], otherSites: IOtherSiteInfo[] }> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_FETCH_WEBSITES_CALLED, { methodName: fetchWebsites.name });
    try {
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
            const otherSites = shouldReturnOtherSites ? findOtherSites(currentEnvSiteIds) : [];

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

/**
 * Mapping of folder names to entity names for the Standard (ADX) data model.
 * Some folders require multiple entities due to parent-child relationships.
 * Key: folder name (lowercase), Value: array of entity names to include
 *
 * Based on the PAC CLI schema (CDSStarterPortal.xml) which defines the foldername attribute
 * for each entity.
 */
const FOLDER_TO_ENTITIES_ADX: ReadonlyMap<string, readonly string[]> = new Map([
    // Core content
    ["web-pages", ["adx_webpage"]],
    ["web-files", ["adx_webfile", "annotation"]], // annotation stores file content
    ["web-templates", ["adx_webtemplate"]],
    ["content-snippets", ["adx_contentsnippet"]],
    ["page-templates", ["adx_pagetemplate"]],

    // Navigation
    ["weblink-sets", ["adx_weblinkset", "adx_weblink"]],
    ["sitemarkers", ["adx_sitemarker"]],

    // Forms and lists
    ["basic-forms", ["adx_entityform", "adx_entityformmetadata"]],
    ["advanced-forms", ["adx_webform", "adx_webformstep", "adx_webformmetadata"]],
    ["lists", ["adx_entitylist"]],

    // Configuration
    ["site-settings", ["adx_sitesetting"]],
    ["publishing-states", ["adx_publishingstate"]],
    ["site-languages", ["adx_websitelanguage"]],

    // Security
    ["web-roles", ["adx_webrole"]],
    ["webpage-rules", ["adx_webpageaccesscontrolrule"]],
    ["website-accesss", ["adx_websiteaccess"]], // Note: typo in original schema (accesss)
    ["table-permissions", ["adx_entitypermission"]],
    ["column-permission-profiles", ["adx_columnpermissionprofile", "adx_columnpermission"]],

    // Advanced features
    ["polls", ["adx_poll", "adx_polloption"]],
    ["poll-placements", ["adx_pollplacement"]],
    ["blogs", ["adx_blog", "adx_blogpost"]],
    ["forums", ["adx_communityforum", "adx_communityforumaccesspermission", "adx_forumthreadtype"]],
    ["bot-consumers", ["adx_botconsumer"]],
    ["cloud-flow-consumer", ["adx_cloudflowconsumer"]],

    // Modern components
    ["ux-components", ["mspp_uxcomponent"]],
    ["server-logics", ["adx_serverlogic"]],
    ["source-files", ["adx_sourcefile"]],

    // Redirects and shortcuts
    ["redirects", ["adx_redirect"]],
    ["shortcuts", ["adx_shortcut"]],

    // Ads
    ["ads", ["adx_ad"]],
    ["ad-placements", ["adx_adplacement"]],
]);

/**
 * Extracts the top-level folder name from a comparison sub-path.
 * @param comparisonSubPath The relative path from site root (e.g., "web-pages/home" or "web-pages")
 * @returns The top-level folder name (e.g., "web-pages") or undefined if path is empty
 */
export function getTopLevelFolder(comparisonSubPath: string): string | undefined {
    if (!comparisonSubPath) {
        return undefined;
    }

    // Normalize path separators and get the first segment
    const normalizedPath = comparisonSubPath.replace(/\\/g, "/");
    const firstSegment = normalizedPath.split("/")[0];

    return firstSegment || undefined;
}

/**
 * Gets the entity names to include for a selective download based on the folder being compared.
 * Only applicable for Standard (ADX) data model.
 *
 * @param comparisonSubPath The relative path from site root to the folder being compared
 * @param dataModelVersion The data model version (1 = Standard, 2 = Enhanced)
 * @returns Array of entity names to include, or undefined if full download is needed
 */
export function getEntitiesToInclude(
    comparisonSubPath: string | undefined,
    dataModelVersion: 1 | 2
): string[] | undefined {
    // If no sub-path specified, download everything
    if (!comparisonSubPath) {
        return undefined;
    }

    const topLevelFolder = getTopLevelFolder(comparisonSubPath);
    if (!topLevelFolder) {
        return undefined;
    }

    const folderLower = topLevelFolder.toLowerCase();

    if (dataModelVersion === 1) {
        // Standard (ADX) model - use entity-based filtering
        const entities = FOLDER_TO_ENTITIES_ADX.get(folderLower);
        if (entities && entities.length > 0) {
            return [...entities];
        }
    }
    // Enhanced (Core) model - entity filtering is limited
    // The Enhanced model uses powerpagecomponent for most content,
    // and PAC CLI doesn't support filtering by component type.
    // For now, return undefined to download full site for Enhanced model.

    // Unknown folder or no mapping - download full site
    return undefined;
}

/**
 * Checks if a folder path supports selective download optimization.
 * This can be used to show UI hints about optimization availability.
 *
 * @param comparisonSubPath The relative path from site root
 * @param dataModelVersion The data model version (1 = Standard, 2 = Enhanced)
 * @returns True if selective download is supported for this path
 */
export function supportsSelectiveDownload(
    comparisonSubPath: string | undefined,
    dataModelVersion: 1 | 2
): boolean {
    return getEntitiesToInclude(comparisonSubPath, dataModelVersion) !== undefined;
}

/**
 * Gets all known folder names that support selective download.
 * Useful for documentation and testing.
 *
 * @param dataModelVersion The data model version (1 = Standard, 2 = Enhanced)
 * @returns Array of folder names that support selective download
 */
export function getSupportedFolders(dataModelVersion: 1 | 2): string[] {
    if (dataModelVersion === 1) {
        return Array.from(FOLDER_TO_ENTITIES_ADX.keys());
    }
    // Enhanced model doesn't support selective download yet
    return [];
}
