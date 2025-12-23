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
import { ServerLogicDebugProvider } from './ServerLogicDebugProvider';
import { desktopTelemetryEventNames } from '../../common/OneDSLoggerTelemetry/client/desktopExtensionTelemetryEventNames';
import { ECSFeaturesClient } from '../../common/ecs-features/ecsFeatureClient';
import { EnableServerLogicDebugging } from '../../common/ecs-features/ecsFeatureGates';
import {
    SERVER_LOGIC_CONFIG_KEYS,
    SERVER_LOGIC_FILES,
    SERVER_LOGIC_URLS,
    SERVER_LOGIC_STRINGS,
    SERVER_LOGIC_COMMANDS,
    isServerLogicFile
} from './Constants';

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
    const config: vscode.DebugConfiguration = {
        type: 'node',
        request: 'launch',
        name: name ?? SERVER_LOGIC_STRINGS.DEBUG_CONFIG_NAME,
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
    const gitignorePath = path.join(folder.uri.fsPath, SERVER_LOGIC_FILES.GITIGNORE);

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

    ensureGitignore(gitignorePath);

    return loaderPath;
}

/**
 * Ensures .gitignore at project root includes server logic debug files
 * @param gitignorePath - Path to the .gitignore file at project root
 */
function ensureGitignore(gitignorePath: string): void {
    const runtimeLoaderEntry = `.vscode/${SERVER_LOGIC_FILES.RUNTIME_LOADER}`;
    let gitignoreContent = '';

    if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }

    if (!gitignoreContent.includes(runtimeLoaderEntry)) {
        const needsNewline = gitignoreContent.length > 0 && !gitignoreContent.endsWith('\n');
        const prefix = needsNewline ? '\n' : '';
        gitignoreContent += `${prefix}# Server Logic debugging runtime loader\n${runtimeLoaderEntry}\n`;
        fs.writeFileSync(gitignorePath, gitignoreContent, 'utf8');
    }
}

/**
 * Checks if server logic debugging is enabled via FCB
 * @returns true if the feature is enabled
 */
export function isServerLogicDebuggingEnabled(): boolean {
    const { enableServerLogicDebugging } = ECSFeaturesClient.getConfig(EnableServerLogicDebugging);
    return enableServerLogicDebugging;
}

/**
 * Activates the Server Logic debugger
 */
export function activateServerLogicDebugger(context: vscode.ExtensionContext): void {
    // Check FCB before activating
    if (!isServerLogicDebuggingEnabled()) {
        oneDSLoggerWrapper.getLogger().traceInfo(
            desktopTelemetryEventNames.SERVER_LOGIC_DEBUG_FEATURE_DISABLED,
            {}
        );
        return;
    }

    const provider = new ServerLogicDebugProvider();
    context.subscriptions.push(
        vscode.debug.registerDebugConfigurationProvider('node', provider)
    );

    const codeLensProvider = new ServerLogicCodeLensProvider();
    context.subscriptions.push(
        codeLensProvider,
        vscode.languages.registerCodeLensProvider(
            [
                { pattern: '**/server-logics/**/*.js' },
                { pattern: '**/server-logic/**/*.js' }
            ],
            codeLensProvider
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            SERVER_LOGIC_COMMANDS.DEBUG,
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage(SERVER_LOGIC_STRINGS.ERROR_NO_ACTIVE_EDITOR);
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!isServerLogicFile(filePath)) {
                    vscode.window.showWarningMessage(SERVER_LOGIC_STRINGS.WARNING_OPEN_SERVER_LOGIC_FILE);
                    return;
                }

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage(SERVER_LOGIC_STRINGS.ERROR_REQUIRES_WORKSPACE);
                    return;
                }

                const loaderPath = await ensureRuntimeLoader(workspaceFolder);
                const config = createServerLogicDebugConfig(filePath, SERVER_LOGIC_STRINGS.DEBUG_CURRENT_CONFIG_NAME);
                config.runtimeArgs = ['--require', loaderPath];

                await vscode.debug.startDebugging(workspaceFolder, config);

                oneDSLoggerWrapper.getLogger().traceInfo(
                    desktopTelemetryEventNames.SERVER_LOGIC_DEBUG_COMMAND_EXECUTED,
                    {
                        fileName: path.basename(filePath),
                        workspaceFolder: workspaceFolder.name,
                        triggerSource: 'command'
                    }
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            SERVER_LOGIC_COMMANDS.RUN,
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage(SERVER_LOGIC_STRINGS.WARNING_NO_ACTIVE_EDITOR);
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!isServerLogicFile(filePath)) {
                    vscode.window.showWarningMessage(SERVER_LOGIC_STRINGS.WARNING_OPEN_SERVER_LOGIC_FILE);
                    return;
                }

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage(SERVER_LOGIC_STRINGS.ERROR_REQUIRES_WORKSPACE);
                    return;
                }

                const loaderPath = await ensureRuntimeLoader(workspaceFolder);
                const config = createServerLogicDebugConfig(filePath, SERVER_LOGIC_STRINGS.RUN_CONFIG_NAME, true);
                config.runtimeArgs = ['--require', loaderPath];

                await vscode.debug.startDebugging(workspaceFolder, config);

                oneDSLoggerWrapper.getLogger().traceInfo(
                    desktopTelemetryEventNames.SERVER_LOGIC_RUN_COMMAND_EXECUTED,
                    {
                        fileName: path.basename(filePath),
                        workspaceFolder: workspaceFolder.name,
                        triggerSource: 'command'
                    }
                );
            }
        )
    );

    // Show welcome notification when a server logic file is opened
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor && isServerLogicFile(editor.document.uri.fsPath)) {
                showServerLogicWelcomeNotification();
            }
        })
    );

    // Check if active editor already has a server logic file
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && isServerLogicFile(activeEditor.document.uri.fsPath)) {
        showServerLogicWelcomeNotification();
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

    oneDSLoggerWrapper.getLogger().traceInfo(
        desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_SHOWN,
        {}
    );

    vscode.window.showInformationMessage(
        SERVER_LOGIC_STRINGS.WELCOME_MESSAGE,
        SERVER_LOGIC_STRINGS.BUTTON_DEBUG_CURRENT_FILE,
        SERVER_LOGIC_STRINGS.BUTTON_LEARN_MORE,
        SERVER_LOGIC_STRINGS.BUTTON_DONT_SHOW_AGAIN
    ).then(selection => {
        if (selection === SERVER_LOGIC_STRINGS.BUTTON_DEBUG_CURRENT_FILE) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_ACTION,
                { action: 'debug' }
            );
            vscode.commands.executeCommand(SERVER_LOGIC_COMMANDS.DEBUG);
        } else if (selection === SERVER_LOGIC_STRINGS.BUTTON_LEARN_MORE) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_ACTION,
                { action: 'learnMore' }
            );
            vscode.env.openExternal(
                vscode.Uri.parse(SERVER_LOGIC_URLS.LEARN_MORE)
            );
        } else if (selection === SERVER_LOGIC_STRINGS.BUTTON_DONT_SHOW_AGAIN) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_ACTION,
                { action: 'dontShowAgain' }
            );
            vscode.workspace.getConfiguration().update(
                SERVER_LOGIC_CONFIG_KEYS.DONT_SHOW_WELCOME,
                true,
                vscode.ConfigurationTarget.Global
            );
        } else {
            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_ACTION,
                { action: 'dismissed' }
            );
        }
    });
}
