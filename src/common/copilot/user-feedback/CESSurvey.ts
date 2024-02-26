/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { npsAuthentication } from "../../../web/client/common/authenticationProvider";
import { SurveyConstants } from "../../../web/client/common/constants";
import fetch from "node-fetch";
import { getNonce } from "../../Utils";
import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { CopilotUserFeedbackFailureEvent, CopilotUserFeedbackSuccessEvent } from "../telemetry/telemetryConstants";
import { sendTelemetryEvent } from "../telemetry/copilotTelemetry";
import { IFeedbackData } from "../model";
import { EUROPE_GEO, UK_GEO } from "../constants";

let feedbackPanel: vscode.WebviewPanel | undefined;


export async function CESUserFeedback(context: vscode.ExtensionContext, sessionId: string, userID: string, thumbType: string, telemetry: ITelemetry, geoName: string,  messageScenario: string, tenantId?: string) {

    if (feedbackPanel) {
        feedbackPanel.dispose();
    }

    feedbackPanel = createFeedbackPanel(context);

    feedbackPanel.webview.postMessage({ type: "thumbType", value: thumbType });

    const { feedbackCssUri, feedbackJsUri } = getWebviewURIs(context, feedbackPanel);

    const nonce = getNonce();
    const webview = feedbackPanel.webview
    feedbackPanel.webview.html = getWebviewContent(feedbackCssUri, feedbackJsUri, nonce, webview);

    const feedbackData = initializeFeedbackData(sessionId, vscode.env.uiKind === vscode.UIKind.Web, geoName, messageScenario, tenantId);

    const apiToken: string = await npsAuthentication(SurveyConstants.AUTHORIZATION_ENDPOINT);

    const endpointUrl = useEUEndpoint(geoName) ? `https://europe.ces.microsoftcloud.com/api/v1/portalsdesigner/Surveys/powerpageschatgpt/Feedbacks?userId=${userID}` :
        `https://world.ces.microsoftcloud.com/api/v1/portalsdesigner/Surveys/powerpageschatgpt/Feedbacks?userId=${userID}`;

    feedbackPanel.webview.onDidReceiveMessage(
        async message => {
            switch (message.command) {
                case 'feedback':
                    await handleFeedbackSubmission(message.text, endpointUrl, apiToken, feedbackData, telemetry, thumbType, sessionId);
                    feedbackPanel?.dispose();
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

function createFeedbackPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
    const feedbackPanel = vscode.window.createWebviewPanel(
        "CESUserFeedback",
        "Feedback",
        vscode.ViewColumn.Seven,
        {
            enableScripts: true,
        }
    );

    context.subscriptions.push(feedbackPanel);

    return feedbackPanel;
}

function getWebviewURIs(context: vscode.ExtensionContext, feedbackPanel: vscode.WebviewPanel): { feedbackCssUri: vscode.Uri, feedbackJsUri: vscode.Uri } {
    const feedbackCssPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'copilot', "user-feedback", "feedback.css");
    const feedbackCssUri = feedbackPanel.webview.asWebviewUri(feedbackCssPath);

    const feedbackJsPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'copilot', "user-feedback", "feedback.js");
    const feedbackJsUri = feedbackPanel.webview.asWebviewUri(feedbackJsPath);

    return { feedbackCssUri, feedbackJsUri };
}

function initializeFeedbackData(sessionId: string, isWebExtension: boolean, geoName: string, messageScenario: string,  tenantId?: string): IFeedbackData {
    const feedbackData: IFeedbackData = {
        TenantId: tenantId ? tenantId : '',
        Geo: geoName,
        IsDismissed: false,
        ProductContext: [
            {
                key: 'sessionId',
                value: sessionId
            },
            {
                key: 'scenario',
                value: 'ProDevCopilot'
            },
            {
                key: 'subScenario',
                value: messageScenario
            }
        ],
        Feedbacks: [
            {
                key: 'comment',
                value: ''
            }
        ]
    };

    return feedbackData;
}

async function handleFeedbackSubmission(text: string, endpointUrl: string, apiToken: string, feedbackData: IFeedbackData, telemetry: ITelemetry, thumbType: string, sessionID: string) {
    feedbackData.Feedbacks[0].value = thumbType + " - " + text;
    try {
        const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + apiToken,
            },
            body: JSON.stringify(feedbackData)
        });

        if (response.ok) {
            // Feedback sent successfully
            const responseJson = await response.json();
            const feedbackId = responseJson.FeedbackId;
            sendTelemetryEvent(telemetry, { eventName: CopilotUserFeedbackSuccessEvent, feedbackType: thumbType, FeedbackId: feedbackId, copilotSessionId: sessionID });
        } else {
            // Error sending feedback
            const feedBackError = new Error(response.statusText);
            sendTelemetryEvent(telemetry, { eventName: CopilotUserFeedbackFailureEvent, feedbackType: thumbType, copilotSessionId: sessionID, error: feedBackError });
        }
    } catch (error) {
        // Network error or other exception
        sendTelemetryEvent(telemetry, { eventName: CopilotUserFeedbackFailureEvent, feedbackType: thumbType, copilotSessionId: sessionID, error: error as Error });
    }
}

function getWebviewContent(feedbackCssUri: vscode.Uri, feedbackJsUri: vscode.Uri, nonce: string, webview: vscode.Webview) {

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${feedbackCssUri}" rel="stylesheet">
        </link>
        <title>Feedback</title>
    </head>
    <body>
    <form id="feedbackForm">
    <label for="feedbackText" class="form-label" id="form-label"> Tell us more.</label>
    <br/>
    <textarea id="feedbackText" name="feedbackText" rows="5" required></textarea>
    <br/>
    <p class="privacy-statement">Try and be as specific as possible. Your feedback will be used to improve Copilot. <a href="https://privacy.microsoft.com/en-US/data-privacy-notice"> View privacy details </a> </p>
    <button type="submit" class="submit-feedback">Submit</button>
  </form>
  <script type="module" nonce="${nonce}" src="${feedbackJsUri}"></script>
  </body>
    </html>`;
}

function useEUEndpoint(geoName: string): boolean {
    return geoName === EUROPE_GEO || geoName === UK_GEO;
}

