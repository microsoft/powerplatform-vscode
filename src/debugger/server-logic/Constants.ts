/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

/**
 * Command identifiers for Server Logic
 */
export const SERVER_LOGIC_COMMANDS = {
    DEBUG: 'microsoft.powerplatform.pages.debugServerLogic',
    RUN: 'microsoft.powerplatform.pages.runServerLogic'
} as const;

/**
 * Configuration keys for Server Logic settings
 */
export const SERVER_LOGIC_CONFIG_KEYS = {
    DONT_SHOW_WELCOME: 'microsoft.powerplatform.pages.serverLogic.dontShowWelcome'
} as const;

/**
 * File and folder names used by Server Logic debugger
 */
export const SERVER_LOGIC_FILES = {
    RUNTIME_LOADER: 'server-logic-runtime-loader.js',
    SERVER_LOGICS_FOLDER: 'server-logics',
    VSCODE_FOLDER: '.vscode',
    GITIGNORE: '.gitignore'
} as const;

/**
 * URLs for Server Logic documentation
 */
export const SERVER_LOGIC_URLS = {
    LEARN_MORE: 'https://go.microsoft.com/fwlink/?linkid=2346212'
} as const;

/**
 * Regex pattern for matching server-logics or server-logic folder in file paths.
 * Supports both plural (server-logics) and singular (server-logic) folder names
 * for future compatibility.
 */
export const SERVER_LOGICS_FOLDER_PATTERN = /[/\\]server-logics?[/\\]/;

/**
 * Checks if a file is a server logic file based on path and extension
 * @param filePath - The file path to check
 * @returns True if the file is in a server-logics (or server-logic) folder and has .js extension
 */
export function isServerLogicFile(filePath: string): boolean {
    return SERVER_LOGICS_FOLDER_PATTERN.test(filePath) && filePath.endsWith('.js');
}

/**
 * User-facing localized strings for Server Logic debugger.
 * All strings are wrapped with vscode.l10n.t() for localization support.
 */
export const SERVER_LOGIC_STRINGS = {
    DEBUG_CONFIG_NAME: vscode.l10n.t('Debug Power Pages Server Logic'),
    DEBUG_CURRENT_CONFIG_NAME: vscode.l10n.t('Debug Current Server Logic'),
    RUN_CONFIG_NAME: vscode.l10n.t('Run Server Logic'),
    ERROR_OPEN_SERVER_LOGIC_FILE: vscode.l10n.t('Cannot debug: Please open a server logic file (.js) from the server-logics folder.'),
    ERROR_REQUIRES_WORKSPACE: vscode.l10n.t('Server Logic debugging requires an open workspace.'),
    ERROR_INIT_FAILED: (errorMessage: string) => vscode.l10n.t('Failed to initialize Server Logic debugger: {0}', errorMessage),
    ERROR_NO_ACTIVE_EDITOR: vscode.l10n.t('No active editor found.'),
    WARNING_OPEN_SERVER_LOGIC_FILE: vscode.l10n.t('Please open a server logic file (.js) from the server-logics folder.'),
    WARNING_NO_ACTIVE_EDITOR: vscode.l10n.t('No active editor. Please open a server logic file.'),
    WELCOME_MESSAGE: vscode.l10n.t('Power Pages Server Logic detected! You can now debug your server logic files with breakpoints and IntelliSense.'),
    BUTTON_DEBUG_CURRENT_FILE: vscode.l10n.t('Debug Current File'),
    BUTTON_LEARN_MORE: vscode.l10n.t('Learn More'),
    BUTTON_DONT_SHOW_AGAIN: vscode.l10n.t("Don't Show Again"),
    CODELENS_DEBUG: vscode.l10n.t('Debug'),
    CODELENS_DEBUG_TOOLTIP: vscode.l10n.t('Debug this server logic file'),
    CODELENS_RUN: vscode.l10n.t('Run'),
    CODELENS_RUN_TOOLTIP: vscode.l10n.t('Run this server logic file without debugging')
} as const;
