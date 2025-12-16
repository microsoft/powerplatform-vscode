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

/**
 * Provided debug configuration template for Server Logic debugging
 */
export const providedServerLogicDebugConfig: vscode.DebugConfiguration = {
    type: 'node',
    request: 'launch',
    name: vscode.l10n.t('Debug Power Pages Server Logic'),
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
            if (editor && this.isServerLogicFile(editor.document.uri.fsPath)) {
                config = {
                    ...providedServerLogicDebugConfig,
                    program: editor.document.uri.fsPath
                };
            } else {
                vscode.window.showErrorMessage(
                    vscode.l10n.t('Cannot debug: Please open a server logic file (.js) from the server-logics folder.')
                );
                return undefined;
            }
        }

        if (!folder) {
            vscode.window.showErrorMessage(vscode.l10n.t('Server Logic debugging requires an open workspace.'));
            return undefined;
        }

        try {
            const loaderPath = await this.ensureRuntimeLoader(folder);

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
                vscode.l10n.t('Failed to initialize Server Logic debugger: {0}', error instanceof Error ? error.message : String(error))
            );
            return undefined;
        }
    }

    /**
     * Checks if a file is a server logic file
     */
    private isServerLogicFile(filePath: string): boolean {
        return filePath.includes('server-logics') && filePath.endsWith('.js');
    }

    /**
     * Ensures the runtime loader file exists and .gitignore is configured
     */
    private async ensureRuntimeLoader(folder: vscode.WorkspaceFolder): Promise<string> {
        const vscodeDir = path.join(folder.uri.fsPath, '.vscode');
        const loaderPath = path.join(vscodeDir, 'server-logic-runtime-loader.js');
        const gitignorePath = path.join(vscodeDir, '.gitignore');

        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }

        if (!fs.existsSync(loaderPath)) {
            const loaderContent = generateServerMockSdk();
            fs.writeFileSync(loaderPath, loaderContent, 'utf8');
        }

        this.ensureGitignore(gitignorePath);

        return loaderPath;
    }

    /**
     * Ensures .vscode/.gitignore includes server logic debug files
     */
    private ensureGitignore(gitignorePath: string): void {
        const requiredEntries = ['server-logic-runtime-loader.js'];
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
                    vscode.window.showErrorMessage(vscode.l10n.t('No active editor found.'));
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!filePath.includes('server-logics') || !filePath.endsWith('.js')) {
                    vscode.window.showWarningMessage(
                        vscode.l10n.t('Please open a server logic file (.js) from the server-logics folder.')
                    );
                    return;
                }

                await vscode.debug.startDebugging(
                    vscode.workspace.getWorkspaceFolder(editor.document.uri),
                    {
                        type: 'node',
                        request: 'launch',
                        name: vscode.l10n.t('Debug Current Server Logic'),
                        program: filePath,
                        skipFiles: ['<node_internals>/**'],
                        console: 'internalConsole'
                    }
                );

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
                    vscode.window.showWarningMessage(vscode.l10n.t('No active editor. Please open a server logic file.'));
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!filePath.includes('server-logics') || !filePath.endsWith('.js')) {
                    vscode.window.showWarningMessage(
                        vscode.l10n.t('Please open a server logic file (.js) from the server-logics folder.')
                    );
                    return;
                }

                await vscode.debug.startDebugging(
                    vscode.workspace.getWorkspaceFolder(editor.document.uri),
                    {
                        type: 'node',
                        request: 'launch',
                        name: vscode.l10n.t('Run Server Logic'),
                        program: filePath,
                        skipFiles: ['<node_internals>/**'],
                        console: 'internalConsole',
                        noDebug: true
                    }
                );

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
        const serverLogicsPath = path.join(workspaceFolders[0].uri.fsPath, 'server-logics');
        if (fs.existsSync(serverLogicsPath)) {
            showServerLogicWelcomeNotification();
        }
    }
}

/**
 * Shows a welcome notification for server logic debugging
 */
function showServerLogicWelcomeNotification(): void {
    const dontShowAgainKey = 'powerPages.serverLogic.dontShowWelcome';
    const dontShowAgain = vscode.workspace.getConfiguration().get(dontShowAgainKey, false);

    if (dontShowAgain) {
        return;
    }

    const debugButton = vscode.l10n.t('Debug Current File');
    const learnMoreButton = vscode.l10n.t('Learn More');
    const dontShowButton = vscode.l10n.t("Don't Show Again");

    vscode.window.showInformationMessage(
        vscode.l10n.t('🎯 Power Pages Server Logic detected! You can now debug your server logic files with breakpoints and IntelliSense.'),
        debugButton,
        learnMoreButton,
        dontShowButton
    ).then(selection => {
        if (selection === debugButton) {
            vscode.commands.executeCommand('powerpages.debugServerLogic');
        } else if (selection === learnMoreButton) {
            vscode.env.openExternal(
                vscode.Uri.parse('https://learn.microsoft.com/power-pages/configure/server-side-scripting')
            );
        } else if (selection === dontShowButton) {
            vscode.workspace.getConfiguration().update(
                dontShowAgainKey,
                true,
                vscode.ConfigurationTarget.Global
            );
        }
    });
}
