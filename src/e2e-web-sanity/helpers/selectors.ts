/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * VS Code Web DOM selectors for web sanity tests.
 * These target stable VS Code UI elements for Playwright interactions.
 */
export const Selectors = {
    // Core workbench
    workbench: '.monaco-workbench',
    activityBar: '.activitybar',
    statusBar: '.statusbar',

    // Editor area
    editorInstance: '.editor-instance',
    tabLabel: '.tab-label',

    // File explorer tree
    explorerViewlet: '[id="workbench.view.explorer"]',
    treeRow: '.monaco-list-row',
    treeRowLabel: '.monaco-icon-label',
    treeRowCollapsibleTwistie: '.monaco-tl-twistie.collapsible',

    // Quick input (command palette)
    quickInput: '.quick-input-widget',
    quickInputList: '.quick-input-list',
    quickInputRow: '.quick-input-list .monaco-list-row',

    // Notifications and dialogs
    notificationsToasts: '.notifications-toasts',
    dialogBox: '.dialog-box',

    // Sidebar / views
    sidebar: '.sidebar',

    // Microsoft login page
    msLoginEmailInput: 'input[type="email"]',
    msLoginPasswordInput: 'input[type="password"]',
    msLoginNextButton: 'input[type="submit"]',
    msLoginStaySignedIn: '#idBtn_Back',
};
