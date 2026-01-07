/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { Constants } from "../../Constants";
import { traceInfo } from "../../TelemetryHelper";
import { findPowerPagesSiteFolder, findWebsiteYmlFolder, getWebsiteRecordId } from "../../../../../common/utilities/WorkspaceInfoFinderUtil";
import { POWERPAGES_SITE_FOLDER } from "../../../../../common/constants";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import { FileComparisonStatus, IFileComparisonResult } from "../../models/IFileComparisonResult";
import { SiteVisibility } from "../../models/SiteVisibility";
import { getAllFiles } from "../../ActionsHubUtils";
import MetadataDiffContext from "../../MetadataDiffContext";
import PacContext from "../../../../pac/PacContext";

const GITIGNORE_FILE_NAME = ".gitignore";
const POWERPAGES_CONFIG_FILE_NAME = "powerpages.config.json";

/**
 * Patterns that are always ignored when comparing source files in code sites.
 * These match the patterns used in the PAC CLI for code site uploads.
 */
const ALWAYS_IGNORE_PATTERNS: readonly string[] = [
    ".git/**",
    ".github/**",
    "node_modules/**",
    `${POWERPAGES_SITE_FOLDER}/**`
];

/**
 * Configuration from powerpages.config.json
 * @see https://www.schemastore.org/powerpages.config.json
 */
export interface PowerPagesConfig {
    /** The name of the website */
    siteName?: string;
    /** The path of the default HTML page to load when opening the website */
    defaultLandingPage?: string;
    /** The path of the compiled output directory relative to powerpages.config.json file */
    compiledPath?: string;
    /** List of glob patterns identifying file patterns to be cleaned up from web-files */
    bundleFilePatterns?: string[];
    /** Whether to include source code when uploading files to Power Pages */
    includeSource?: boolean;
    /** List of glob patterns identifying source file patterns to be excluded when uploading */
    sourceExcludePatterns?: string[];
}

/**
 * Reads and parses the powerpages.config.json file from the given directory
 * @param rootPath The root directory containing the config file
 * @returns The parsed config or undefined if not found or invalid
 */
export function readPowerPagesConfig(rootPath: string): PowerPagesConfig | undefined {
    const configPath = path.join(rootPath, POWERPAGES_CONFIG_FILE_NAME);

    if (!fs.existsSync(configPath)) {
        return undefined;
    }

    try {
        const configContent = fs.readFileSync(configPath, "utf8");
        return JSON.parse(configContent) as PowerPagesConfig;
    } catch {
        // Invalid JSON or read error - return undefined
        return undefined;
    }
}

/**
 * Represents a gitignore rule with its pattern and negation status
 */
interface GitIgnoreRule {
    pattern: RegExp;
    isNegation: boolean;
}

/**
 * Normalizes a gitignore pattern for regex conversion
 * @param pattern The raw pattern from .gitignore
 * @returns Normalized pattern
 */
function normalizePattern(pattern: string): string {
    let normalized = pattern.replace(/\\/g, "/");

    if (normalized.startsWith("./")) {
        normalized = normalized.substring(2);
    }

    if (normalized.startsWith("/")) {
        normalized = normalized.substring(1);
    }

    if (normalized.endsWith("/")) {
        normalized += "**";
    }

    return normalized;
}

/**
 * Converts a glob pattern to a regular expression
 * @param pattern The glob pattern to convert
 * @returns Regular expression matching the glob pattern
 */
function globToRegex(pattern: string): RegExp {
    const regexPattern = pattern
        .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape special regex chars except * and ?
        .replace(/\*\*/g, "{{DOUBLE_STAR}}") // Temporarily replace ** to avoid conflict
        .replace(/\*/g, "[^/]*") // * matches anything except /
        .replace(/\?/g, "[^/]") // ? matches single char except /
        .replace(/\{\{DOUBLE_STAR\}\}/g, ".*"); // ** matches anything including /

    return new RegExp("^" + regexPattern + "$", "i");
}

