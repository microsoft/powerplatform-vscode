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

/**
 * Provided debug configuration template for Server Logic debugging
 */
export const providedServerLogicDebugConfig: vscode.DebugConfiguration = {
    type: 'node',
    request: 'launch',
    name: 'Debug Power Pages Server Logic',
    program: '${file}',
    skipFiles: ['<node_internals>/**'],
    console: 'integratedTerminal',
    internalConsoleOptions: 'neverOpen'
};

/**
 * Debug configuration provider for Power Pages Server Logic
 */
export class ServerLogicDebugProvider implements vscode.DebugConfigurationProvider {

    /**
     * Provides initial debug configurations
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    provideDebugConfigurations(
        _folder: vscode.WorkspaceFolder | undefined
    ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
        return [providedServerLogicDebugConfig];
    }

    /**
     * Resolves the debug configuration before starting the debug session
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async resolveDebugConfiguration(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        _token?: vscode.CancellationToken
    ): Promise<vscode.DebugConfiguration | undefined> {

        // If no configuration provided, create default
        if (!config.type && !config.request && !config.name) {
            const editor = vscode.window.activeTextEditor;
            if (editor && this.isServerLogicFile(editor.document.uri.fsPath)) {
                config = {
                    ...providedServerLogicDebugConfig,
                    program: editor.document.uri.fsPath
                };
            } else {
                vscode.window.showErrorMessage(
                    'Cannot debug: Please open a server logic file (.js) from the server-logics folder.'
                );
                return undefined;
            }
        }

        // Ensure we have a workspace folder
        if (!folder) {
            vscode.window.showErrorMessage('Server Logic debugging requires an open workspace.');
            return undefined;
        }

        try {
            // Generate/update the runtime loader
            const loaderPath = await this.ensureRuntimeLoader(folder);

            // Inject the runtime loader into the debug configuration
            config.runtimeArgs = config.runtimeArgs || [];
            config.runtimeArgs.unshift('--require', loaderPath);

            // Set environment variables if mock data path is provided
            if (config.mockDataPath) {
                config.env = config.env || {};
                config.env.MOCK_DATA_PATH = config.mockDataPath;
            }

            // Log telemetry
            oneDSLoggerWrapper.getLogger().traceInfo(
                'ServerLogicDebugStarted',
                {
                    hasCustomMockData: !!config.mockDataPath
                }
            );

            return config;
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to initialize Server Logic debugger: ${error instanceof Error ? error.message : error}`
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
     * Ensures the runtime loader file exists and is up to date
     */
    private async ensureRuntimeLoader(folder: vscode.WorkspaceFolder): Promise<string> {
        const vscodeDir = path.join(folder.uri.fsPath, '.vscode');
        const loaderPath = path.join(vscodeDir, 'server-logic-runtime-loader.js');

        // Create .vscode directory if it doesn't exist
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
        }

        // Generate the runtime loader content
        const loaderContent = generateServerMockSdk();

        // Write the file
        fs.writeFileSync(loaderPath, loaderContent, 'utf8');

        return loaderPath;
    }
}

/**
 * Activates the Server Logic debugger
 */
