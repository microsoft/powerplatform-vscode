/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { loadContainer } from "./utilities/copresenceUtil.ts";

(function () {
    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();

    console.log(`Running script`);

    // Listen for messages from the extension
    // eslint-disable-next-line no-undef
    window.addEventListener("message", async (event) => {
        const message = event.data;

        console.log(`Received greeting from extension: ${message}`);

        await loadContainer(
            message.containerId,
            message.lineNumber,
            message.columnNumber
        );

        console.log("Sending message back");

        // Send a message to the extension
        vscode.postMessage({
            containerId: message.containerId,
            lineNumber: message.lineNumber,
            columnNumber: message.lineNumber,
        });
    });
})();