/**
 * Parses a gitignore line and adds it to the rules list
 * @param rawPattern The raw line from .gitignore
 * @param rules The list of rules to add to
 */
function addGitIgnoreRule(rawPattern: string, rules: GitIgnoreRule[]): void {
    const line = rawPattern.trim();

    // Skip empty lines and comments
    if (!line || line.startsWith("#")) {
        return;
    }

    const isNegation = line.startsWith("!");
    const pattern = isNegation ? line.substring(1) : line;

    const normalizedPattern = normalizePattern(pattern);
    const regex = globToRegex(normalizedPattern);

    rules.push({ pattern: regex, isNegation });
}

/**
 * Checks if a relative path is ignored according to the gitignore rules
 * @param relativePath The relative path to check
 * @param rules The list of gitignore rules
 * @returns True if the path should be ignored
 */
function isIgnored(relativePath: string, rules: GitIgnoreRule[]): boolean {
    const normalizedPath = relativePath.replace(/\\/g, "/");

    let ignored = false;
    for (const { pattern, isNegation } of rules) {
        if (pattern.test(normalizedPath)) {
            ignored = !isNegation;
        }
    }
    return ignored;
}

/**
 * Gets all files from a directory filtered by gitignore rules and powerpages.config.json settings.
 * This is used for comparing source files in code sites.
 * @param rootPath The root directory to scan
 * @param config Optional PowerPagesConfig with sourceExcludePatterns
 * @returns Map of relative path to absolute path for non-ignored files
 */
export function getFilteredSourceFiles(rootPath: string, config?: PowerPagesConfig): Map<string, string> {
    const files = new Map<string, string>();

    if (!fs.existsSync(rootPath)) {
        return files;
    }

    // Build gitignore rules
    const rules: GitIgnoreRule[] = [];

    // Read .gitignore if it exists
    const gitignorePath = path.join(rootPath, GITIGNORE_FILE_NAME);
    if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
        const lines = gitignoreContent.split(/\r?\n/);
        for (const line of lines) {
            addGitIgnoreRule(line, rules);
        }
    }

    // Add always-ignored patterns (at the end, so they override .gitignore)
    for (const pattern of ALWAYS_IGNORE_PATTERNS) {
        addGitIgnoreRule(pattern, rules);
    }

    // Add sourceExcludePatterns from powerpages.config.json if provided
    if (config?.sourceExcludePatterns) {
        for (const pattern of config.sourceExcludePatterns) {
            addGitIgnoreRule(pattern, rules);
        }
    }

    // Recursively get all files
    const getAllFilesRecursive = (dir: string): void => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(rootPath, fullPath).replace(/\\/g, "/");

            if (entry.isDirectory()) {
                // Check if directory should be ignored before recursing
                // Add trailing slash for directory matching
                if (!isIgnored(relativePath + "/", rules) && !isIgnored(relativePath, rules)) {
                    getAllFilesRecursive(fullPath);
                }
            } else if (entry.isFile()) {
                if (!isIgnored(relativePath, rules)) {
                    files.set(relativePath, fullPath);
                }
            }
        }
    };

    getAllFilesRecursive(rootPath);
    return files;
}

/**
 * Gets all files from the .powerpages-site folder, including it even though it starts with a dot.
 * @param rootPath The root directory containing the .powerpages-site folder
 * @returns Map of relative path to absolute path for files in .powerpages-site
 */
export function getPowerPagesSiteFiles(rootPath: string): Map<string, string> {
    const powerPagesSitePath = path.join(rootPath, POWERPAGES_SITE_FOLDER);
    const files = new Map<string, string>();

    if (!fs.existsSync(powerPagesSitePath)) {
        return files;
    }

    // Get all files from .powerpages-site, but use getAllFiles with base at .powerpages-site
    // Then prefix the relative paths with .powerpages-site/
    const siteFiles = getAllFiles(powerPagesSitePath);
    for (const [relativePath, absolutePath] of siteFiles) {
        const prefixedPath = path.join(POWERPAGES_SITE_FOLDER, relativePath).replace(/\\/g, "/");
        files.set(prefixedPath, absolutePath);
    }

    return files;
}

