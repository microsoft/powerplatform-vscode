/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { queryParameters } from "../common/constants";
import { webExtensionTelemetryEventNames } from "../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents";
import { SurveyConstants } from "../../../common/copilot/user-feedback/constants";
import { NPSService } from "../services/NPSService";

export class NPSWebView {
    private readonly _webviewPanel: vscode.WebviewPanel;

    private constructor(
        private readonly extensionUri: vscode.Uri,
        webViewPanel: vscode.WebviewPanel
    ) {
        this._webviewPanel = webViewPanel;
        this.initializeWebView().catch((error) => this.handleError(error));
    }

    private async initializeWebView() {
        try {
            const webviewHtml = await this._getHtml();
            this._webviewPanel.webview.html = webviewHtml;
        } catch (error) {
            this.handleError(error);
        }
    }

    private handleError(error: unknown) {
        WebExtensionContext.telemetry.sendErrorTelemetry(
            webExtensionTelemetryEventNames.WEB_EXTENSION_NPS_WEBVIEW_FAILED_TO_INITIALIZE,
            this.initializeWebView.name,
            (error as Error)?.message
        );
        this._webviewPanel.dispose();
    }

    private async submitFeedback(
        teamName: string,
        surveyName: string,
        userId: string,
        feedback: string
    ) {
        try {
            const npsSurveyHeaders: HeadersInit = NPSService.getCesHeader(
                WebExtensionContext.npsAccessToken
            );
            const npsSurveyEndpoint = NPSService.getNpsSurveyEndpoint();
            const requestUrl = `${npsSurveyEndpoint}/api/v1/${teamName}/Surveys/${surveyName}/Feedbacks?userId=${userId}`;

            const requestSentAtTime = new Date().getTime();
            const response =
                await WebExtensionContext.concurrencyHandler.handleRequest(
                    requestUrl,
                    {
                        method: "POST",
                        headers: npsSurveyHeaders,
                        body: JSON.stringify(feedback),
                    }
                );

            if (!response.ok) {
                WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                    requestUrl,
                    "NPS-Survey",
                    "POST",
                    new Date().getTime() - requestSentAtTime,
                    this.submitFeedback.name,
                    response.statusText,
                );

                throw new Error(JSON.stringify(response));
            }

            const data = await response.json();

            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                "NPS-Survey",
                "POST",
                new Date().getTime() - requestSentAtTime,
                this.submitFeedback.name
            );

            return data.feedbackId;
        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_NPS_SUBMIT_FEEDBACK_FAILED,
                this.submitFeedback.name,
                (error as Error)?.message
            );

            throw error;
        }
    }

    private async _getHtml(): Promise<string> {
        try {
            const surveyLocation = vscode.Uri.joinPath(
                this.extensionUri,
                "dist",
                "Nps-Survey-SDK",
                "survey.lib.umd.v1.0.10.min.js"
            );
            const surveyUrl = new URL(surveyLocation.toString());
            const surveyScript =
                await WebExtensionContext.fetchLocalScriptContent(surveyUrl);

            const tid = WebExtensionContext.urlParametersMap?.get(
                queryParameters.TENANT_ID
            );
            const userId = WebExtensionContext.userId;

            return `
                <!DOCTYPE html>
                <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Microsoft wants your feedback</title>
                        <script>${surveyScript}</script>
                    </head>
                    <body>
                        <survey-sdk id="mySurvey"></survey-sdk>
                    </body>
                    <script>
                        document.addEventListener("DOMContentLoaded", function () {
                            const config = {
                                teamName: "${SurveyConstants.TEAM_NAME}",
                                surveyName: "${SurveyConstants.SURVEY_NAME}",
                                userId: "${userId}",
                                tenantId: "${tid}",
                                locale: 'en',
                                width: 520,
                                uiType: survey.UiType.Modal,
                                template: survey.Template.NPS,
                                environment: survey.Environment.INT,
                                region: survey.Region.World,
                                accessToken: { getAccessToken: () => "${WebExtensionContext.npsAccessToken}" },
                                callbackFunctions: {
                                    ${this.submitFeedback}
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
                webExtensionTelemetryEventNames.WEB_EXTENSION_RENDER_NPS_FAILED,
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
                    vscode.Uri.joinPath(extensionUri, "dist", "Nps-Survey-SDK"),
                ],
            }
        );
        return new NPSWebView(extensionUri, webview);
    }
}
