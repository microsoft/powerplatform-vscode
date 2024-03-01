/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getNonce, openWalkthrough } from "../../Utils";
import TelemetryReporter from "@vscode/extension-telemetry";
import { CopilotNotificationDoNotShowChecked, CopilotTryNotificationClickedEvent, CopilotWalkthroughEvent, CopilotNotificationDoNotShowUnchecked } from "../telemetry/telemetryConstants";
import { COPILOT_NOTIFICATION_DISABLED } from "../constants";
import { oneDSLoggerWrapper } from "../../OneDSLoggerTelemetry/oneDSLoggerWrapper";

let NotificationPanel: vscode.WebviewPanel | undefined;

export async function copilotNotificationPanel(context: vscode.ExtensionContext, telemetry: TelemetryReporter, telemetryData: string, countOfActivePortals?: string) {

  if (NotificationPanel) {
    NotificationPanel.dispose();
  }

  NotificationPanel = createNotificationPanel();

  const { notificationCssUri, notificationJsUri, copilotImageUri, arrowImageUri } = getWebviewURIs(context, NotificationPanel);

  const nonce = getNonce();
  const webview = NotificationPanel.webview
  NotificationPanel.webview.html = getWebviewContent(notificationCssUri, notificationJsUri, copilotImageUri, arrowImageUri, nonce, webview);

  NotificationPanel.webview.onDidReceiveMessage(
    async message => {
      switch (message.command) {
        case 'checked':
          telemetry.sendTelemetryEvent(CopilotNotificationDoNotShowChecked, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
          oneDSLoggerWrapper.getLogger().traceInfo(CopilotNotificationDoNotShowChecked, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
          context.globalState.update(COPILOT_NOTIFICATION_DISABLED, true);
          break;
        case 'unchecked':
          telemetry.sendTelemetryEvent(CopilotNotificationDoNotShowUnchecked, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
          oneDSLoggerWrapper.getLogger().traceInfo(CopilotNotificationDoNotShowUnchecked, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
          context.globalState.update(COPILOT_NOTIFICATION_DISABLED, false);
          break;
        case 'tryCopilot':
          telemetry.sendTelemetryEvent(CopilotTryNotificationClickedEvent, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
          oneDSLoggerWrapper.getLogger().traceInfo(CopilotTryNotificationClickedEvent, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
          vscode.commands.executeCommand('powerpages.copilot.focus')
          NotificationPanel?.dispose();
          break;
        case 'learnMore':
          telemetry.sendTelemetryEvent(CopilotWalkthroughEvent, { listOfOrgs: telemetryData, countOfActivePortals: countOfActivePortals as string });
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
        <h1 id="heading">${vscode.l10n.t("Let Copilot help you code")}</h1>
        <p id="welcome-text">${vscode.l10n.t("Whether it’s HTML, CSS, JS, or Liquid code, just describe what you need and let AI build it for you.")}</p>
        <button id="try-button">${vscode.l10n.t("Try Copilot for Power Pages")}</button>
        <a href="#" class="walkthrough-content" id="walkthroughLink"> <span id="walk-text">${vscode.l10n.t("Learn more about Copilot")} </span> <img src="${arrowImageUri}" id="arrow-icon"> </a>
        </div>
        <div>
        <img src="${copilotImageUri}" alt="Image">
        </div>
      </div>
      <div class="checkbox-container">
      <input type="checkbox" id="checkbox">
      <label for="checkbox">${vscode.l10n.t("Do not show again")}</label>
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