/**
 * Result of resolving site information from workspace
 */
export interface SiteResolutionResult {
    siteId: string;
    localSitePath: string;
    /**
     * The relative path from site root to the folder user clicked on.
     * Empty string means the entire site should be compared.
     */
    comparisonSubPath: string;
    /**
     * Whether the local site is a code site (has .powerpages-site folder).
     * This is the root folder of the code site, not the .powerpages-site folder itself.
     */
    isLocalCodeSite: boolean;
    /**
     * The root path of the code site (parent of .powerpages-site folder).
     * Only set when isLocalCodeSite is true.
     */
    localCodeSiteRootPath?: string;
}

/**
 * Options for comparing files between sites
 */
export interface CompareFilesOptions {
    /** Whether the downloaded site is a code site */
    isRemoteCodeSite?: boolean;
    /** Whether the local site is a code site */
    isLocalCodeSite?: boolean;
    /** Root path of the local code site (parent of .powerpages-site folder) */
    localCodeSiteRootPath?: string;
}

/**
 * Checks if a downloaded code site has source code (files outside .powerpages-site folder)
 * @param downloadedSitePath Path to the downloaded site
 * @returns True if the site has source code, false if it only has .powerpages-site folder
 */
export function hasSourceCode(downloadedSitePath: string): boolean {
    if (!fs.existsSync(downloadedSitePath)) {
        return false;
    }

    const entries = fs.readdirSync(downloadedSitePath, { withFileTypes: true });

    for (const entry of entries) {
        // Skip the .powerpages-site folder and other dot folders
        if (entry.name.startsWith(".")) {
            continue;
        }

        // Any non-dot file or folder means there's source code
        return true;
    }

    return false;
}

/**
 * Compares files between downloaded site and local workspace
 * @param downloadedSitePath Path to the downloaded site
 * @param localSitePath Path to the local site
 * @param options Optional comparison options for code site handling
 * @returns Array of file comparison results
 *
 * Comparison logic for code sites:
 * 1. Code site (remote) vs non-code site (local): Compare remote's .powerpages-site with entire local site
 * 2. Non-code site (remote) vs non-code site (local): Compare everything
 * 3. Code site (remote) vs code site (local):
 *    a. If remote has no source code (only .powerpages-site): Compare only .powerpages-site folders
 *    b. If remote has source code: Compare .powerpages-site folders AND filtered source files
 */
