/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateServerMockSdk } from './ServerLogicMockSdk';
import { oneDSLoggerWrapper } from '../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { ServerLogicCodeLensProvider } from './ServerLogicCodeLensProvider';
import { desktopTelemetryEventNames } from '../../common/OneDSLoggerTelemetry/client/desktopExtensionTelemetryEventNames';
import {
    SERVER_LOGIC_CONFIG_KEYS,
    SERVER_LOGIC_FILES,
    SERVER_LOGIC_URLS,
    SERVER_LOGIC_STRINGS,
    SERVER_LOGICS_FOLDER_PATTERN
} from './Constants';

/**
 * Checks if a file is a server logic file based on path and extension
 * @param filePath - The file path to check
 * @returns True if the file is in a server-logics folder and has .js extension
 */
function isServerLogicFile(filePath: string): boolean {
    return SERVER_LOGICS_FOLDER_PATTERN.test(filePath) && filePath.endsWith('.js');
}

/**
 * Creates a debug configuration for server logic files
 * @param program - The file path to debug
 * @param name - Optional custom name for the configuration
 * @param noDebug - If true, runs without debugging
 * @returns A VS Code debug configuration
 */
function createServerLogicDebugConfig(
    program: string,
    name?: string,
    noDebug?: boolean
): vscode.DebugConfiguration {
    const config: vscode.DebugConfiguration = {
        type: 'node',
        request: 'launch',
        name: name ?? vscode.l10n.t(SERVER_LOGIC_STRINGS.DEBUG_CONFIG_NAME),
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
async function ensureRuntimeLoader(folder: vscode.WorkspaceFolder): Promise<string> {
    const vscodeDir = path.join(folder.uri.fsPath, SERVER_LOGIC_FILES.VSCODE_FOLDER);
    const loaderPath = path.join(vscodeDir, SERVER_LOGIC_FILES.RUNTIME_LOADER);
    const gitignorePath = path.join(vscodeDir, SERVER_LOGIC_FILES.GITIGNORE);

    if (!fs.existsSync(vscodeDir)) {
        fs.mkdirSync(vscodeDir, { recursive: true });
    }

    // Only create if it doesn't exist to preserve user customizations
    if (!fs.existsSync(loaderPath)) {
        const loaderContent = generateServerMockSdk();
        fs.writeFileSync(loaderPath, loaderContent, 'utf8');
    }

    ensureGitignore(gitignorePath);

    return loaderPath;
}

/**
 * Ensures .vscode/.gitignore includes server logic debug files
 * @param gitignorePath - Path to the .gitignore file
 */
function ensureGitignore(gitignorePath: string): void {
    const requiredEntries = [SERVER_LOGIC_FILES.RUNTIME_LOADER];
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

/**
 * Provided debug configuration template for Server Logic debugging
 */
export const providedServerLogicDebugConfig: vscode.DebugConfiguration = {
    type: 'node',
    request: 'launch',
    name: vscode.l10n.t(SERVER_LOGIC_STRINGS.DEBUG_CONFIG_NAME),
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

        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && isServerLogicFile(editor.document.uri.fsPath)) {
                config = createServerLogicDebugConfig(editor.document.uri.fsPath);
            } else {
                vscode.window.showErrorMessage(
                    vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_OPEN_SERVER_LOGIC_FILE)
                );
                return undefined;
            }
        }

        if (!folder) {
            vscode.window.showErrorMessage(vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_REQUIRES_WORKSPACE));
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
                    hasCustomMockData: !!config.mockDataPath
                }
            );

            return config;
        } catch (error) {
            vscode.window.showErrorMessage(
                vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_INIT_FAILED, error instanceof Error ? error.message : String(error))
            );
            return undefined;
        }
    }
}

/**
 * Activates the Server Logic debugger
 */
