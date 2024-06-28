/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { telemetryEventNames } from "../telemetry/constants";

export class NPSWebView {
    private readonly _webviewPanel: vscode.WebviewPanel;

    private constructor(
        private readonly extensionUri: vscode.Uri,
        webViewPanel: vscode.WebviewPanel
    ) {
        this._webviewPanel = webViewPanel;
        this.initializeWebView();
    }

    private async initializeWebView() {
        try {
            const webviewHtml = await this._getHtml();
            if (!webviewHtml) {
                this._webviewPanel.dispose();
            } else {
                this._webviewPanel.webview.html = webviewHtml;
            }
        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                telemetryEventNames.WEB_EXTENSION_NPS_WEBVIEW_FAILED_TO_INITIALIZE,
                this.initializeWebView.name,
                (error as Error)?.message
            );
            this._webviewPanel.dispose();
        }
    }

    private async _getHtml(): Promise<string> {
        try {
            const surveyLocation = vscode.Uri.joinPath(
                this.extensionUri,
                "dist",
                "media",
                "survey.lib.umd.v1.0.10.min.js"
            );
            const surveyUrl = new URL(surveyLocation.toString());
            const surveyScript = await WebExtensionContext.fetchLocalScriptContent(
                surveyUrl
            );

            return `
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self';">
                        <title>Microsoft wants your feedback</title>
                        <script>${surveyScript}</script>
                    </head>
                    <body>
                        <survey-sdk id="mySurvey"></survey-sdk>
                    </body>
                    <script>
                        function getAccessToken() {
                            return '<access token>'
                        }
                        async function submitFeedback(teamName, surveyName, userId, feedback) {
                            await new Promise((resolve) => {
                                setTimeout(() => {
                                    resolve();
                                }, 0.5 * 1000);
                            });
                            return '<feedbackId>'; // feedbackId from CES APIs
                        }
                        async function updateFeedback(teamName, surveyName, userId, feedbackId, feedback) {
                            await new Promise((resolve) => {
                                setTimeout(() => {
                                    resolve();
                                }, 0.5 * 1000);
                            });
                        }

                        document.addEventListener("DOMContentLoaded", function () {
                            const config = {
                                teamName: 'powerapps',
                                surveyName: 'powerapps-nsat',
                                userId: 'test123',
                                tenantId: '00000000-0000-0000-0000-000000000000',
                                locale: 'en',
                                width: 520,
                                uiType: survey.UiType.Modal,
                                template: survey.Template.SAT,
                                environment: survey.Environment.INT,
                                region: survey.Region.World,
                                accessToken: {
                                    getAccessToken
                                },
                                callbackFunctions: {
                                    submitFeedback,
                                    updateFeedback
                                }
                            };
                            const element = document.getElementById('mySurvey');
                            element.config = config;
                        });
                    </script>
                </html>
            `;
        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                telemetryEventNames.WEB_EXTENSION_RENDER_NPS_FAILED,
                this._getHtml.name,
                (error as Error)?.message
            );
            return "";
        }
    }

    public static createOrShow(extensionUri: vscode.Uri): NPSWebView {
        const webview = vscode.window.createWebviewPanel(
            "testCESSurvey",
            vscode.l10n.t("Microsoft wants your feedback"),
            { viewColumn: vscode.ViewColumn.One, preserveFocus: false },
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "dist", "media"),
                ],
            }
        );
        return new NPSWebView(extensionUri, webview);
    }
}
