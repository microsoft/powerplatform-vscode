/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable no-undef */


(function script() {
    const vscode = acquireVsCodeApi();

    const feedbackForm = document.getElementById('feedbackForm');
    const feedbackLabel = document.getElementById('form-label');

      // Handle messages sent from the extension to the webview
  window.addEventListener("message", (event) => {
    const message = event.data; // The JSON data our extension sent
    switch (message.type) {
        case "thumbType":
            if(message.value === "thumbsUp"){
                feedbackLabel.textContent = "Like something? Tell us more.";
            } else {
                feedbackLabel.textContent = "Dislike something? Tell us more.";
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