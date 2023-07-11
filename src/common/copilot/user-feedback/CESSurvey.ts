/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { npsAuthentication } from "../../../web/client/common/authenticationProvider";
import { SurveyConstants } from "../../../web/client/common/constants";
import fetch from "node-fetch";
import { getNonce } from "../Utils";
import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { UserFeedbackFailureEvent, UserFeedbackSuccessEvent} from "../telemetry/telemetryConstants";
import { sendTelemetryEvent } from "../telemetry/copilotTelemetry";


export async function CESUserFeedback(context: vscode.ExtensionContext, sessionId: string, userID: string, thumbType: string, telemetry: ITelemetry) {

  const feedbackPanel = vscode.window.createWebviewPanel(
    "CESUserFeedback",
    "Feedback",
    vscode.ViewColumn.Seven,
    {
      enableScripts: true,
    }
  );

  context.subscriptions.push(feedbackPanel);

  feedbackPanel.webview.postMessage({ type: "thumbType", value: thumbType });
  const feedbackCssPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'copilot', "user-feedback", "feedback.css");
  const feedbackCssUri = feedbackPanel.webview.asWebviewUri(feedbackCssPath);

  const feedbackJsPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'copilot', "user-feedback", "feedback.js");
  const feedbackJsUri = feedbackPanel.webview.asWebviewUri(feedbackJsPath);

  const nonce = getNonce();

  feedbackPanel.webview.html = getWebviewContent(feedbackCssUri, feedbackJsUri, nonce);

  const feedbackData = {
    IsDismissed: false,
    ProductContext: [
      {
        key: 'sessionId',
        value: sessionId
      },
      {
        key: 'scenario',
        value: 'ProdDevCopilot'
      }
    ],
    Feedbacks: [
      {
        key: 'comment',
        value: ''
      }
    ]
  };

  const apiToken: string = await npsAuthentication(SurveyConstants.AUTHORIZATION_ENDPOINT)

  const endpointUrl = `https://world.tip1.ces.microsoftcloud.com/api/v1/portalsdesigner/Surveys/powerpageschatgpt/Feedbacks?userId=${userID}`;
  // Handle messages from the webview

  feedbackPanel.webview.onDidReceiveMessage(
    async message => {
      switch (message.command) {
        case 'feedback':
          feedbackData.Feedbacks[0].value = message.text;
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
              sendTelemetryEvent(telemetry, { eventName: UserFeedbackSuccessEvent, FeedbackId: feedbackId });
            } else {
              // Error sending feedback
              sendTelemetryEvent(telemetry, { eventName: UserFeedbackFailureEvent, error: response.statusText });
            }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (error: any) {
            // Network error or other exception
            sendTelemetryEvent(telemetry, { eventName: UserFeedbackFailureEvent, exception: error.message });
          }

          feedbackPanel.dispose();
      }
      return;

    },
    undefined,
    context.subscriptions
  );

}

function getWebviewContent(feedbackCssUri: vscode.Uri, feedbackJsUri: vscode.Uri, nonce: string) {

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${feedbackCssUri}" rel="stylesheet">
        </link>
        <title>Cat Coding</title>
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
