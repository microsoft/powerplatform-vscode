/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const CONTAINER_ID = "containerId";
const LINE_NUMBER_KEY = "lineNumber";
const COLUMN_NUMBER_KEY = "columnNumber";

// eslint-disable-next-line no-undef
self.window = self;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const tinyliciousClient = require("@fluidframework/tinylicious-client");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fluid = require("fluid-framework");

async function loadContainer(
    // vscode,
    // tinyliciousClient,
    // fluid,
    id,
    line,
    column
) {
    console.log("VSCODE WORKER Inside loadContainer with ", id);
    console.log(`VSCODE WORKER Line: ${line}`);
    console.log(`VSCODE WORKER Column: ${column}`);

    const config = {
        connection: { port: 7070, domain: "http://localhost" },
    };

    const clientProps = {
        connection: config,
    };
    let containerId;

    console.log("VSCODE WORKER clientProps: ", clientProps);
    const { TinyliciousClient } = tinyliciousClient;

    console.log("VSCODE WORKER loaded the tiny client object");
    const tinyClient = new TinyliciousClient(clientProps);

    console.log("VSCODE WORKER tiny client created");

    const { SharedMap } = fluid;

    const containerSchema = {
        initialObjects: { position: SharedMap },
    };

    console.log("VSCODE WORKER containerSchema creates");

    try {
        console.log(`Retrieving container`);
        const { container } = await tinyClient.getContainer(
            id,
            containerSchema
        );
        const map = container.initialObjects.position;

        line = map.get(LINE_NUMBER_KEY);
        column = map.get(COLUMN_NUMBER_KEY);
        containerId = map.get(CONTAINER_ID);
    } catch (error) {
        console.log(`Error retrieving container: ${error}`);
        console.log(`Creating new container`);

        const { container } = await tinyClient.createContainer(containerSchema);
        const map = container.initialObjects.position;
        map.set(LINE_NUMBER_KEY, line);
        map.set(COLUMN_NUMBER_KEY, column);
        const containerId = await container.attach();
        map.set(CONTAINER_ID, containerId);
    }

    console.log("VSCODE WORKER Sending message back");

    // Send a message to the extension
    // eslint-disable-next-line no-undef
    await self.postMessage({
        containerId: containerId,
        lineNumber: line,
        columnNumber: column,
    });
    console.log(
        "VSCODE WORKER New position updated to new values",
        containerId,
        line,
        column
    );
}

function runFluidApp() {
    console.log(`VSCODE WORKER  Running script`);

    // eslint-disable-next-line no-undef
    // const vscode = acquireVsCodeApi();
    console.log("VSCODE WORKER init require module");

    // Listen for messages from the extension
    // eslint-disable-next-line no-undef
    self.addEventListener("message", async (event) => {
        const message = event.data;

        console.log(
            `VSCODE WORKER Received greeting from extension: ${JSON.stringify(
                message
            )}`
        );

        await loadContainer(
            //vscode,
            message.containerId,
            message.lineNumber,
            message.columnNumber
        );
    });
}

runFluidApp();
