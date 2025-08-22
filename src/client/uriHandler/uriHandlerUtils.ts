/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Utility functions for URI handler operations
 */

/**
 * Creates a normalized folder name from site name and main site name
 * Format: sitename---mainSiteName (all lowercase, spaces as dashes)
 */
export function createFolderName(siteName: string, mainSiteName?: string): string {
    const normalizedSiteName = siteName.toLowerCase().replace(/\s+/g, '-');

    if (mainSiteName && mainSiteName.trim() !== '') {
        const normalizedMainSiteName = mainSiteName.toLowerCase().replace(/\s+/g, '-');
        return `${normalizedSiteName}---${normalizedMainSiteName}`;
    }

    return normalizedSiteName;
}

/**
 * Searches for a site folder in the selected directory
 * Returns the folder path if found, undefined otherwise
 */
export function findSiteFolder(parentDirectory: string, expectedFolderName: string): string | undefined {
    try {
        const fullPath = path.join(parentDirectory, expectedFolderName);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
            return fullPath;
        }
    } catch (error) {
        // Folder doesn't exist or can't be accessed
    }

    return undefined;
}

/**
 * Prompts user to open folder with options for current or new workspace
 */
export async function promptToOpenFolder(
    folderPath: string,
    promptMessage: string,
    openFolderButton: string,
    openNewWorkspaceButton: string,
    notNowButton: string
): Promise<void> {
    const openAction = await vscode.window.showInformationMessage(
        promptMessage,
        openFolderButton,
        openNewWorkspaceButton,
        notNowButton
    );

    if (openAction === openFolderButton) {
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(folderPath));
    } else if (openAction === openNewWorkspaceButton) {
        await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(folderPath), true);
    }
    // If "Not Now" or user dismisses, do nothing
}

/**
 * Validates required URI parameters
 */
export function validateRequiredParameters(params: { [key: string]: string | undefined }, required: string[]): string | undefined {
    for (const param of required) {
        if (!params[param] || params[param]?.trim() === '') {
            return `${param} is required but not provided`;
        }
    }
    return undefined;
}