export function compareFiles(
    downloadedSitePath: string,
    localSitePath: string,
    options?: CompareFilesOptions
): IFileComparisonResult[] {
    const results: IFileComparisonResult[] = [];

    const isRemoteCodeSite = options?.isRemoteCodeSite ?? false;
    const isLocalCodeSite = options?.isLocalCodeSite ?? false;
    const localCodeSiteRootPath = options?.localCodeSiteRootPath;

    // Determine comparison mode based on code site status
    if (isRemoteCodeSite && isLocalCodeSite) {
        // Case 3: Both are code sites
        const remoteHasSourceCode = hasSourceCode(downloadedSitePath);

        // Always compare .powerpages-site folders when both are code sites
        const remotePowerPagesFiles = getPowerPagesSiteFiles(downloadedSitePath);
        const localPowerPagesPath = localCodeSiteRootPath || path.dirname(localSitePath);
        const localPowerPagesFiles = getPowerPagesSiteFiles(localPowerPagesPath);

        compareFileMaps(
            remotePowerPagesFiles,
            localPowerPagesFiles,
            downloadedSitePath,
            localPowerPagesPath,
            results
        );

        if (remoteHasSourceCode) {
            // Case 3b: Remote has source code - also compare filtered source files
            // Only read powerpages.config.json from local site - remote files are already filtered during upload
            const localSourcePath = localCodeSiteRootPath || path.dirname(localSitePath);
            const localConfig = readPowerPagesConfig(localSourcePath);

            const remoteSourceFiles = getFilteredSourceFiles(downloadedSitePath);
            const localSourceFiles = getFilteredSourceFiles(localSourcePath, localConfig);

            compareFileMaps(
                remoteSourceFiles,
                localSourceFiles,
                downloadedSitePath,
                localSourcePath,
                results
            );
        }
        // Case 3a: Remote only has .powerpages-site - already compared above
    } else if (isRemoteCodeSite && !isLocalCodeSite) {
        // Case 1: Remote is code site, local is not
        // Compare remote's .powerpages-site folder with entire local site
        const effectiveRemotePath = path.join(downloadedSitePath, POWERPAGES_SITE_FOLDER);
        const downloadedFiles = getAllFiles(effectiveRemotePath);
        const localFiles = getAllFiles(localSitePath);

        compareFileMaps(
            downloadedFiles,
            localFiles,
            effectiveRemotePath,
            localSitePath,
            results
        );
    } else if (!isRemoteCodeSite && isLocalCodeSite) {
        // Case 2 (inverse): Remote is not code site, local is code site
        // Compare entire remote with local's .powerpages-site folder (localSitePath already points there)
        const downloadedFiles = getAllFiles(downloadedSitePath);
        const localFiles = getAllFiles(localSitePath);

        compareFileMaps(
            downloadedFiles,
            localFiles,
            downloadedSitePath,
            localSitePath,
            results
        );
    } else {
        // Case 4: Neither is code site - compare everything (default behavior)
        const downloadedFiles = getAllFiles(downloadedSitePath);
        const localFiles = getAllFiles(localSitePath);

        compareFileMaps(
            downloadedFiles,
            localFiles,
            downloadedSitePath,
            localSitePath,
            results
        );
    }

    return results;
}

/**
 * Compares two file maps and adds results to the results array.
 * File path comparison is case-insensitive to handle Windows file system behavior.
 * @param remoteFiles Map of remote files (relative path -> absolute path)
 * @param localFiles Map of local files (relative path -> absolute path)
 * @param remoteBasePath Base path for remote files (for constructing paths)
 * @param localBasePath Base path for local files (for constructing paths)
 * @param results Array to add comparison results to
 */
function compareFileMaps(
    remoteFiles: Map<string, string>,
    localFiles: Map<string, string>,
    remoteBasePath: string,
    localBasePath: string,
    results: IFileComparisonResult[]
): void {
    // Create case-insensitive lookup maps
    const localFilesLowerCase = new Map<string, { originalPath: string; absolutePath: string }>();
    for (const [relativePath, absolutePath] of localFiles) {
        localFilesLowerCase.set(relativePath.toLowerCase(), { originalPath: relativePath, absolutePath });
    }

    const remoteFilesLowerCase = new Map<string, { originalPath: string; absolutePath: string }>();
    for (const [relativePath, absolutePath] of remoteFiles) {
        remoteFilesLowerCase.set(relativePath.toLowerCase(), { originalPath: relativePath, absolutePath });
    }

    // Check for modified and deleted files (files in remote but may differ locally or not exist)
    for (const [relativePath, remotePath] of remoteFiles) {
        const lowerCasePath = relativePath.toLowerCase();
        const localEntry = localFilesLowerCase.get(lowerCasePath);

        if (localEntry) {
            // File exists in both - check if content differs
            const remoteContent = fs.readFileSync(remotePath);
            const localContent = fs.readFileSync(localEntry.absolutePath);

            if (!remoteContent.equals(localContent)) {
                // Check if we already have a result for this path (case-insensitive)
                if (!results.some(r => r.relativePath.toLowerCase() === lowerCasePath)) {
                    results.push({
                        localPath: localEntry.absolutePath,
                        remotePath,
                        relativePath: localEntry.originalPath, // Use local path casing for display
                        status: FileComparisonStatus.MODIFIED
                    });
                }
            }
        } else {
            // File exists in remote but not locally - deleted locally
            if (!results.some(r => r.relativePath.toLowerCase() === lowerCasePath)) {
                results.push({
                    localPath: path.join(localBasePath, relativePath),
                    remotePath,
                    relativePath,
                    status: FileComparisonStatus.DELETED
                });
            }
        }
    }

    // Check for added files (files in local but not in remote)
    for (const [relativePath, localPath] of localFiles) {
        const lowerCasePath = relativePath.toLowerCase();
        if (!remoteFilesLowerCase.has(lowerCasePath)) {
            if (!results.some(r => r.relativePath.toLowerCase() === lowerCasePath)) {
                results.push({
                    localPath,
                    remotePath: path.join(remoteBasePath, relativePath),
                    relativePath,
                    status: FileComparisonStatus.ADDED
                });
            }
        }
    }
}

