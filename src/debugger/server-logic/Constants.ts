/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

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
 * Regex pattern for matching server-logics or server-logic folder in file paths
 * Supports both plural and singular forms for future compatibility
 */
export const SERVER_LOGICS_FOLDER_PATTERN = /[/\\]server-logic(s)?[/\\]/;

/**
 * User-facing strings for Server Logic debugger (localization keys)
 */
export const SERVER_LOGIC_STRINGS = {
    DEBUG_CONFIG_NAME: 'Debug Power Pages Server Logic',
    DEBUG_CURRENT_CONFIG_NAME: 'Debug Current Server Logic',
    RUN_CONFIG_NAME: 'Run Server Logic',
    ERROR_OPEN_SERVER_LOGIC_FILE: 'Cannot debug: Please open a server logic file (.js) from the server-logics folder.',
    ERROR_REQUIRES_WORKSPACE: 'Server Logic debugging requires an open workspace.',
    ERROR_INIT_FAILED: 'Failed to initialize Server Logic debugger: {0}',
    ERROR_NO_ACTIVE_EDITOR: 'No active editor found.',
    WARNING_OPEN_SERVER_LOGIC_FILE: 'Please open a server logic file (.js) from the server-logics folder.',
    WARNING_NO_ACTIVE_EDITOR: 'No active editor. Please open a server logic file.',
    WELCOME_MESSAGE: 'Power Pages Server Logic detected! You can now debug your server logic files with breakpoints and IntelliSense.',
    BUTTON_DEBUG_CURRENT_FILE: 'Debug Current File',
    BUTTON_LEARN_MORE: 'Learn More',
    BUTTON_DONT_SHOW_AGAIN: "Don't Show Again",
    DEBUG: 'Debug',
    DEBUG_TOOLTIP: 'Debug this server logic file',
    RUN: 'Run',
    RUN_TOOLTIP: 'Run this server logic file without debugging'
} as const;

/**
 * Gets localized strings for Server Logic debugger
 */
export const getLocalizedStrings = () => ({
    DEBUG_CONFIG_NAME: vscode.l10n.t(SERVER_LOGIC_STRINGS.DEBUG_CONFIG_NAME),
    DEBUG_CURRENT_CONFIG_NAME: vscode.l10n.t(SERVER_LOGIC_STRINGS.DEBUG_CURRENT_CONFIG_NAME),
    RUN_CONFIG_NAME: vscode.l10n.t(SERVER_LOGIC_STRINGS.RUN_CONFIG_NAME),
    ERROR_OPEN_SERVER_LOGIC_FILE: vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_OPEN_SERVER_LOGIC_FILE),
    ERROR_REQUIRES_WORKSPACE: vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_REQUIRES_WORKSPACE),
    ERROR_INIT_FAILED: (error: string) => vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_INIT_FAILED, error),
    ERROR_NO_ACTIVE_EDITOR: vscode.l10n.t(SERVER_LOGIC_STRINGS.ERROR_NO_ACTIVE_EDITOR),
    WARNING_OPEN_SERVER_LOGIC_FILE: vscode.l10n.t(SERVER_LOGIC_STRINGS.WARNING_OPEN_SERVER_LOGIC_FILE),
    WARNING_NO_ACTIVE_EDITOR: vscode.l10n.t(SERVER_LOGIC_STRINGS.WARNING_NO_ACTIVE_EDITOR),
    WELCOME_MESSAGE: vscode.l10n.t(SERVER_LOGIC_STRINGS.WELCOME_MESSAGE),
    BUTTON_DEBUG_CURRENT_FILE: vscode.l10n.t(SERVER_LOGIC_STRINGS.BUTTON_DEBUG_CURRENT_FILE),
    BUTTON_LEARN_MORE: vscode.l10n.t(SERVER_LOGIC_STRINGS.BUTTON_LEARN_MORE),
    BUTTON_DONT_SHOW_AGAIN: vscode.l10n.t(SERVER_LOGIC_STRINGS.BUTTON_DONT_SHOW_AGAIN),
    DEBUG: vscode.l10n.t(SERVER_LOGIC_STRINGS.DEBUG),
    DEBUG_TOOLTIP: vscode.l10n.t(SERVER_LOGIC_STRINGS.DEBUG_TOOLTIP),
    RUN: vscode.l10n.t(SERVER_LOGIC_STRINGS.RUN),
    RUN_TOOLTIP: vscode.l10n.t(SERVER_LOGIC_STRINGS.RUN_TOOLTIP)
});
