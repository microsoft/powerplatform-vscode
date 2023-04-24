/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const CONTAINER_ID = "containerId";
const LINE_NUMBER_KEY = "lineNumber";
const COLUMN_NUMBER_KEY = "columnNumber";

function loadContainer(vscode, id, line, column) {
    console.log("VSCODE WEBVIEW Inside loadContainer with ", id);
    console.log(`VSCODE WEBVIEW Line: ${line}`);
    console.log(`VSCODE WEBVIEW Column: ${column}`);

    const config = {
        connection: { port: 7070, domain: "http://localhost" },
    };

    const clientProps = {
        connection: config,
    };

    console.log("VSCODE WEBVIEW clientProps: ", clientProps);
    require.config({
        paths: {
            "@fluidframework/tinylicious-client":
                "http://localhost:5000//node_modules/tinylicious/dist/index.js",
            "fluid-framework":
                "http://localhost:5000//node_modules/fluid-framework/dist/index.js",
        },
    });

    require([
        "@fluidframework/tinylicious-client",
        "fluid-framework",
    ], async function (TinyliciousClient, fluidFramework) {
        const tinyClient = new TinyliciousClient(clientProps);

        console.log("VSCODE WEBVIEW tiny client created");

        const { SharedMap } = fluidFramework;

        const containerSchema = {
            initialObjects: { position: SharedMap },
        };

        console.log("VSCODE WEBVIEW shared map loaded");

        try {
            const { container } = await tinyClient.getContainer(
                id,
                containerSchema
            );
            const map = container.initialObjects.position;
            const activeEditor = vscode.window.activeTextEditor;

            // Update active editor cursor location based on the container parameters
            if (activeEditor) {
                const newPosition = new vscode.Position(
                    map.get(LINE_NUMBER_KEY),
                    map.get(COLUMN_NUMBER_KEY)
                ); // line 3, column 1
                const newSelection = new vscode.Selection(
                    newPosition,
                    newPosition
                );
                activeEditor.selection = newSelection;
                console.log(
                    "VSCODE WEBVIEW New position updated to existing values",
                    line,
                    column
                );
            }
        } catch (error) {
            console.error(`Error retrieving container: ${error}`);
            console.error(`Creating new container`);

            const { container } = await tinyClient.createContainer(
                containerSchema
            );
            const map = container.initialObjects.position;
            map.set(LINE_NUMBER_KEY, line);
            map.set(COLUMN_NUMBER_KEY, column);
            const containerId = await container.attach();
            map.set(CONTAINER_ID, containerId);
            console.log(
                "VSCODE WEBVIEW New position updated to new values",
                containerId,
                line,
                column
            );
        }
    });
}

function runFluidApp() {
    // eslint-disable-next-line no-undef
    const vscode = acquireVsCodeApi();

    console.log(`VSCODE WEBVIEW  Running script`);

    // Listen for messages from the extension
    // eslint-disable-next-line no-undef
    window.addEventListener("message", async (event) => {
        const message = event.data;

        console.log(
            `VSCODE WEBVIEW Received greeting from extension: ${JSON.stringify(
                message
            )}`
        );

        loadContainer(
            vscode,
            message.containerId,
            message.lineNumber,
            message.columnNumber
        );

        console.log("VSCODE WEBVIEW Sending message back");

        // Send a message to the extension
        await vscode.postMessage({
            containerId: message.containerId,
            lineNumber: message.lineNumber,
            columnNumber: message.lineNumber,
        });
    });
}

runFluidApp();
