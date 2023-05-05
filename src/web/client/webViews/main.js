/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// const CONTAINER_ID = "containerId";

// eslint-disable-next-line @typescript-eslint/no-var-requires
// const tinyliciousClient = require("@fluidframework/tinylicious-client");
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const fluid = require("fluid-framework");

// const workerSource = `
// const tinyliciousClient = require("@fluidframework/tinylicious-client");
// const fluid = require("fluid-framework");

// const config = {
//     connection: { port: 7070, domain: "http://localhost" },
// };

// const clientProps = {
//     connection: config,
// };
// const { TinyliciousClient } = tinyliciousClient;
// const tinyClient = new TinyliciousClient(clientProps);
//   const { SharedMap } = fluid;

//    const containerSchema = {
//        initialObjects: { position: SharedMap },
//    };

//    self.addEventListener("message", async function (e) {
//     const message = e.data;
//     if (message.type === "subscribe") {
//         const { container } = await tinyClient.getContainer(
//             message.containerId,
//             containerSchema
//         );
//         const existingMap = container.initialObjects.position;

//         self.postMessage({
//             status: "connected",
//             container: message.containerId,
//             position: existingMap,
//         });
//     } else if (message.type === "create") {
//         const { container } = await tinyClient.createContainer(containerSchema);
//         const createdMap = container.initialObjects.position;
//         createdMap.set(LINE_NUMBER_KEY, message.line);
//         createdMap.set(COLUMN_NUMBER_KEY, message.column);

//         const containerId = await container.attach();
//         createdMap.set("CONTAINER_ID", containerId);

//         // console.log("in craeted map ", message);

//         self.postMessage({
//             status: "client-pos",
//             container: message.containerId,
//             position: createdMap,
//         });
//     }
// });

// `;

// const blob = new Blob([workerSource], { type: "application/javascript" });
// const blobUrl = URL.createObjectURL(blob);
// const worker = new Worker(blobUrl);

// // const Worker = require("./worker.js");
// const window = global.window;

import MyWorker from "worker-loader?inline=fallback!./worker.js";

const worker = new MyWorker();
// console.log(MyWorker);
// const worker = new MyWorker();

async function loadContainer(vscode, id, line, column) {
    console.log("VSCODE WEBVIEW Inside loadContainer with id ", id);
    console.log(`VSCODE WEBVIEW Line: ${line}`);
    console.log(`VSCODE WEBVIEW Column: ${column}`);
    try {
        if (id === "") {
            throw new Error("container id undefined");
        }
        worker.postMessage({ type: "subscribe", id: id });
        worker.onmessage = (event) => {
            // Handle the message from the worker here

            const receivedMessage = event.data;
            console.log("recived msg", receivedMessage);
        };

        // await vscode.postMessage({
        //     type: "client-pos",
        //     containerId: id,
        //     map: map,
        //     lineNumber: line,
        //     columnNumber: column,
        // });

        // const map = container.initialObjects.position;
        // const activeEditor = vscode.window.activeTextEditor;

        // Update active editor cursor location based on the container parameters
        // if (activeEditor) {
        //     const newPosition = new vscode.Position(
        //         map.get(LINE_NUMBER_KEY),
        //         map.get(COLUMN_NUMBER_KEY)
        //     ); // line 3, column 1
        //     const newSelection = new vscode.Selection(newPosition, newPosition);
        //     activeEditor.selection = newSelection;
        //     console.log(
        //         "VSCODE WEBVIEW New position updated to existing values",
        //         line,
        //         column
        //     );
        // }
    } catch (error) {
        console.log(`Error retrieving container: ${error}`);
        console.log("In case of error container id is", id);
        console.log(`Creating new container`);

        worker.postMessage({ type: "create", line, column });
        worker.onmessage = (event) => {
            // Handle the message from the worker here

            const receivedMessage = event.data;
            console.log("recived msg", receivedMessage);
        };

        console.log("VSCODE WEBVIEW Sending message back");

        // Send a message to the extension
        // await vscode.postMessage({
        //     containerId: containerId,
        //     lineNumber: line,
        //     columnNumber: column,
        // });
        // console.log(
        //     "VSCODE WEBVIEW New position updated to new values",
        //     containerId,
        //     line,
        //     column
        // );
    }
}

function runFluidApp() {
    console.log(`VSCODE WEBVIEW  Running script`);

    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();
    console.log("VSCODE WEBVIEW init require module");

    // Listen for messages from the extension
    // eslint-disable-next-line no-undef
    window.addEventListener("message", async (event) => {
        const message = event.data;

        console.log(
            `VSCODE WEBVIEW Received greeting from extension: ${JSON.stringify(
                message
            )}`
        );

        await loadContainer(
            vscode,
            message.containerId,
            message.lineNumber,
            message.columnNumber
        );
    });
}

runFluidApp();