/**
 * Resolves the site ID and local site path from the workspace
 * @param workingDirectory The workspace root directory
 * @param resource Optional resource URI (e.g., from context menu)
 * @returns Site resolution result or undefined if site ID not found
 */
export function resolveSiteFromWorkspace(workingDirectory: string, resource?: vscode.Uri): SiteResolutionResult | undefined {
    let siteId: string | undefined;
    let localSitePath = workingDirectory;
    let comparisonSubPath = "";
    let isLocalCodeSite = false;
    let localCodeSiteRootPath: string | undefined;

    // Strategy 1: If resource is provided, traverse up from resource to find website.yml
    // This takes priority as it identifies the specific site the user clicked on
    if (resource?.fsPath) {
        const websiteYmlFolder = findWebsiteYmlFolder(resource.fsPath);
        if (websiteYmlFolder) {
            siteId = getWebsiteRecordId(websiteYmlFolder);
            localSitePath = websiteYmlFolder;

            // Calculate the relative path from site root to the resource
            // This allows comparing only the specific folder the user clicked on
            const resourcePath = resource.fsPath;
            if (resourcePath.startsWith(websiteYmlFolder)) {
                const relativePath = path.relative(websiteYmlFolder, resourcePath);
                // Only set comparisonSubPath if the resource is different from the site root
                if (relativePath && relativePath !== "." && !relativePath.startsWith("..")) {
                    comparisonSubPath = relativePath;
                }
            }

            // Check if this is inside a code site (.powerpages-site folder)
            // If the websiteYmlFolder ends with .powerpages-site, the parent is the code site root
            if (path.basename(websiteYmlFolder) === POWERPAGES_SITE_FOLDER) {
                isLocalCodeSite = true;
                localCodeSiteRootPath = path.dirname(websiteYmlFolder);
            }
        }
    }

    // Strategy 2: Check if website.yml exists directly in working directory
    if (!siteId) {
        siteId = getWebsiteRecordId(workingDirectory);
    }

    // Strategy 3: Look for a 'site' folder in working directory
    if (!siteId) {
        const powerPagesSiteFolder = findPowerPagesSiteFolder(workingDirectory);

        if (powerPagesSiteFolder) {
            const siteFolderPath = path.join(powerPagesSiteFolder, POWERPAGES_SITE_FOLDER);
            siteId = getWebsiteRecordId(siteFolderPath);
            if (siteId) {
                localSitePath = siteFolderPath;
                isLocalCodeSite = true;
                localCodeSiteRootPath = powerPagesSiteFolder;
            }
        }
    }

    if (!siteId) {
        return undefined;
    }

    return { siteId, localSitePath, comparisonSubPath, isLocalCodeSite, localCodeSiteRootPath };
}

/**
 * Prepares the storage path for downloading sites for comparison
 * @param storagePath The extension storage path
 * @returns The prepared site storage path
 */
export function prepareSiteStoragePath(storagePath: string, websiteId: string): string {
    const siteStoragePath = path.join(storagePath, "sites-for-comparison", websiteId);

    if (!fs.existsSync(siteStoragePath)) {
        fs.mkdirSync(siteStoragePath, { recursive: true });
    }

    return siteStoragePath;
}

