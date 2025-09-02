/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";

/**
 * Utility functions for URI handler operations
 */
export class UriHandlerUtils {
    /**
     * Extracts the main site name from a site URL
     * @param siteUrl The full site URL (e.g., "https://site-pdcnx.powerappsportals.com")
     * @returns The main site name (e.g., "site-pdcnx")
     */
    static extractMainSiteName(siteUrl: string): string {
        try {
            const url = new URL(siteUrl);
            const hostname = url.hostname;
            // Extract the subdomain part before the first dot
            const parts = hostname.split('.');
            return parts[0] || hostname;
        } catch (error) {
            // If URL parsing fails, try to extract manually
            const match = siteUrl.match(/\/\/([^./]+)/);
            return match ? match[1] : siteUrl;
        }
    }

    /**
     * Generates the expected folder name pattern
     * @param siteName The site name
     * @param siteUrl The site URL
     * @returns The expected folder name in format "sitename---mainsitename"
     */
    static generateExpectedFolderName(siteName: string | null, siteUrl: string | null): string | null {
        if (!siteName || !siteUrl) {
            return null;
        }

        // Replace spaces with dashes in site name and convert to lowercase
        const sanitizedSiteName = siteName.replace(/\s+/g, '-').toLowerCase();
        const mainSiteName = UriHandlerUtils.extractMainSiteName(siteUrl).toLowerCase();
        return `${sanitizedSiteName}---${mainSiteName}`;
    }

    /**
     * Finds the downloaded folder with the expected naming pattern
     * @param baseFolder The base folder where to search
     * @param expectedFolderName The expected folder name
     * @returns The URI of the found folder or null if not found
     */
    static async findDownloadedFolder(baseFolder: vscode.Uri, expectedFolderName: string): Promise<vscode.Uri | null> {
        try {
            const entries = await vscode.workspace.fs.readDirectory(baseFolder);

            for (const [name, type] of entries) {
                if (type === vscode.FileType.Directory && name === expectedFolderName) {
                    return vscode.Uri.joinPath(baseFolder, name);
                }
            }

            return null;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Failed to search for downloaded folder',
                error instanceof Error ? error : new Error(String(error)),
                { expectedFolderName, baseFolder: baseFolder.fsPath }
            );
            return null;
        }
    }

    /**
     * Validates if the downloaded folder exists and is accessible
     * @param folderPath The folder path to validate
     * @returns True if the folder exists and is accessible, false otherwise
     */
    static async validateDownloadedFolder(folderPath: string): Promise<boolean> {
        try {
            const stat = await vscode.workspace.fs.stat(vscode.Uri.file(folderPath));
            return stat.type === vscode.FileType.Directory;
        } catch {
            return false;
        }
    }
}
