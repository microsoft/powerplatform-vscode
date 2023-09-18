/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getNonce, openWalkthrough } from "../../Utils";
import TelemetryReporter from "@vscode/extension-telemetry";
import { CopilotNotificationDoNotShow, CopilotTryNotificationClickedEvent, CopilotWalkthroughEvent } from "../telemetry/telemetryConstants";
import { COPILOT_NOTFICATION_DISABLED } from "../constants";

let NotificationPanel: vscode.WebviewPanel | undefined;

export async function copilotNotificationPanel(context: vscode.ExtensionContext, telemetry: TelemetryReporter, telemetryData: string, countOfActivePortals: string) {

    if (NotificationPanel) {
        NotificationPanel.dispose();
    }

    NotificationPanel = createNotificationPanel();

    console.log(telemetry, telemetryData, countOfActivePortals)

    const { notificationCssUri, notificationJsUri, copilotImageUri, arrowImageUri } = getWebviewURIs(context, NotificationPanel);

    const nonce = getNonce();
    const webview = NotificationPanel.webview
    NotificationPanel.webview.html = getWebviewContent(notificationCssUri, notificationJsUri, copilotImageUri, arrowImageUri, nonce, webview);

    NotificationPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'checked':
                    telemetry.sendTelemetryEvent(CopilotNotificationDoNotShow, { listOfOrgs: telemetryData, countOfActivePortals });
                    context.globalState.update(COPILOT_NOTFICATION_DISABLED, true);
                    break;
                case 'unchecked':
                    context.globalState.update(COPILOT_NOTFICATION_DISABLED, false);
                    break;
                case 'tryCopilot':
                    telemetry.sendTelemetryEvent(CopilotTryNotificationClickedEvent, { listOfOrgs: telemetryData, countOfActivePortals });
                    vscode.commands.executeCommand('powerpages.copilot.focus')
                    NotificationPanel?.dispose();
                    break;
                case 'learnMore':
                    telemetry.sendTelemetryEvent(CopilotWalkthroughEvent, { listOfOrgs: telemetryData, countOfActivePortals });
                    openWalkthrough(context.extensionUri);
            }
        },
        undefined,
        context.subscriptions
    );
}

function createNotificationPanel(): vscode.WebviewPanel {
    const NotificationPanel = vscode.window.createWebviewPanel(
        "CopilotNotification",
        "Copilot in Power Pages",
        {
            viewColumn: vscode.ViewColumn.Beside,
            preserveFocus: true,
        },
        {
            enableScripts: true,
        }
    );

    // context.subscriptions.push(NotificationPanel);

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


function getWebviewContent(notificationCssUri: vscode.Uri, notificationJsUri: vscode.Uri, copilotImageUri: vscode.Uri, arrowImageUri: vscode.Uri, nonce: string, webview: vscode.Webview) {

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${notificationCssUri}" rel="stylesheet">
          </link>
          <title>Feedback</title>
      </head>
      <body>
      <div class="container">
        <div class="container-text">
        <h1 id="heading">Let Copilot help you code</h1>
        <p id="welcome-text">Whether it’s HTML, CSS, JS, or Liquid code, just describe what you need and let AI build it for you.</p>
        <button id="try-button">Try Copilot for Power Pages</button>
        <a href="#" class="walkthrough-content" id="walkthroughLink"> <img src="${arrowImageUri}" id="arrow-icon"> <span id="walk-text">Learn more about Copilot</span></a>
        </div>
        <img src="${copilotImageUri}" alt="Image">
      </div>
      <div class="checkbox-container">
      <input type="checkbox" id="checkbox">
      <label for="checkbox">Do not show again</label>
    </div>

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

