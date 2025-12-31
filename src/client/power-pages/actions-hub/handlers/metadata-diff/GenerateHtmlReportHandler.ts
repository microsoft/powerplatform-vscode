/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MetadataDiffSiteTreeItem } from "../../tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { IFileComparisonResult, FileComparisonStatus } from "../../models/IFileComparisonResult";
import { SiteVisibility } from "../../models/SiteVisibility";
import { Constants } from "../../Constants";
import { traceInfo, traceError } from "../../TelemetryHelper";
import { isBinaryFile } from "../../ActionsHubUtils";
import { WebsiteDataModel } from "../../../../../common/services/Constants";

/**
 * Represents the content of a file comparison
 */
interface IFileContentComparison {
    result: IFileComparisonResult;
    localContent: string | null;
    remoteContent: string | null;
    isBinary: boolean;
}

/**
 * Generates an HTML report for the metadata diff results.
 * The report can be saved and shared with non-technical users.
 */
export async function generateHtmlReport(treeItem: MetadataDiffSiteTreeItem): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_GENERATE_HTML_REPORT_CALLED, {
        siteName: treeItem.siteName,
        fileCount: treeItem.comparisonResults.length
    });

    try {
        // Read file contents for all non-binary files
        const fileContents = await readFileContents(treeItem.comparisonResults);

        const htmlContent = generateHtmlContent(
            fileContents,
            treeItem.localSiteName,
            treeItem.siteName,
            treeItem.environmentName,
            treeItem.websiteId,
            treeItem.dataModelVersion,
            treeItem.websiteUrl,
            treeItem.siteVisibility,
            treeItem.creator,
            treeItem.createdOn
        );

        // Prompt user to save the file
        const defaultFileName = `metadata-diff-report-${treeItem.siteName.replace(/[^a-zA-Z0-9]/g, "-")}-${formatDateForFileName(new Date())}.html`;

        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultFileName),
            filters: {
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "HTML Files": ["html"],
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "All Files": ["*"]
            },
            saveLabel: Constants.Strings.SAVE_REPORT,
            title: Constants.Strings.SAVE_HTML_REPORT_TITLE
        });

        if (!saveUri) {
            // User cancelled the save dialog
            return;
        }

        // Write the HTML content to the file
        const encoder = new TextEncoder();
        await vscode.workspace.fs.writeFile(saveUri, encoder.encode(htmlContent));

        // Show success message with option to open the file
        const openAction = Constants.Strings.OPEN_REPORT;
        const result = await vscode.window.showInformationMessage(
            Constants.StringFunctions.HTML_REPORT_SAVED_SUCCESS(saveUri.fsPath),
            openAction
        );

        if (result === openAction) {
            // Open the HTML file in a VS Code webview
            showHtmlReportInWebview(htmlContent, treeItem.siteName);
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_HTML_REPORT_SAVED, {
            siteName: treeItem.siteName,
            fileCount: treeItem.comparisonResults.length,
            filePath: saveUri.fsPath
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        traceError(
            Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_HTML_REPORT_FAILED,
            error as Error,
            { siteName: treeItem.siteName }
        );

        vscode.window.showErrorMessage(Constants.StringFunctions.HTML_REPORT_GENERATION_FAILED(errorMessage));
    }
}

/**
 * Formats a date for use in a file name (YYYY-MM-DD-HHmmss)
 */
