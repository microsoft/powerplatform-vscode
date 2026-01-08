/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { oneDSLoggerWrapper } from '../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { desktopTelemetryEventNames } from '../../common/OneDSLoggerTelemetry/client/desktopExtensionTelemetryEventNames';
import {
    SERVER_LOGIC_STRINGS,
    isServerLogicFile
} from './Constants';
import { createServerLogicDebugConfig, ensureRuntimeLoader } from './ServerLogicDebugger';

/**
 * Provided debug configuration template for Server Logic debugging
 */
export const providedServerLogicDebugConfig: vscode.DebugConfiguration = {
    type: 'node',
    request: 'launch',
    name: SERVER_LOGIC_STRINGS.DEBUG_CONFIG_NAME,
    program: '${file}',
    skipFiles: ['<node_internals>/**'],
    console: 'internalConsole'
};

/**
 * Debug configuration provider for Power Pages Server Logic
 */
export class ServerLogicDebugProvider implements vscode.DebugConfigurationProvider {

    /**
     * Provides initial debug configurations
     */
    provideDebugConfigurations(
        _: vscode.WorkspaceFolder | undefined
    ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return [providedServerLogicDebugConfig];
    }

    /**
     * Resolves the debug configuration before starting the debug session
     */
    async resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        _: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration | undefined> {

        const editor = vscode.window.activeTextEditor;

        // Only handle server logic files
        if (!editor || !isServerLogicFile(editor.document.uri.fsPath)) {
            // Not a server logic file, let other providers handle it
            return config;
        }

        // If empty config (F5 with no launch.json), create one for the current file
        if (!config.type && !config.request && !config.name) {
            config = createServerLogicDebugConfig(editor.document.uri.fsPath);
        }

        if (!folder) {
            vscode.window.showErrorMessage(SERVER_LOGIC_STRINGS.ERROR_REQUIRES_WORKSPACE);
            return undefined;
        }

        try {
            const loaderPath = await ensureRuntimeLoader(folder);

            config.runtimeArgs = config.runtimeArgs || [];
            config.runtimeArgs.unshift('--require', loaderPath);

            if (config.mockDataPath) {
                config.env = config.env || {};
                config.env.MOCK_DATA_PATH = config.mockDataPath;
            }

            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.SERVER_LOGIC_DEBUG_STARTED,
                {
                    hasCustomMockData: String(!!config.mockDataPath),
                    workspaceFolder: folder.name,
                    programFile: config.program ? path.basename(config.program) : 'unknown'
                }
            );

            return config;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            oneDSLoggerWrapper.getLogger().traceError(
                desktopTelemetryEventNames.SERVER_LOGIC_DEBUG_ERROR,
                errorMessage,
                error instanceof Error ? error : new Error(errorMessage),
                {
                    phase: 'resolveDebugConfiguration',
                    workspaceFolder: folder.name
                }
            );

            vscode.window.showErrorMessage(SERVER_LOGIC_STRINGS.ERROR_INIT_FAILED(errorMessage));
            return undefined;
        }
    }
}
