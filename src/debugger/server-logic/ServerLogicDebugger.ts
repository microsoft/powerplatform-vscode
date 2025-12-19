/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { oneDSLoggerWrapper } from '../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { ServerLogicCodeLensProvider } from './ServerLogicCodeLensProvider';
import { desktopTelemetryEventNames } from '../../common/OneDSLoggerTelemetry/client/desktopExtensionTelemetryEventNames';
import { ServerLogicDebugProvider } from './ServerLogicDebugProvider';
import { isServerLogicFile } from './ServerLogicUtils';
import { ensureRuntimeLoader, createServerLogicDebugConfig } from './ServerLogicDebuggerHelpers';
import {
    SERVER_LOGIC_CONFIG_KEYS,
    SERVER_LOGIC_FILES,
    SERVER_LOGIC_URLS,
    getLocalizedStrings
} from './Constants';

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
            { pattern: '**/server-logic?(s)/**/*.js' },
            codeLensProvider
        )
    );

    const localizedStrings = getLocalizedStrings();

    context.subscriptions.push(
        vscode.commands.registerCommand(
            'microsoft.powerplatform.pages.debugServerLogic',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showErrorMessage(localizedStrings.ERROR_NO_ACTIVE_EDITOR);
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!isServerLogicFile(filePath)) {
                    vscode.window.showWarningMessage(localizedStrings.WARNING_OPEN_SERVER_LOGIC_FILE);
                    return;
                }

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage(localizedStrings.ERROR_REQUIRES_WORKSPACE);
                    return;
                }

                const loaderPath = await ensureRuntimeLoader(workspaceFolder);
                const config = createServerLogicDebugConfig(filePath, localizedStrings.DEBUG_CURRENT_CONFIG_NAME);
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
            'microsoft.powerplatform.pages.runServerLogic',
            async () => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    vscode.window.showWarningMessage(localizedStrings.WARNING_NO_ACTIVE_EDITOR);
                    return;
                }

                const filePath = editor.document.uri.fsPath;
                if (!isServerLogicFile(filePath)) {
                    vscode.window.showWarningMessage(localizedStrings.WARNING_OPEN_SERVER_LOGIC_FILE);
                    return;
                }

                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage(localizedStrings.ERROR_REQUIRES_WORKSPACE);
                    return;
                }

                const loaderPath = await ensureRuntimeLoader(workspaceFolder);
                const config = createServerLogicDebugConfig(filePath, localizedStrings.RUN_CONFIG_NAME, true);
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

    const localizedStrings = getLocalizedStrings();
    const debugButton = localizedStrings.BUTTON_DEBUG_CURRENT_FILE;
    const learnMoreButton = localizedStrings.BUTTON_LEARN_MORE;
    const dontShowButton = localizedStrings.BUTTON_DONT_SHOW_AGAIN;

    oneDSLoggerWrapper.getLogger().traceInfo(
        desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_SHOWN,
        {}
    );

    vscode.window.showInformationMessage(
        localizedStrings.WELCOME_MESSAGE,
        debugButton,
        learnMoreButton,
        dontShowButton
    ).then(selection => {
        if (selection === debugButton) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_ACTION,
                { action: 'debug' }
            );
            vscode.commands.executeCommand('microsoft.powerplatform.pages.debugServerLogic');
        } else if (selection === learnMoreButton) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                desktopTelemetryEventNames.SERVER_LOGIC_WELCOME_NOTIFICATION_ACTION,
                { action: 'learnMore' }
            );
            vscode.env.openExternal(
                vscode.Uri.parse(SERVER_LOGIC_URLS.LEARN_MORE)
            );
        } else if (selection === dontShowButton) {
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

