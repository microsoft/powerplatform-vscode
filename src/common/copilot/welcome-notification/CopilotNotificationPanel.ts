/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getNonce } from "../../utilities/Utils";
import { CopilotNotificationDoNotShowChecked, CopilotTryNotificationClickedEvent, CopilotNotificationDoNotShowUnchecked, CopilotNotificationTryGitHubCopilotClicked, VSCodeExtensionGitHubChatPanelOpened, VSCodeExtensionGitHubChatNotFound } from "../telemetry/telemetryConstants";
import { COPILOT_IN_POWERPAGES, COPILOT_NOTIFICATION_DISABLED, PowerPagesParticipantDocLink, PowerPagesParticipantPrompt } from "../constants";
import { oneDSLoggerWrapper } from "../../OneDSLoggerTelemetry/oneDSLoggerWrapper";

let NotificationPanel: vscode.WebviewPanel | undefined;

export async function copilotNotificationPanel(context: vscode.ExtensionContext, telemetryData: string, countOfActivePortals?: string) {

    if (NotificationPanel) {
        NotificationPanel.dispose();
    }

    NotificationPanel = createNotificationPanel();

    const { notificationCssUri, notificationJsUri, copilotImageUri, arrowImageUri } = getWebviewURIs(context, NotificationPanel);

    const nonce = getNonce();
    const webview = NotificationPanel.webview
    let isGitHubCopilotPresent = false;
    let GITHUB_COPILOT_CHAT: string;

    if (vscode.extensions.getExtension('github.copilot-chat')) {
        GITHUB_COPILOT_CHAT = vscode.l10n.t('Try @powerpages with GitHub Copilot');
        isGitHubCopilotPresent = true;
    } else {
        GITHUB_COPILOT_CHAT = vscode.l10n.t('Get GitHub Copilot to try @powerpages');
    }

    NotificationPanel.webview.html = getWebviewContent(notificationCssUri, notificationJsUri, copilotImageUri, arrowImageUri, nonce, webview, GITHUB_COPILOT_CHAT);

    NotificationPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'checked':
                    oneDSLoggerWrapper.getLogger().traceInfo(CopilotNotificationDoNotShowChecked, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
                    context.globalState.update(COPILOT_NOTIFICATION_DISABLED, true);
                    break;
                case 'unchecked':
                    oneDSLoggerWrapper.getLogger().traceInfo(CopilotNotificationDoNotShowUnchecked, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
                    context.globalState.update(COPILOT_NOTIFICATION_DISABLED, false);
                    break;
                case 'tryCopilot':
                    oneDSLoggerWrapper.getLogger().traceInfo(CopilotTryNotificationClickedEvent, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
                    vscode.commands.executeCommand('powerpages.copilot.focus')
                    NotificationPanel?.dispose();
                    break;
                case 'learnMore':
                    oneDSLoggerWrapper.getLogger().traceInfo(CopilotNotificationTryGitHubCopilotClicked, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
                    if (isGitHubCopilotPresent) {
                        oneDSLoggerWrapper.getLogger().traceInfo(VSCodeExtensionGitHubChatPanelOpened, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
                        vscode.commands.executeCommand('workbench.action.chat.open', PowerPagesParticipantPrompt);
                    } else {
                        oneDSLoggerWrapper.getLogger().traceInfo(VSCodeExtensionGitHubChatNotFound, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
                        vscode.env.openExternal(vscode.Uri.parse(PowerPagesParticipantDocLink));
                    }
            }
        },
        undefined,
        context.subscriptions
    );
}

function createNotificationPanel(): vscode.WebviewPanel {
    const NotificationPanel = vscode.window.createWebviewPanel(
        "CopilotNotification",
        COPILOT_IN_POWERPAGES,
        {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true,
        },
        {
            enableScripts: true,
        }
    );

    return NotificationPanel;
}

function getWebviewURIs(context: vscode.ExtensionContext, NotificationPanel: vscode.WebviewPanel): { notificationCssUri: vscode.Uri, notificationJsUri: vscode.Uri, copilotImageUri: vscode.Uri, arrowImageUri: vscode.Uri } {

    const srcPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'copilot', "welcome-notification");

    const notificationCssPath = vscode.Uri.joinPath(srcPath, "copilotNotification.css");
    const notificationCssUri = NotificationPanel.webview.asWebviewUri(notificationCssPath);

    const notificationJsPath = vscode.Uri.joinPath(srcPath, "copilotNotification.js");
    const notificationJsUri = NotificationPanel.webview.asWebviewUri(notificationJsPath);

    const copilotImagePath = vscode.Uri.joinPath(srcPath, "notification.svg");
    const copilotImageUri = NotificationPanel.webview.asWebviewUri(copilotImagePath);

    const arrowImagePath = vscode.Uri.joinPath(srcPath, "arrow.svg");
    const arrowImageUri = NotificationPanel.webview.asWebviewUri(arrowImagePath);

    return { notificationCssUri, notificationJsUri, copilotImageUri, arrowImageUri };
}


function getWebviewContent(notificationCssUri: vscode.Uri, notificationJsUri: vscode.Uri, copilotImageUri: vscode.Uri, arrowImageUri: vscode.Uri, nonce: string, webview: vscode.Webview, githubCopilotChat: string) {

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${notificationCssUri}" rel="stylesheet" />
        <title>Feedback</title>
    </head>
    <body>
    <main class="container" role="region" aria-labelledby="heading">
        <div class="container-text">
            <h1 id="heading">${vscode.l10n.t("Let Copilot help you code")}</h1>
            <p id="welcome-text">${vscode.l10n.t("Whether it’s HTML, CSS, JS, or Liquid code, just describe what you need and let AI build it for you.")}</p>
            <button id="try-button" aria-label="${vscode.l10n.t("Continue with Copilot for Power Pages")}">
                ${vscode.l10n.t("Continue with Copilot for Power Pages")}
            </button>
            <a href="#" class="walkthrough-content" id="walkthroughLink" aria-labelledby="walk-text">
                <span id="walk-text">${vscode.l10n.t(githubCopilotChat)}</span>
                <img src="${arrowImageUri}" id="arrow-icon" alt="${vscode.l10n.t("Arrow icon")}">
            </a>
        </div>
        <div>
            <img src="${copilotImageUri}" alt="${vscode.l10n.t("Copilot illustration")}" role="img">
        </div>
        <div class="checkbox-container">
            <input type="checkbox" id="checkbox" aria-labelledby="checkbox-label"/>
            <label id="checkbox-label" for="checkbox">${vscode.l10n.t("Do not show again")}</label>
        </div>
    </main>
    <script type="module" nonce="${nonce}" src="${notificationJsUri}"></script>
    </body>
    </html>`;
}

export function disposeNotificationPanel() {
    if (NotificationPanel) {
        NotificationPanel.dispose();
        NotificationPanel = undefined;
    }
}
