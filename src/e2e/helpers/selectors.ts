/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * VS Code Web DOM selectors for E2E tests.
 * These target stable VS Code UI elements for Playwright interactions.
 */
export const Selectors = {
    // Activity bar
    activityBar: '.activitybar',
    explorerViewlet: '[id="workbench.view.explorer"]',

    // Editor area
    editorInstance: '.editor-instance',
    editorContainer: '.editor-container',
    tabLabel: '.tab-label',

    // File explorer tree
    treeRow: '.monaco-list-row',
    treeRowLabel: '.monaco-icon-label',

    // Notifications and dialogs
    notificationsToasts: '.notifications-toasts',
    dialogMessage: '.dialog-message-text',
    dialogBox: '.dialog-box',

    // Status bar
    statusBar: '.statusbar',

    // Power Pages specific
    powerPagesExplorer: '[id="powerpages-explorer"]',
    powerPagesFileExplorer: '[id="simpleFileExplorer"]',

    // Microsoft login page
    msLoginEmailInput: 'input[type="email"]',
    msLoginPasswordInput: 'input[type="password"]',
    msLoginNextButton: 'input[type="submit"]',
    msLoginStaySignedIn: '#idBtn_Back',

    // VS Code Web loading
    workbench: '.monaco-workbench',
    quickInput: '.quick-input-widget',
};