/**
 * Processes comparison results and updates the MetadataDiffContext
 * @param siteStoragePath Path where site was downloaded
 * @param localSitePath Path to local site
 * @param siteName Name of the remote site being compared
 * @param localSiteName Name of the local site
 * @param environmentName Name of the environment
 * @param methodName Name of the calling method for telemetry
 * @param siteId Site ID for telemetry
 * @param completedEventName Telemetry event name for completion
 * @param noDifferencesEventName Telemetry event name for no differences
 * @param comparisonSubPath Optional sub-path to filter comparison results to a specific folder
 * @param environmentId Optional environment ID (defaults to current environment if not provided)
 * @param dataModelVersion Optional data model version (1 = Standard, 2 = Enhanced)
 * @param websiteUrl Optional website URL
 * @param siteVisibility Optional site visibility
 * @param creator Optional creator of the site
 * @param createdOn Optional ISO 8601 timestamp when the site was created
 * @param isCodeSite Optional flag indicating if the remote site is a code site
 * @param isLocalCodeSite Optional flag indicating if the local site is a code site
 * @param localCodeSiteRootPath Optional root path of the local code site (parent of .powerpages-site folder)
 * @returns True if differences were found, false otherwise
 */
export async function processComparisonResults(
    siteStoragePath: string,
    localSitePath: string,
    siteName: string,
    localSiteName: string,
    environmentName: string,
    methodName: string,
    siteId: string,
    completedEventName: string,
    noDifferencesEventName: string,
    comparisonSubPath?: string,
    environmentId?: string,
    dataModelVersion?: 1 | 2,
    websiteUrl?: string,
    siteVisibility?: SiteVisibility,
    creator?: string,
    createdOn?: string,
    isCodeSite?: boolean,
    isLocalCodeSite?: boolean,
    localCodeSiteRootPath?: string
): Promise<boolean> {
    const comparisonResults = await showProgressWithNotification(
        Constants.Strings.COMPARING_FILES,
        async () => {
            // Find the actual downloaded site folder (name is not deterministic)
            const downloadedFolders = fs.readdirSync(siteStoragePath, { withFileTypes: true })
                .filter(entry => entry.isDirectory())
                .map(entry => entry.name);

            const siteDownloadPath = path.join(siteStoragePath, downloadedFolders[0]);
            let results = compareFiles(siteDownloadPath, localSitePath, {
                isRemoteCodeSite: isCodeSite,
                isLocalCodeSite: isLocalCodeSite,
                localCodeSiteRootPath: localCodeSiteRootPath
            });

            // Filter results to only include files under the comparison sub-path
            if (comparisonSubPath) {
                const normalizedSubPath = comparisonSubPath.replace(/\\/g, "/");
                results = results.filter(result => {
                    const normalizedRelativePath = result.relativePath.replace(/\\/g, "/");
                    return normalizedRelativePath.startsWith(normalizedSubPath + "/") ||
                        normalizedRelativePath === normalizedSubPath;
                });
            }

            return results;
        }
    );

    // Handle results after progress notification is dismissed
    if (comparisonResults.length === 0) {
        traceInfo(noDifferencesEventName, {
            methodName,
            siteId
        });
        // Don't await - show notification without blocking so callers can update UI immediately
        vscode.window.showInformationMessage(Constants.Strings.NO_DIFFERENCES_FOUND);
        return false;
    } else {
        traceInfo(completedEventName, {
            methodName,
            siteId,
            totalDifferences: comparisonResults.length.toString(),
            modifiedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.MODIFIED).length.toString(),
            addedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.ADDED).length.toString(),
            deletedFiles: comparisonResults.filter(r => r.status === FileComparisonStatus.DELETED).length.toString()
        });

        // Get the environment ID from context if not provided
        const resolvedEnvironmentId = environmentId || PacContext.AuthInfo?.EnvironmentId || "";

        // Store results in the context so the tree view can display them
        MetadataDiffContext.setResults(
            comparisonResults,
            siteName,
            localSiteName,
            environmentName,
            siteId,
            resolvedEnvironmentId,
            false, // isImported
            undefined, // exportedAt
            dataModelVersion,
            websiteUrl,
            siteVisibility,
            creator,
            createdOn,
            isCodeSite
        );
        return true;
    }
}