export function activateServerLogicDebugger(context: vscode.ExtensionContext): void {
    const provider = new ServerLogicDebugProvider();
    context.subscriptions.push(
        vscode.debug.registerDebugConfigurationProvider('node', provider)
    );

    const codeLensProvider = new ServerLogicCodeLensProvider();
    context.subscriptions.push(
        codeLensProvider,
        vscode.languages.registerCodeLensProvider(
            { pattern: '**/server-logics/**/*.js' },
            codeLensProvider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'powerpages.debugServerLogic',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage(vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_NO_ACTIVE_EDITOR));
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!isServerLogicFile(filePath)) {
                    vscode.window.showWarningMessage(
                        vscode.l10n.t(SERVER_LOGIC_STRINGS.WARNING_OPEN_SERVER_LOGIC_FILE)
                    );
                    return;
                }

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage(vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_REQUIRES_WORKSPACE));
                    return;
                }

                const loaderPath = await ensureRuntimeLoader(workspaceFolder);
                const config = createServerLogicDebugConfig(filePath, vscode.l10n.t(SERVER_LOGIC_STRINGS.DEBUG_CURRENT_CONFIG_NAME));
                config.runtimeArgs = ['--require', loaderPath];

                await vscode.debug.startDebugging(workspaceFolder, config);

                oneDSLoggerWrapper.getLogger().traceInfo(
                    desktopTelemetryEventNames.SERVER_LOGIC_DEBUG_COMMAND_EXECUTED,
                    {
                        fileName: path.basename(filePath)
                    }
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'powerpages.runServerLogic',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage(vscode.l10n.t(SERVER_LOGIC_STRINGS.WARNING_NO_ACTIVE_EDITOR));
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!isServerLogicFile(filePath)) {
                    vscode.window.showWarningMessage(
                        vscode.l10n.t(SERVER_LOGIC_STRINGS.WARNING_OPEN_SERVER_LOGIC_FILE)
                    );
                    return;
                }

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage(vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_REQUIRES_WORKSPACE));
                    return;
                }

                const loaderPath = await ensureRuntimeLoader(workspaceFolder);
                const config = createServerLogicDebugConfig(filePath, vscode.l10n.t(SERVER_LOGIC_STRINGS.RUN_CONFIG_NAME), true);
                config.runtimeArgs = ['--require', loaderPath];

                await vscode.debug.startDebugging(workspaceFolder, config);

                oneDSLoggerWrapper.getLogger().traceInfo(
                    desktopTelemetryEventNames.SERVER_LOGIC_RUN_COMMAND_EXECUTED,
                    {
                        fileName: path.basename(filePath)
                    }
                );
            }
        )
    );

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
        const serverLogicsPath = path.join(workspaceFolders[0].uri.fsPath, SERVER_LOGIC_FILES.SERVER_LOGICS_FOLDER);
        if (fs.existsSync(serverLogicsPath)) {
            showServerLogicWelcomeNotification();
        }
    }
}

/**
 * Shows a welcome notification for server logic debugging
 */
function showServerLogicWelcomeNotification(): void {
    const dontShowAgain = vscode.workspace.getConfiguration().get(SERVER_LOGIC_CONFIG_KEYS.DONT_SHOW_WELCOME, false);

    if (dontShowAgain) {
        return;
    }

    const debugButton = vscode.l10n.t(SERVER_LOGIC_STRINGS.BUTTON_DEBUG_CURRENT_FILE);
    const learnMoreButton = vscode.l10n.t(SERVER_LOGIC_STRINGS.BUTTON_LEARN_MORE);
    const dontShowButton = vscode.l10n.t(SERVER_LOGIC_STRINGS.BUTTON_DONT_SHOW_AGAIN);

    vscode.window.showInformationMessage(
        vscode.l10n.t(SERVER_LOGIC_STRINGS.WELCOME_MESSAGE),
        debugButton,
        learnMoreButton,
        dontShowButton
    ).then(selection => {
        if (selection === debugButton) {
            vscode.commands.executeCommand('powerpages.debugServerLogic');
        } else if (selection === learnMoreButton) {
            vscode.env.openExternal(
                vscode.Uri.parse(SERVER_LOGIC_URLS.LEARN_MORE)
            );
        } else if (selection === dontShowButton) {
            vscode.workspace.getConfiguration().update(
                SERVER_LOGIC_CONFIG_KEYS.DONT_SHOW_WELCOME,
                true,
                vscode.ConfigurationTarget.Global
            );
        }
    });
}
