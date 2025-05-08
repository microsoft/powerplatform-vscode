/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { queryParameters } from "../common/constants";
import { getDeviceType } from "../utilities/deviceType";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { getEnvironmentIdFromUrl } from "../utilities/commonUtil";

export class NPSWebView {
    private readonly _webviewPanel: vscode.WebviewPanel;

    private constructor(
        private readonly extensionUri: vscode.Uri,
        webViewPanel: vscode.WebviewPanel
    ) {
        this._webviewPanel = webViewPanel;
        this._webviewPanel.webview.html = this._getHtml();
    }

    private _getHtml() {
        try {
            const nonce = getNonce();
            const mainJs = this.extensionResourceUrl("media", "main.js");
            const tid = WebExtensionContext.urlParametersMap?.get(
                queryParameters.TENANT_ID
            );
            const envId = getEnvironmentIdFromUrl();
            const geo = WebExtensionContext.urlParametersMap?.get(
                queryParameters.GEO
            );
            const culture = vscode.env.language;
            const productVersion = process?.env?.BUILD_NAME;
            const deviceType = getDeviceType();
            const referrerPath: string[] = [
                "https:/",
                vscode.env.appHost,
                "powerplatform/portal",
                WebExtensionContext.defaultEntityType,
                WebExtensionContext.defaultEntityId,
            ];
            const urlReferrer = referrerPath.join("/");
            const formsProEligibilityId =
                WebExtensionContext.formsProEligibilityId;
            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_RENDER_NPS
            );
            return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Test CES Survey</title>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src https://customervoice.microsoft.com/ ; img-src * 'self' data: https:; style-src  https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.css 'nonce-${nonce}';script-src https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.js 'nonce-${nonce}';">
            </head>
            <body>
                <div id="surveyDiv"></div>
                <script src="https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.js" type="text/javascript"></script>
                <link rel="stylesheet" type="text/css" href="https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.css" />
                <script id="npsContext" data-tid="${tid}" data-urlReferrer="${urlReferrer}" data-envId="${envId}" data-geo="${geo}" data-deviceType ="${deviceType}" data-culture ="${culture}" data-productVersion ="${productVersion}" data-formsProEligibilityId ="${formsProEligibilityId}" nonce="${nonce}" type="module" src="${mainJs}"></script>
            </body>
            </html>`;
        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_RENDER_NPS_FAILED,
                this._getHtml.name,
                (error as Error)?.message
            );
            return "";
        }
    }

    private extensionResourceUrl(...parts: string[]): vscode.Uri {
        return this._webviewPanel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.extensionUri, ...parts)
        );
    }

    public static createOrShow(extensionUri: vscode.Uri): NPSWebView {
        const webview = vscode.window.createWebviewPanel(
            "testCESSurvey",
            vscode.l10n.t("Microsoft wants your feedback"),
            { viewColumn: vscode.ViewColumn.One, preserveFocus: false },
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "media", "main.js"),
                ],
            }
        );
        return new NPSWebView(extensionUri, webview);
    }
}

function getNonce() {
    let text = "";
    const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 64; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
