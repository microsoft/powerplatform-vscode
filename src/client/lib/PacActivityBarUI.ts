/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { PacWrapper } from '../pac/PacWrapper';
import { AuthTreeView } from './AuthPanelView';
import { EnvAndSolutionTreeView } from './EnvAndSolutionTreeView';
import { PowerPagesCopilot } from '../../common/copilot/PowerPagesCopilot';
import { PowerPagesChatParticipant } from '../../common/chat-participants/powerpages/PowerPagesChatParticipant';
import { getCurrentSiteInfo } from '../power-pages/actions-hub/CurrentSiteContext';

/**
 * Registers authentication and environment panels that don't require ECS initialization
 * @param pacWrapper - The PAC wrapper instance
 * @returns Array of disposable objects
 */
export function RegisterBasicPanels(pacWrapper: PacWrapper): vscode.Disposable[] {
    const authPanel = new AuthTreeView(() => pacWrapper.authList(), pacWrapper);
    const envAndSolutionPanel = new EnvAndSolutionTreeView(
        () => pacWrapper.orgList(),
        (environmentUrl) => pacWrapper.solutionListFromEnvironment(environmentUrl),
        authPanel.onDidChangeTreeData,
        pacWrapper,
        () => pacWrapper.activeOrg());

    // Gates the declarative view/title buttons in package.json so they can't be clicked before
    // their commands are registered (above), which on first run is delayed by slow CLI
    // acquisition. Avoids "command 'pacCLI.authPanel.refresh' not found" (issue #1601).
    vscode.commands.executeCommand("setContext", "pacCLI.panelsRegistered", true);

    return [authPanel, envAndSolutionPanel];
}

/**
 * Registers copilot related panels that require ECS initialization
 * @param pacWrapper - The PAC wrapper instance
 * @param context - The VS Code extension context
 * @returns Array of disposable objects
 */
export function RegisterCopilotPanels(pacWrapper: PacWrapper, context: vscode.ExtensionContext): vscode.Disposable[] {

    const siteInfo = getCurrentSiteInfo();
    const websiteId = siteInfo.currentSiteId;


    const copilotPanel = new PowerPagesCopilot(context.extensionUri, context, pacWrapper, undefined, websiteId ?? undefined);
    const powerPagesChatParticipant = PowerPagesChatParticipant.getInstance(context, pacWrapper, websiteId ?? undefined);

    vscode.window.registerWebviewViewProvider('powerpages.copilot', copilotPanel, {
        webviewOptions: {
            retainContextWhenHidden: true,
        },
    });

    return [copilotPanel, powerPagesChatParticipant];
}
