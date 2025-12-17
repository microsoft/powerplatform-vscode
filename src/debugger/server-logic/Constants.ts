/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Configuration keys for Server Logic settings
 */
export const SERVER_LOGIC_CONFIG_KEYS = {
    DONT_SHOW_WELCOME: 'powerPages.serverLogic.dontShowWelcome'
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
    LEARN_MORE: 'https://learn.microsoft.com/power-pages/configure/server-side-scripting'
} as const;

/**
 * Regex pattern for matching server-logics folder in file paths
 */
export const SERVER_LOGICS_FOLDER_PATTERN = /[/\\]server-logics[/\\]/;

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
    BUTTON_DONT_SHOW_AGAIN: "Don't Show Again"
} as const;
