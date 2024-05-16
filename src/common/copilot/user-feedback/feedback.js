/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable no-undef */


(function script() {
    const vscode = acquireVsCodeApi();

    vscode.postMessage({ type: "webViewLoaded" });

    let copilotStrings = {};

    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackLabel = document.getElementById('form-label');

      // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    switch (message.type) {
        case "copilotStrings": {
            copilotStrings = message.value; //Localized string values object
            break;
        }
        case "thumbType":
            if(message.value === "thumbsUp"){
                feedbackLabel.textContent = copilotStrings.LIKE_MESSAGE;
            } else {
                feedbackLabel.textContent = copilotStrings.DISLIKE_MESSAGE;
            }
            break;
    }
    });


    feedbackForm.addEventListener('submit', function (event) {
        event.preventDefault(); // Prevent form submission

        // Get the feedback text from the form field
        const feedbackText = document.getElementById('feedbackText').value;
        if (feedbackText.trim() !== '') {
            vscode.postMessage({ command: 'feedback', text: feedbackText });
          }
    });

}());
