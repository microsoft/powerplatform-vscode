/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const CONTAINER_ID = "containerId";
const LINE_NUMBER_KEY = "lineNumber";
const COLUMN_NUMBER_KEY = "columnNumber";
const FILE_NAME = "fileName";
const FILE_PATH = "filePath";
const USER_ID = "userId";
const USER_NAME = "userName";

// eslint-disable-next-line no-undef
self.window = self;
const fluid = require("fluid-framework");
const { AzureClient } = require("@fluidframework/azure-client");
const DataverseTokenProvider = require("./DataverseTokenProvider");

const { SharedMap, ConnectionState } = fluid;
const containerSchema = {
    initialObjects: {
        position: SharedMap,
    },
};

let azureClient;
let myContainer;
let map;
let audience;

async function loadContainer(id, line, column, swpId, file) {
    console.log("VSCODE WORKER Inside loadContainer with ", id);
    console.log(`VSCODE WORKER Line: ${line}`);
    console.log(`VSCODE WORKER Column: ${column}`);

    console.log("VSCODE WORKER containerSchema creates");

    try {
        console.log(`Retrieving container`);

        if (myContainer === undefined) {
            const { container, services } = await azureClient.getContainer(
                swpId,
                containerSchema
            );
            myContainer = container;
            audience = services.audience;
        }

        if (myContainer.connectionState !== ConnectionState.Connected) {
            await new Promise((resolve) => {
                myContainer.once("connected", () => {
                    resolve();
                });
            });
        }
        if (map === undefined) {
            map = myContainer.initialObjects.sharedState;
        }
        const myself = audience.getMyself();

        map.set(LINE_NUMBER_KEY, line);
        map.set(COLUMN_NUMBER_KEY, column);
        map.set(CONTAINER_ID, swpId);
        map.set(FILE_NAME, file.fileName);
        map.set(FILE_PATH, file.filePath);
        map.set(USER_ID, myself.userId);
        map.set(USER_NAME, myself.userName);
        // map.set(USER, audience.getMyself());

        map.on("valueChanged", async (changed, local) => {
            console.log("changes", changed);
            let updatedLine = map.get(LINE_NUMBER_KEY);
            let updatedCol = map.get(COLUMN_NUMBER_KEY);

            console.log(`CHANGED BY USER ${map.get(USER_ID)}`);
            console.log(
                `IN ${map.get(FILE_NAME)} PATH ${map.get(
                    FILE_PATH
                )} at postion ${updatedLine}, ${updatedCol}`
            );
            await self.postMessage({
                containerId: swpId,
                lineNumber: updatedLine,
                columnNumber: updatedCol,
                username: map.get(USER_NAME),
            });
        });
    } catch (error) {
        console.log(`Error retrieving container: ${error}`);
    }

    console.log("VSCODE WORKER Sending message back");

    // Send a message to the extension
    // eslint-disable-next-line no-undef
    await self.postMessage({
        containerId: swpId,
        lineNumber: line,
        columnNumber: column,
    });
    console.log(
        "VSCODE WORKER New position updated to new values",
        swpId,
        line,
        column
    );
}

function runFluidApp() {
    console.log(`VSCODE WORKER  Running script`);

    // eslint-disable-next-line no-undef

    console.log("VSCODE WORKER init require module");

    // Listen for messages from the extension
    // eslint-disable-next-line no-undef
    self.addEventListener("message", async (event) => {
        const message = event.data;

        // console.log(
        //     `VSCODE WORKER Received greeting from extension: ${JSON.stringify(
        //         message
        //     )}`
        // );
        if (azureClient === undefined) {
            const afrClientProps = {
                connection: {
                    type: "remote",
                    tenantId: message.afrConfig.swptenantId,
                    tokenProvider: new DataverseTokenProvider(
                        message.afrConfig.swpAccessToken,
                        () => this.fetchAccessToken()
                    ),
                    endpoint: message.afrConfig.discoveryendpoint,
                },
            };
            azureClient = new AzureClient(afrClientProps);
        }

        await loadContainer(
            //vscode,

            message.containerId,
            message.lineNumber,
            message.columnNumber,
            message.afrConfig.swpId,
            message.file
        );
    });
}

runFluidApp();