export function activateServerLogicDebugger(context: vscode.ExtensionContext): void {
    // Register debug configuration provider
    const provider = new ServerLogicDebugProvider();
    context.subscriptions.push(
        vscode.debug.registerDebugConfigurationProvider('node', provider)
    );

    // Register CodeLens provider for server logic files
    const codeLensProvider = new ServerLogicCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { pattern: '**/server-logics/**/*.js' },
            codeLensProvider
        )
    );

    // Register command to debug current server logic file
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'powerpages.debugServerLogic',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage('No active editor found.');
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!filePath.includes('server-logics') || !filePath.endsWith('.js')) {
                    vscode.window.showWarningMessage(
                        'Please open a server logic file (.js) from the server-logics folder.'
                    );
                    return;
                }

                // Start debugging with the current file
                await vscode.debug.startDebugging(
                    vscode.workspace.getWorkspaceFolder(editor.document.uri),
                    {
                        type: 'node',
                        request: 'launch',
                        name: 'Debug Current Server Logic',
                        program: filePath,
                        skipFiles: ['<node_internals>/**'],
                        console: 'integratedTerminal',
                        internalConsoleOptions: 'neverOpen'
                    }
                );

                // Log telemetry
                oneDSLoggerWrapper.getLogger().traceInfo(
                    'ServerLogicDebugCommandExecuted',
                    {
                        fileName: path.basename(filePath)
                    }
                );
            }
        )
    );

    // Register command to run server logic without debugging
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'powerpages.runServerLogic',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage('No active editor. Please open a server logic file.');
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!filePath.includes('server-logics') || !filePath.endsWith('.js')) {
                    vscode.window.showWarningMessage(
                        'Please open a server logic file (.js) from the server-logics folder.'
                    );
                    return;
                }

                // Run without debugging
                await vscode.debug.startDebugging(
                    vscode.workspace.getWorkspaceFolder(editor.document.uri),
                    {
                        type: 'node',
                        request: 'launch',
                        name: 'Run Server Logic',
                        program: filePath,
                        skipFiles: ['<node_internals>/**'],
                        console: 'integratedTerminal',
                        internalConsoleOptions: 'neverOpen',
                        noDebug: true
                    }
                );

                // Log telemetry
                oneDSLoggerWrapper.getLogger().traceInfo(
                    'ServerLogicRunCommandExecuted',
                    {
                        fileName: path.basename(filePath)
                    }
                );
            }
        )
    );

    // Register command to generate mock data template
    context.subscriptions.push(
        vscode.commands.registerCommand(
            'powerpages.generateMockDataTemplate',
            async () => {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders || workspaceFolders.length === 0) {
                    vscode.window.showErrorMessage('No workspace folder is open.');
                    return;
                }

                const vscodeDir = path.join(workspaceFolders[0].uri.fsPath, '.vscode');
                const mockDataPath = path.join(vscodeDir, 'mock-data.json');

                // Create .vscode directory if it doesn't exist
                if (!fs.existsSync(vscodeDir)) {
                    fs.mkdirSync(vscodeDir, { recursive: true });
                }

                // Generate template
                const template = {
                    User: {
                        id: "custom-user-id",
                        fullname: "John Doe",
                        email: "john.doe@example.com",
                        username: "johndoe",
                        Roles: ["System Administrator"],
                        IsAuthenticated: true,
                        contactid: "contact-guid-here"
                    },
                    Context: {
                        Method: "POST",
                        Url: "https://yoursite.powerappsportals.com/api/custom"
                    },
                    QueryParameters: {
                        id: "your-custom-id",
                        action: "process"
                    },
                    Headers: {
                        "Authorization": "Bearer your-token",
                        "Content-Type": "application/json"
                    }
                };

                fs.writeFileSync(mockDataPath, JSON.stringify(template, null, 4), 'utf8');

                // Open the file
                const document = await vscode.workspace.openTextDocument(mockDataPath);
                await vscode.window.showTextDocument(document);

                vscode.window.showInformationMessage(
                    'Mock data template created at .vscode/mock-data.json'
                );

                // Log telemetry
                oneDSLoggerWrapper.getLogger().traceInfo('ServerLogicMockDataTemplateGenerated');
            }
        )
    );

    // Show welcome notification if server-logics folder exists
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

    vscode.window.showInformationMessage(
        '🎯 Power Pages Server Logic detected! You can now debug your server logic files with breakpoints and IntelliSense.',
        'Debug Current File',
        'Learn More',
        "Don't Show Again"
    ).then(selection => {
        if (selection === 'Debug Current File') {
            vscode.commands.executeCommand('powerpages.debugServerLogic');
        } else if (selection === 'Learn More') {
            vscode.env.openExternal(
                vscode.Uri.parse('https://learn.microsoft.com/power-pages/configure/server-side-scripting')
            );
        } else if (selection === "Don't Show Again") {
            vscode.workspace.getConfiguration().update(
                dontShowAgainKey,
                true,
                vscode.ConfigurationTarget.Global
            );
        }
    });
}
