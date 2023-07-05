/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { npsAuthentication } from "../../../web/client/common/authenticationProvider";
import { SurveyConstants } from "../../../web/client/common/constants";
import fetch from "node-fetch";
import { getNonce } from "../Utils";


export async function CESUserFeedback(context: vscode.ExtensionContext, sessionId: string, userID:string, thumbType:string) { // TODO: Add scenerio

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
    //const apitoken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyIsImtpZCI6Ii1LSTNROW5OUjdiUm9meG1lWm9YcWJIWkdldyJ9.eyJhdWQiOiJodHRwczovL21pY3Jvc29mdC5vbm1pY3Jvc29mdC5jb20vY2Vzc3VydmV5IiwiaXNzIjoiaHR0cHM6Ly9zdHMud2luZG93cy5uZXQvNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3LyIsImlhdCI6MTY4Nzc3ODgyNiwibmJmIjoxNjg3Nzc4ODI2LCJleHAiOjE2ODc3ODQyMjYsImFjciI6IjEiLCJhaW8iOiJBWVFBZS84VEFBQUFjUzBHR0ZIby81ajVGNGNJc1FMWE5OQk5Xc1l6aW9yMEo3OW9PbDJEZlMwZTU2RmR4dlBQV2lUc3VudVNSK2xUcVc4NDFxTndoQm1HSFNJVlkxWXdpdTg5bXVNZXpDenVzSXF2RlJYblpZS2swOUpwSU55am1hRjdYbmp5TktlYzVBaFlHSk45dnZuSjlabFdrdHEyMU8vcDBUQ0ZoS1RJTDQ1SDBBejJtRjA9IiwiYW1yIjpbImZpZG8iLCJyc2EiLCJtZmEiXSwiYXBwaWQiOiJmOWE1YWMxMS1jYWIzLTQ1ZjAtOWQwZi04MzQ2M2JhMmUzNGMiLCJhcHBpZGFjciI6IjAiLCJkZXZpY2VpZCI6ImUwZmE5ZWNiLTBjY2EtNGEwMC05NjY0LTAyN2ExZDZmMjAwOCIsImZhbWlseV9uYW1lIjoiSm9zaGkiLCJnaXZlbl9uYW1lIjoiQW1pdCIsImlwYWRkciI6IjI0MDQ6ZjgwMTo4MDI4OjE6ZDVkYTo1MDI3OjFjNjI6M2FmMiIsIm5hbWUiOiJBbWl0IEpvc2hpIiwib2lkIjoiNDk3YTIyNGQtZGVlYy00N2MyLThjMGItZDc2MjVjMmZlY2RlIiwib25wcmVtX3NpZCI6IlMtMS01LTIxLTIxMjc1MjExODQtMTYwNDAxMjkyMC0xODg3OTI3NTI3LTU4ODI1MzIwIiwicHVpZCI6IjEwMDMyMDAyMEIxM0MwMUEiLCJyaCI6IjAuQVJvQXY0ajVjdkdHcjBHUnF5MTgwQkhiUi1HNXJvX0tQTmxQc08xamZmUmxzOG9hQU93LiIsInNjcCI6InVzZXIiLCJzdWIiOiJySHdIOHRoQndubmpxRElTNGxkMzNXVkQyRV81MU5GX1AtX0ExLXAtYWN3IiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidW5pcXVlX25hbWUiOiJhbWl0am9zaGlAbWljcm9zb2Z0LmNvbSIsInVwbiI6ImFtaXRqb3NoaUBtaWNyb3NvZnQuY29tIiwidXRpIjoiMzY2Zk11S05fMEtGdTdKWXcwSnNBQSIsInZlciI6IjEuMCJ9.WH6y0oqmhVTIKxJhI5_wmNkcrr8FYqpkyKGkkbb5L6bMPo6vj3w5_a0ph4pWxWfW-3I5tVb_9awW8M4EIm5oCeY335w6PQ_kqQgXoDAeai02JNSYPK_0aSyVEzdl8zk-pBAy_g46aNtN9qiebLjHHeZzqa4n_A6LaMB-ZF4aTKLsCZlLr0rrjByBdc7D3Rxkah9JscfRDdvYllOb3SVCwnnwg6zzVqHkHUBrSB3bMLqU2s9XkkDPphxPcy4qLrWqguuu5t3cjvPCYlc5iujkSq7LERPjDyCNaRmau2MwRzh-y7pwujugVbb3aZCi35v32PnSLFalRAHyW6fgs_X76g';
    const apiToken: string = await npsAuthentication(SurveyConstants.AUTHORIZATION_ENDPOINT)

    const endpointUrl = `https://world.tip1.ces.microsoftcloud.com/api/v1/portalsdesigner/Surveys/powerpageschatgpt/Feedbacks?userId=${userID}`;
    // Handle messages from the webview
    let responseJson;
    feedbackPanel.webview.onDidReceiveMessage(
        message => {
            switch (message.command) {
                case 'feedback':
                    //vscode.window.showInformationMessage(message.text);
                    console.log(message.text);
                    feedbackData.Feedbacks[0].value = message.text;
                    fetch(endpointUrl, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: 'Bearer ' + apiToken,
                        },
                        body: JSON.stringify(feedbackData)
                      })
                      .then(response => {
                        if (response.ok) {
                          // Feedback sent successfully
                          console.log('Feedback sent');
                          responseJson = response.json().then(data => {
                            console.log(data);
                            });
                            console.log(responseJson);
                        } else {
                          // Error sending feedback
                          console.error('Error sending feedback');
                        }
                      })
                      .catch(error => {
                        // Network error or other exception
                        console.error('Error sending feedback:', error);
                      });
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
