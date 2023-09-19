/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable no-undef */

(function script() {
    const vscode = acquireVsCodeApi();

    const checkbox = document.getElementById('checkbox');
    const tryCopilotButton = document.getElementById('try-button');
    const learnMoreLink = document.getElementById('walkthroughLink');

    checkbox.addEventListener('change', (event) => {
        // Handle the checkbox change event
        if (event.target) {
            const checked = event.target.checked;
            if(checked) {
                vscode.postMessage({command:'checked'})
            } else {
                vscode.postMessage({command:'unchecked'})
            }
        }
    });

    tryCopilotButton.addEventListener('click', () => {
        vscode.postMessage({command:'tryCopilot'})
    });

    learnMoreLink.addEventListener('click', () => {
        vscode.postMessage({command:'learnMore'})
    });

})();
