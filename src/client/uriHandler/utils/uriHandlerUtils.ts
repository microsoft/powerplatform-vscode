/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import { URI_CONSTANTS } from "../constants/uriConstants";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { PacWrapper } from "../../pac/PacWrapper";

export interface UriParameters {
    websiteId: string | null;
    environmentId: string | null;
    orgUrl: string | null;
    schema: string | null;
    siteName: string | null;
    siteUrl: string | null;
    modelVersion: number;
}

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

    /**
     * Parse URI parameters into a structured object
     */
    static parseUriParameters(uri: vscode.Uri): UriParameters {
        const urlParams = new URLSearchParams(uri.query);

        const websiteId = urlParams.get(URI_CONSTANTS.PARAMETERS.WEBSITE_ID);
        const environmentId = urlParams.get(URI_CONSTANTS.PARAMETERS.ENV_ID);
        const orgUrl = urlParams.get(URI_CONSTANTS.PARAMETERS.ORG_URL);
        const schema = urlParams.get(URI_CONSTANTS.PARAMETERS.SCHEMA);
        const siteName = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_NAME);
        const siteUrl = urlParams.get(URI_CONSTANTS.PARAMETERS.SITE_URL);

        // Determine model version based on schema parameter
        const modelVersion = schema && schema.toLowerCase() === URI_CONSTANTS.SCHEMA_VALUES.PORTAL_SCHEMA_V2
            ? URI_CONSTANTS.MODEL_VERSIONS.VERSION_2
            : URI_CONSTANTS.MODEL_VERSIONS.VERSION_1;

        return {
            websiteId,
            environmentId,
            orgUrl,
            schema,
            siteName,
            siteUrl,
            modelVersion
        };
    }

    /**
     * Build telemetry data from URI parameters
     */
    static buildTelemetryData(uriParams: UriParameters, uri: vscode.Uri): Record<string, string> {
        return {
            websiteId: uriParams.websiteId || 'missing',
            environmentId: uriParams.environmentId || 'missing',
            orgUrl: uriParams.orgUrl ? 'provided' : 'missing', // Don't log actual URL for privacy
            schema: uriParams.schema || 'none',
            siteName: uriParams.siteName ? 'provided' : 'missing',
            siteUrl: uriParams.siteUrl ? 'provided' : 'missing', // Don't log actual URL for privacy
            uriQuery: uri.query || 'empty',
            modelVersion: uriParams.modelVersion.toString()
        };
    }

    /**
     * Prepare the download folder (create subfolder if needed)
     */
    static async prepareDownloadFolder(selectedFolder: vscode.Uri, uriParams: UriParameters, telemetryData: Record<string, string>): Promise<vscode.Uri> {
        if (uriParams.siteName) {
            const sanitizedSiteName = uriParams.siteName.replace(/[<>:"/\\|?*]/g, '_').trim();
            if (sanitizedSiteName) {
                const subFolder = vscode.Uri.joinPath(selectedFolder, sanitizedSiteName);
                telemetryData.sanitizedSiteName = sanitizedSiteName;

                try {
                    await vscode.workspace.fs.createDirectory(subFolder);
                    return subFolder;
                } catch (error) {
                    // Directory might already exist, use it anyway
                    return subFolder;
                }
            }
        }
        return selectedFolder;
    }

    /**
     * Safely reset PAC process without throwing
     */
    static async resetPacProcessSafely(pacWrapper: PacWrapper, telemetryData: Record<string, string>): Promise<void> {
        try {
            await pacWrapper.resetPacProcess();
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                { ...telemetryData, message: 'PAC process reset after failure' }
            );
        } catch (resetError) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Failed to reset PAC process after failure',
                resetError instanceof Error ? resetError : new Error(String(resetError)),
                { ...telemetryData, error: 'pac_reset_failed' }
            );
        }
    }

    /**
     * Handle errors with consistent logging and user feedback
     */
    static handleError(error: unknown, telemetryData: Record<string, string>, startTime: number, defaultMessage: string): void {
        const errorMessage = error instanceof Error ? error.message : String(error);

        vscode.window.showErrorMessage(URI_HANDLER_STRINGS.ERRORS.URI_HANDLER_FAILED.replace('{0}', errorMessage));
        oneDSLoggerWrapper.getLogger().traceError(
            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
            defaultMessage,
            error instanceof Error ? error : new Error(errorMessage),
            { ...telemetryData, error: 'uri_handler_failed', duration: (Date.now() - startTime).toString() }
        );
    }
}