function formatDateForFileName(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}-${hours}${minutes}${seconds}`;
}

/**
 * Formats a date for display in the report (includes timezone)
 */
function formatDateForDisplay(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
    };
    return date.toLocaleString(undefined, options);
}

/**
 * Reads file contents for all comparison results
 * Skips binary files and handles missing files gracefully
 */
async function readFileContents(comparisonResults: IFileComparisonResult[]): Promise<IFileContentComparison[]> {
    const fileContents: IFileContentComparison[] = [];

    for (const result of comparisonResults) {
        const isBinary = isBinaryFile(result.relativePath);

        if (isBinary) {
            fileContents.push({
                result,
                localContent: null,
                remoteContent: null,
                isBinary: true
            });
            continue;
        }

        let localContent: string | null = null;
        let remoteContent: string | null = null;

        try {
            if (result.status !== FileComparisonStatus.DELETED) {
                const localUri = vscode.Uri.file(result.localPath);
                const localData = await vscode.workspace.fs.readFile(localUri);
                localContent = new TextDecoder().decode(localData);
            }
        } catch {
            // File may not exist or be readable
            localContent = null;
        }

        try {
            if (result.status !== FileComparisonStatus.ADDED) {
                const remoteUri = vscode.Uri.file(result.remotePath);
                const remoteData = await vscode.workspace.fs.readFile(remoteUri);
                remoteContent = new TextDecoder().decode(remoteData);
            }
        } catch {
            // File may not exist or be readable
            remoteContent = null;
        }

        fileContents.push({
            result,
            localContent,
            remoteContent,
            isBinary: false
        });
    }

    return fileContents;
}

/**
 * Gets the status display text
 */
function getStatusText(status: IFileComparisonResult["status"]): string {
    switch (status) {
        case FileComparisonStatus.MODIFIED:
            return Constants.Strings.HTML_REPORT_STATUS_MODIFIED;
        case FileComparisonStatus.ADDED:
            return Constants.Strings.HTML_REPORT_STATUS_ADDED;
        case FileComparisonStatus.DELETED:
            return Constants.Strings.HTML_REPORT_STATUS_DELETED;
        default:
            return Constants.Strings.HTML_REPORT_STATUS_UNKNOWN;
    }
}

/**
 * Gets the CSS class for a status badge
 */
function getStatusClass(status: IFileComparisonResult["status"]): string {
    switch (status) {
        case FileComparisonStatus.MODIFIED:
            return "status-modified";
        case FileComparisonStatus.ADDED:
            return "status-added";
        case FileComparisonStatus.DELETED:
            return "status-deleted";
        default:
            return "";
    }
}

/**
 * Groups comparison results by status
 */
function groupByStatus(results: IFileComparisonResult[]): Map<string, IFileComparisonResult[]> {
    const grouped = new Map<string, IFileComparisonResult[]>();

    for (const result of results) {
        const existing = grouped.get(result.status) || [];
        existing.push(result);
        grouped.set(result.status, existing);
    }

    return grouped;
}

/**
 * Mapping of folder names to display names for component types
 */
const componentTypeDisplayNames: Record<string, string> = {
    "website-languages": "Site Languages",
    "web-pages": "Web Pages",
    "content-snippets": "Content Snippets",
    "web-files": "Web Files",
    "site-settings": "Site Settings",
    "weblink-sets": "Web Links",
    "site-markers": "Site Markers",
    "basic-forms": "Basic Forms",
    "advanced-forms": "Advanced Forms",
    "web-templates": "Web Templates",
    "page-templates": "Page Templates",
    "lists": "Lists",
    "table-permissions": "Permissions",
    "polls": "Polls",
    "poll-placements": "Poll Placements",
    "others": "Others"
};

/**
 * Ordered list of component types for consistent tab ordering
 */
const componentTypeOrder: string[] = [
    "website-languages",
    "web-pages",
    "content-snippets",
    "web-files",
    "site-settings",
    "weblink-sets",
    "site-markers",
    "basic-forms",
    "advanced-forms",
    "web-templates",
    "page-templates",
    "lists",
    "table-permissions",
    "polls",
    "poll-placements",
    "others"
];

/**
 * Gets the component type from a file's relative path
 * @internal Exported for testing
 */
export function getComponentTypeFromPath(relativePath: string): string {
    // Normalize path separators
    const normalizedPath = relativePath.replace(/\\/g, "/");
    const firstFolder = normalizedPath.split("/")[0];

    // Check if it's a known component type
    if (componentTypeDisplayNames[firstFolder] && firstFolder !== "others") {
        return firstFolder;
    }

    return "others";
}

/**
 * Gets the display name for a component type
 * @internal Exported for testing
 */
export function getComponentTypeDisplayName(componentType: string): string {
    return componentTypeDisplayNames[componentType] || componentType;
}

/**
 * Groups file content comparisons by component type
 */
function groupByComponentType(fileContents: IFileContentComparison[]): Map<string, IFileContentComparison[]> {
    const grouped = new Map<string, IFileContentComparison[]>();

    for (const fc of fileContents) {
        const componentType = getComponentTypeFromPath(fc.result.relativePath);
        const existing = grouped.get(componentType) || [];
        existing.push(fc);
        grouped.set(componentType, existing);
    }

    // Sort the map by the predefined order
    const sortedMap = new Map<string, IFileContentComparison[]>();
    for (const componentType of componentTypeOrder) {
        const files = grouped.get(componentType);
        if (files && files.length > 0) {
            sortedMap.set(componentType, files);
        }
    }

    // Add any remaining types that weren't in the predefined order
    for (const [componentType, files] of grouped.entries()) {
        if (!sortedMap.has(componentType)) {
            sortedMap.set(componentType, files);
        }
    }

    return sortedMap;
}

/**
 * Generates a simple line-by-line diff HTML
 */
function generateDiffHtml(fileContent: IFileContentComparison): string {
    if (fileContent.isBinary) {
        return `<div class="diff-binary">${escapeHtml(Constants.Strings.HTML_REPORT_BINARY_FILE_MESSAGE)}</div>`;
    }

    const { localContent, remoteContent, result } = fileContent;

    // Handle cases where content couldn't be read
    if (localContent === null && remoteContent === null) {
        return `<div class="diff-error">${escapeHtml(Constants.Strings.HTML_REPORT_UNABLE_TO_READ_CONTENTS)}</div>`;
    }

    // For added files, show all lines as additions
    if (result.status === FileComparisonStatus.ADDED) {
        if (localContent === null) {
            return `<div class="diff-error">${escapeHtml(Constants.Strings.HTML_REPORT_UNABLE_TO_READ_LOCAL)}</div>`;
        }
        const lines = localContent.split("\n");
        const diffLines = lines.map((line, idx) =>
            `<div class="diff-line diff-added"><span class="line-number"></span><span class="line-number">${idx + 1}</span><span class="line-content">+ ${escapeHtml(line)}</span></div>`
        ).join("");
        return `<div class="diff-content">${diffLines}</div>`;
    }

    // For deleted files, show all lines as deletions
    if (result.status === FileComparisonStatus.DELETED) {
        if (remoteContent === null) {
            return `<div class="diff-error">${escapeHtml(Constants.Strings.HTML_REPORT_UNABLE_TO_READ_REMOTE)}</div>`;
        }
        const lines = remoteContent.split("\n");
        const diffLines = lines.map((line, idx) =>
            `<div class="diff-line diff-deleted"><span class="line-number">${idx + 1}</span><span class="line-number"></span><span class="line-content">- ${escapeHtml(line)}</span></div>`
        ).join("");
        return `<div class="diff-content">${diffLines}</div>`;
    }

    // For modified files, compute a simple diff
    if (localContent === null || remoteContent === null) {
        return `<div class="diff-error">${escapeHtml(Constants.Strings.HTML_REPORT_UNABLE_TO_READ_BOTH)}</div>`;
    }

    const diffLines = computeSimpleDiff(remoteContent, localContent);
    return `<div class="diff-content">${diffLines}</div>`;
}

/**
 * Computes a simple line-by-line diff between two texts
 * Uses a basic longest common subsequence approach
 */
function computeSimpleDiff(oldText: string, newText: string): string {
    const oldLines = oldText.split("\n");
    const newLines = newText.split("\n");

    // Simple diff using LCS
    const lcs = computeLCS(oldLines, newLines);
    const result: string[] = [];

    let oldIdx = 0;
    let newIdx = 0;
    let oldLineNum = 1;
    let newLineNum = 1;

    for (const commonLine of lcs) {
        // Output deletions (lines in old but not in common)
        while (oldIdx < oldLines.length && oldLines[oldIdx] !== commonLine) {
            result.push(`<div class="diff-line diff-deleted"><span class="line-number">${oldLineNum}</span><span class="line-number"></span><span class="line-content">- ${escapeHtml(oldLines[oldIdx])}</span></div>`);
            oldIdx++;
            oldLineNum++;
        }

        // Output additions (lines in new but not in common)
        while (newIdx < newLines.length && newLines[newIdx] !== commonLine) {
            result.push(`<div class="diff-line diff-added"><span class="line-number"></span><span class="line-number">${newLineNum}</span><span class="line-content">+ ${escapeHtml(newLines[newIdx])}</span></div>`);
            newIdx++;
            newLineNum++;
        }

        // Output the common line
        result.push(`<div class="diff-line diff-unchanged"><span class="line-number">${oldLineNum}</span><span class="line-number">${newLineNum}</span><span class="line-content">  ${escapeHtml(commonLine)}</span></div>`);
        oldIdx++;
        newIdx++;
        oldLineNum++;
        newLineNum++;
    }

    // Output remaining deletions
    while (oldIdx < oldLines.length) {
        result.push(`<div class="diff-line diff-deleted"><span class="line-number">${oldLineNum}</span><span class="line-number"></span><span class="line-content">- ${escapeHtml(oldLines[oldIdx])}</span></div>`);
        oldIdx++;
        oldLineNum++;
    }

    // Output remaining additions
    while (newIdx < newLines.length) {
        result.push(`<div class="diff-line diff-added"><span class="line-number"></span><span class="line-number">${newLineNum}</span><span class="line-content">+ ${escapeHtml(newLines[newIdx])}</span></div>`);
        newIdx++;
        newLineNum++;
    }

    return result.join("");
}

/**
 * Computes the longest common subsequence of two string arrays
 */
function computeLCS(arr1: string[], arr2: string[]): string[] {
    const m = arr1.length;
    const n = arr2.length;

    // Create DP table
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (arr1[i - 1] === arr2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }

    // Backtrack to find LCS
    const lcs: string[] = [];
    let i = m;
    let j = n;

    while (i > 0 && j > 0) {
        if (arr1[i - 1] === arr2[j - 1]) {
            lcs.unshift(arr1[i - 1]);
            i--;
            j--;
        } else if (dp[i - 1][j] > dp[i][j - 1]) {
            i--;
        } else {
            j--;
        }
    }

    return lcs;
}

/**
 * Generates the HTML content for the report
 */
function generateHtmlContent(
    fileContents: IFileContentComparison[],
    localSiteName: string,
    siteName: string,
    environmentName: string,
    websiteId: string,
    dataModelVersion: (1 | 2) | undefined,
    websiteUrl?: string,
    siteVisibility?: SiteVisibility,
    creator?: string,
    createdOn?: string
): string {
    const generatedDate = formatDateForDisplay(new Date());
    const comparisonResults = fileContents.map(fc => fc.result);
    const groupedResults = groupByStatus(comparisonResults);

    const addedCount = groupedResults.get(FileComparisonStatus.ADDED)?.length || 0;
    const modifiedCount = groupedResults.get(FileComparisonStatus.MODIFIED)?.length || 0;
    const deletedCount = groupedResults.get(FileComparisonStatus.DELETED)?.length || 0;
    const dataModelDisplayName = dataModelVersion === 1 ? WebsiteDataModel.Standard : WebsiteDataModel.Enhanced;
    const visibilityDisplayName = siteVisibility ? siteVisibility.charAt(0).toUpperCase() + siteVisibility.slice(1).toLowerCase() : undefined;
    const createdOnFormatted = createdOn ? formatDateForDisplay(new Date(createdOn)) : undefined;

    // Sort results by path
    const sortedFileContents = [...fileContents].sort((a, b) =>
        a.result.relativePath.localeCompare(b.result.relativePath)
    );

    // Group file contents by component type
    const componentGroups = groupByComponentType(sortedFileContents);

    // Generate file rows for each group with unique index prefix
    const generateFileRowsForGroup = (files: IFileContentComparison[], indexPrefix: string): string => {
        if (files.length === 0) {
            return `<div class="no-files-message">${escapeHtml(Constants.Strings.HTML_REPORT_NO_FILES_IN_CATEGORY)}</div>`;
        }
        return files.map((fc, index) => {
            const result = fc.result;
            const diffHtml = generateDiffHtml(fc);
            const uniqueId = `${indexPrefix}-${index}`;

            return `
            <div class="file-item">
                <div class="file-header" onclick="toggleDiff('diff-${uniqueId}')">
                    <span class="file-path">${escapeHtml(result.relativePath)}</span>
                    <span class="status-badge ${getStatusClass(result.status)}">${escapeHtml(getStatusText(result.status))}</span>
                    <span class="toggle-icon" id="icon-${uniqueId}">▶</span>
                </div>
                <div class="diff-container" id="diff-${uniqueId}" style="display: none;">
                    ${diffHtml}
                </div>
            </div>`;
        }).join("");
    };

    // Generate "All" tab content first
    const allFileRows = generateFileRowsForGroup(sortedFileContents, "all");

    // Generate tabs HTML - "All" tab first, then all component type tabs (even empty ones)
    const allTabButton = `<button class="tab-button active" onclick="switchTab('all')" data-tab="all">${escapeHtml(Constants.Strings.HTML_REPORT_TAB_ALL)} (${sortedFileContents.length})</button>`;

    // Generate tabs for ALL component types, not just ones with files
    const componentTabButtons = componentTypeOrder
        .filter(key => key !== "others") // Handle "others" separately if it has files
        .map(key => {
            const files = componentGroups.get(key) || [];
            const displayName = getComponentTypeDisplayName(key);
            const count = files.length;
            const disabledClass = count === 0 ? " disabled" : "";
            const onclickAttr = count === 0 ? "" : `onclick="switchTab('${escapeHtml(key)}')"`;
            return `<button class="tab-button${disabledClass}" ${onclickAttr} data-tab="${escapeHtml(key)}">${escapeHtml(displayName)} (${count})</button>`;
        }).join("");

    // Add "Others" tab only if there are files in it
    const othersFiles = componentGroups.get("others") || [];
    const othersTabButton = othersFiles.length > 0
        ? `<button class="tab-button" onclick="switchTab('others')" data-tab="others">${escapeHtml(getComponentTypeDisplayName("others"))} (${othersFiles.length})</button>`
        : "";

    const tabButtons = allTabButton + componentTabButtons + othersTabButton;

    const allTabContent = `<div class="tab-content active" id="tab-all">${allFileRows}</div>`;

    // Generate tab content for ALL component types (even empty ones for consistency)
    const componentTabContents = componentTypeOrder
        .filter(key => key !== "others")
        .map(key => {
            const files = componentGroups.get(key) || [];
            const fileRows = generateFileRowsForGroup(files, key);
            return `<div class="tab-content" id="tab-${escapeHtml(key)}">${fileRows}</div>`;
        }).join("");

    // Add "Others" tab content only if there are files in it
    const othersTabContent = othersFiles.length > 0
        ? `<div class="tab-content" id="tab-others">${generateFileRowsForGroup(othersFiles, "others")}</div>`
        : "";

    const tabContents = allTabContent + componentTabContents + othersTabContent;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(Constants.Strings.HTML_REPORT_TITLE)} - ${escapeHtml(siteName)}</title>
    <style>
        :root {
            --primary-color: #0078d4;
            --success-color: #107c10;
            --warning-color: #ca5010;
            --danger-color: #d13438;
            --background-color: #f3f2f1;
            --card-background: #ffffff;
            --text-color: #323130;
            --text-secondary: #605e5c;
            --border-color: #edebe9;
            --diff-added-bg: #dff6dd;
            --diff-deleted-bg: #fde7e9;
            --diff-unchanged-bg: #ffffff;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: var(--background-color);
            color: var(--text-color);
            line-height: 1.6;
            padding: 20px;
        }

        .container {
            max-width: 1400px;
            margin: 0 auto;
        }

        .header {
            background: linear-gradient(135deg, var(--primary-color), #106ebe);
            color: white;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .header-subtitle {
            opacity: 0.9;
            font-size: 14px;
        }

        .header-separator {
            border: none;
            border-top: 1px solid rgba(255, 255, 255, 0.3);
            margin: 16px 0;
        }

        .header-info {
            display: flex;
            flex-wrap: wrap;
            gap: 32px;
            font-size: 14px;
            opacity: 0.9;
        }

        .header-info-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .header-info-label {
            font-weight: 600;
        }

        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }

        .summary-card {
            background: var(--card-background);
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
            text-align: left;
            border-left: 4px solid transparent;
        }

        .summary-card.total {
            border-left-color: var(--primary-color);
        }

        .summary-card.modified {
            border-left-color: var(--warning-color);
        }

        .summary-card.added {
            border-left-color: var(--success-color);
        }

        .summary-card.deleted {
            border-left-color: var(--danger-color);
        }

        .summary-card .label {
            font-size: 12px;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .summary-card .count {
            font-size: 36px;
            font-weight: 700;
        }

        .summary-card.total .count {
            color: var(--primary-color);
        }

        .summary-card.added .count {
            color: var(--success-color);
        }

        .summary-card.modified .count {
            color: var(--warning-color);
        }

        .summary-card.deleted .count {
            color: var(--danger-color);
        }

        .info-section {
            background: var(--card-background);
            padding: 24px;
            border-radius: 8px;
            margin-bottom: 24px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
        }

        .info-section h2 {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            color: var(--primary-color);
        }

        .comparison-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        @media (max-width: 768px) {
            .comparison-grid {
                grid-template-columns: 1fr;
            }
        }

        .comparison-column {
            background: var(--background-color);
            border-radius: 8px;
            padding: 20px;
        }

        .comparison-column h3 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 16px;
            color: var(--text-color);
            padding-bottom: 8px;
            border-bottom: 2px solid var(--primary-color);
        }

        .comparison-column.local h3 {
            border-bottom-color: var(--success-color);
        }

        .comparison-column.remote h3 {
            border-bottom-color: var(--primary-color);
        }

        .info-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .info-item {
            display: flex;
            align-items: flex-start;
        }

        .info-label {
            font-weight: 600;
            min-width: 110px;
            color: var(--text-secondary);
            flex-shrink: 0;
        }

        .info-value {
            color: var(--text-color);
            word-break: break-word;
        }

        .files-section {
            background: var(--card-background);
            border-radius: 8px;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
            overflow: hidden;
        }

        .files-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
        }

        .files-header h2 {
            font-size: 18px;
            font-weight: 600;
            color: var(--primary-color);
            margin: 0;
        }

        .expand-buttons {
            display: flex;
            gap: 8px;
        }

        .expand-btn {
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 500;
            color: var(--primary-color);
            background-color: transparent;
            border: 1px solid var(--primary-color);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .expand-btn:hover {
            background-color: var(--primary-color);
            color: white;
        }

        .files-section > h2 {
            font-size: 18px;
            font-weight: 600;
            padding: 20px;
            border-bottom: 1px solid var(--border-color);
            color: var(--primary-color);
        }

        .file-item {
            border-bottom: 1px solid var(--border-color);
        }

        .file-item:last-child {
            border-bottom: none;
        }

        .file-header {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            cursor: pointer;
            transition: background-color 0.2s;
            gap: 12px;
        }

        .file-header:hover {
            background-color: #faf9f8;
        }

        .file-path {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            word-break: break-all;
            flex: 1;
        }

        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            flex-shrink: 0;
        }

        .status-added {
            background-color: #dff6dd;
            color: var(--success-color);
        }

        .status-modified {
            background-color: #fff4ce;
            color: var(--warning-color);
        }

        .status-deleted {
            background-color: #fde7e9;
            color: var(--danger-color);
        }

        .toggle-icon {
            font-size: 12px;
            color: var(--text-secondary);
            transition: transform 0.2s;
            flex-shrink: 0;
        }

        .toggle-icon.expanded {
            transform: rotate(90deg);
        }

        .diff-container {
            border-top: 1px solid var(--border-color);
            background-color: #fafafa;
        }

        .diff-content {
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.5;
            overflow-x: auto;
            max-height: 500px;
            overflow-y: auto;
        }

        .diff-line {
            display: flex;
            white-space: pre;
        }

        .diff-line .line-number {
            min-width: 50px;
            padding: 0 8px;
            text-align: right;
            color: var(--text-secondary);
            background-color: rgba(0, 0, 0, 0.03);
            border-right: 1px solid var(--border-color);
            user-select: none;
        }

        .diff-line .line-content {
            padding: 0 12px;
            flex: 1;
        }

        .diff-added {
            background-color: var(--diff-added-bg);
        }

        .diff-added .line-content {
            color: var(--success-color);
        }

        .diff-deleted {
            background-color: var(--diff-deleted-bg);
        }

        .diff-deleted .line-content {
            color: var(--danger-color);
        }

        .diff-unchanged {
            background-color: var(--diff-unchanged-bg);
        }

        .diff-binary, .diff-error {
            padding: 20px;
            text-align: center;
            color: var(--text-secondary);
            font-style: italic;
        }

        .footer {
            text-align: center;
            padding: 20px;
            color: var(--text-secondary);
            font-size: 12px;
        }

        .footer a {
            color: var(--primary-color);
            text-decoration: none;
        }

        .footer a:hover {
            text-decoration: underline;
        }

        @media print {
            body {
                background-color: white;
                padding: 0;
            }

            .header {
                background: var(--primary-color);
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .summary-card,
            .info-section,
            .files-section {
                box-shadow: none;
                border: 1px solid var(--border-color);
            }

            .diff-container {
                display: block !important;
            }

            .toggle-icon {
                display: none;
            }
        }

        @media (max-width: 600px) {
            .header {
                padding: 20px;
            }

            .header h1 {
                font-size: 22px;
            }

            .summary-cards {
                grid-template-columns: repeat(2, 1fr);
            }

            .file-header {
                padding: 10px 12px;
            }

            .tabs-header {
                flex-wrap: wrap;
            }

            .tab-button {
                flex: 1 1 auto;
                min-width: 80px;
            }
        }

        .tabs-container {
            margin-top: 0;
        }

        .tabs-header {
            display: flex;
            border-bottom: 2px solid var(--border-color);
            background-color: #faf9f8;
            padding: 0 20px;
            gap: 4px;
        }

        .tab-button {
            padding: 12px 20px;
            border: none;
            background-color: transparent;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            color: var(--text-secondary);
            border-bottom: 2px solid transparent;
            margin-bottom: -2px;
            transition: all 0.2s ease;
        }

        .tab-button:hover {
            color: var(--primary-color);
            background-color: rgba(0, 120, 212, 0.05);
        }

        .tab-button.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
            background-color: var(--card-background);
        }

        .tab-button.disabled {
            color: var(--text-secondary);
            opacity: 0.5;
            cursor: default;
        }

        .tab-button.disabled:hover {
            color: var(--text-secondary);
            background-color: transparent;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .no-files-message {
            padding: 40px 20px;
            text-align: center;
            color: var(--text-secondary);
            font-style: italic;
        }
    </style>
    <script>
        function toggleDiff(diffId) {
            const diffContainer = document.getElementById(diffId);
            const iconId = diffId.replace('diff-', 'icon-');
            const icon = document.getElementById(iconId);

            if (diffContainer.style.display === 'none') {
                diffContainer.style.display = 'block';
                icon.classList.add('expanded');
            } else {
                diffContainer.style.display = 'none';
                icon.classList.remove('expanded');
            }
        }

        function expandAll() {
            // Expand all diffs across all tabs
            document.querySelectorAll('.diff-container').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.toggle-icon').forEach(el => el.classList.add('expanded'));
        }

        function collapseAll() {
            // Collapse all diffs across all tabs
            document.querySelectorAll('.diff-container').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.toggle-icon').forEach(el => el.classList.remove('expanded'));
        }

        function switchTab(tabId) {
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            // Add active class to selected tab and content
            const selectedButton = document.querySelector('[data-tab="' + tabId + '"]');
            const selectedContent = document.getElementById('tab-' + tabId);

            if (selectedButton) selectedButton.classList.add('active');
            if (selectedContent) selectedContent.classList.add('active');
        }
    </script>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${escapeHtml(Constants.Strings.HTML_REPORT_TITLE)}</h1>
            <p class="header-subtitle">${escapeHtml(Constants.Strings.HTML_REPORT_SUBTITLE)}</p>
            <hr class="header-separator" />
            <div class="header-info">
                <div class="header-info-item">
                    <span class="header-info-label"><strong>${escapeHtml(Constants.Strings.HTML_REPORT_GENERATED_LABEL)}</strong></span>
                    <span>${escapeHtml(generatedDate)}</span>
                </div>
            </div>
        </header>

        <section class="summary-cards">
            <div class="summary-card total">
                <div class="label">${escapeHtml(Constants.Strings.HTML_REPORT_TOTAL_CHANGES)}</div>
                <div class="count">${comparisonResults.length}</div>
            </div>
            <div class="summary-card modified">
                <div class="label">${escapeHtml(Constants.Strings.HTML_REPORT_MODIFIED)}</div>
                <div class="count">${modifiedCount}</div>
            </div>
            <div class="summary-card added">
                <div class="label">${escapeHtml(Constants.Strings.HTML_REPORT_ADDED)}</div>
                <div class="count">${addedCount}</div>
            </div>
            <div class="summary-card deleted">
                <div class="label">${escapeHtml(Constants.Strings.HTML_REPORT_DELETED)}</div>
                <div class="count">${deletedCount}</div>
            </div>
        </section>

        <section class="info-section">
            <h2>${escapeHtml(Constants.Strings.HTML_REPORT_COMPARISON_DETAILS)}</h2>
            <div class="comparison-grid">
                <div class="comparison-column local">
                    <h3>${escapeHtml(Constants.Strings.HTML_REPORT_LOCAL_SECTION)}</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_SITE_NAME_LABEL)}</span>
                            <span class="info-value">${escapeHtml(localSiteName)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_WEBSITE_ID_LABEL)}</span>
                            <span class="info-value">${escapeHtml(websiteId)}</span>
                        </div>
                    </div>
                </div>
                <div class="comparison-column remote">
                    <h3>${escapeHtml(Constants.Strings.HTML_REPORT_REMOTE_SECTION)}</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_SITE_NAME_LABEL)}</span>
                            <span class="info-value">${escapeHtml(siteName)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_WEBSITE_ID_LABEL)}</span>
                            <span class="info-value">${escapeHtml(websiteId)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_ENVIRONMENT_LABEL)}</span>
                            <span class="info-value">${escapeHtml(environmentName)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_DATA_MODEL_LABEL)}</span>
                            <span class="info-value">${escapeHtml(dataModelDisplayName)}</span>
                        </div>${websiteUrl ? `
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_WEBSITE_URL_LABEL)}</span>
                            <span class="info-value"><a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(websiteUrl)}</a></span>
                        </div>` : ""}${visibilityDisplayName ? `
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_SITE_VISIBILITY_LABEL)}</span>
                            <span class="info-value">${escapeHtml(visibilityDisplayName)}</span>
                        </div>` : ""}${creator ? `
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_CREATOR_LABEL)}</span>
                            <span class="info-value">${escapeHtml(creator)}</span>
                        </div>` : ""}${createdOnFormatted ? `
                        <div class="info-item">
                            <span class="info-label">${escapeHtml(Constants.Strings.HTML_REPORT_CREATED_ON_LABEL)}</span>
                            <span class="info-value">${escapeHtml(createdOnFormatted)}</span>
                        </div>` : ""}
                    </div>
                </div>
            </div>
        </section>

        <section class="files-section">
            <div class="files-header">
                <h2>${escapeHtml(Constants.Strings.HTML_REPORT_CHANGED_FILES)} <span style="font-weight: normal; font-size: 14px;">${escapeHtml(Constants.Strings.HTML_REPORT_CLICK_TO_EXPAND)}</span></h2>
                <div class="expand-buttons">
                    <button onclick="expandAll()" class="expand-btn">${escapeHtml(Constants.Strings.HTML_REPORT_EXPAND_ALL)}</button>
                    <button onclick="collapseAll()" class="expand-btn">${escapeHtml(Constants.Strings.HTML_REPORT_COLLAPSE_ALL)}</button>
                </div>
            </div>
            <div class="tabs-container">
                <div class="tabs-header">
                    ${tabButtons}
                </div>
                ${tabContents}
            </div>
        </section>

        <footer class="footer">
            ${escapeHtml(Constants.Strings.HTML_REPORT_GENERATED_BY)} <a href="https://marketplace.visualstudio.com/items?itemName=microsoft-IsvExpTools.powerplatform-vscode" target="_blank" rel="noopener noreferrer">${escapeHtml(Constants.Strings.HTML_REPORT_EXTENSION_NAME)}</a>
        </footer>
    </div>
</body>
</html>`;
}

/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * Shows the HTML report in a VS Code webview panel
 */
function showHtmlReportInWebview(htmlContent: string, siteName: string): void {
    const panel = vscode.window.createWebviewPanel(
        "metadataDiffReport",
        `${Constants.Strings.HTML_REPORT_TITLE} - ${siteName}`,
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: false
        }
    );

    panel.webview.html = htmlContent;
}
