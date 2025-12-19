/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateServerMockSdk } from './ServerLogicMockSdk';
import { oneDSLoggerWrapper } from '../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { desktopTelemetryEventNames } from '../../common/OneDSLoggerTelemetry/client/desktopExtensionTelemetryEventNames';
import { SERVER_LOGIC_FILES, getLocalizedStrings } from './Constants';

/**
 * Creates a debug configuration for server logic files
 * @param program - The file path to debug
 * @param name - Optional custom name for the configuration
 * @param noDebug - If true, runs without debugging
 * @returns A VS Code debug configuration
 */
export function createServerLogicDebugConfig(
    program: string,
    name?: string,
    noDebug?: boolean
): vscode.DebugConfiguration {
    const localizedStrings = getLocalizedStrings();
    const config: vscode.DebugConfiguration = {
        type: 'node',
        request: 'launch',
        name: name ?? localizedStrings.DEBUG_CONFIG_NAME,
        program,
        skipFiles: ['<node_internals>/**'],
        console: 'internalConsole'
    };
    if (noDebug) {
        config.noDebug = true;
    }
    return config;
}

/**
 * Ensures the runtime loader file exists and returns its path.
 * Only creates the file if it doesn't exist, preserving user customizations.
 * @param folder - The workspace folder
 * @returns The path to the runtime loader file
 */
export async function ensureRuntimeLoader(folder: vscode.WorkspaceFolder): Promise<string> {
    const vscodeDir = path.join(folder.uri.fsPath, SERVER_LOGIC_FILES.VSCODE_FOLDER);
    const loaderPath = path.join(vscodeDir, SERVER_LOGIC_FILES.RUNTIME_LOADER);

    if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
    }

    // Only create if it doesn't exist to preserve user customizations
    const loaderExists = fs.existsSync(loaderPath);
    if (!loaderExists) {
        const loaderContent = generateServerMockSdk();
        fs.writeFileSync(loaderPath, loaderContent, 'utf8');

        oneDSLoggerWrapper.getLogger().traceInfo(
            desktopTelemetryEventNames.SERVER_LOGIC_RUNTIME_LOADER_CREATED,
            {
                workspaceFolder: folder.name
            }
        );
    }

    await ensureGitignore(folder.uri.fsPath);

    return loaderPath;
}

/**
 * Ensures .gitignore at project root includes server logic debug files
 * @param workspaceRoot - Path to the workspace root
 */
async function ensureGitignore(workspaceRoot: string): Promise<void> {
    const gitignorePath = path.join(workspaceRoot, SERVER_LOGIC_FILES.GITIGNORE);
    const requiredEntries = [
        `${SERVER_LOGIC_FILES.VSCODE_FOLDER}/${SERVER_LOGIC_FILES.RUNTIME_LOADER}`
    ];
    let gitignoreContent = '';

    if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    let modified = false;
    for (const entry of requiredEntries) {
        if (!gitignoreContent.includes(entry)) {
            gitignoreContent += `\n${entry}`;
            modified = true;
        }
    }

    if (modified) {
        fs.writeFileSync(gitignorePath, gitignoreContent.trim() + '\n', 'utf8');
    }
}
