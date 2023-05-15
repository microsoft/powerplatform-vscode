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
// const tinyliciousClient = require("@fluidframework/tinylicious-client");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fluid = require("fluid-framework");
const { AzureClient } = require("@fluidframework/azure-client");
const DataverseTokenProvider = require("./DataverseTokenProvider");

let azureClient;

async function loadContainer(
    // vscode,
    // tinyliciousClient,
    // fluid,
    odataConfig,
    id,
    line,
    column,
    swpId
) {
    console.log("VSCODE WORKER Inside loadContainer with ", id);
    console.log(`VSCODE WORKER Line: ${line}`);
    console.log(`VSCODE WORKER Column: ${column}`);
    const { dataverseOrgUrl, headers, websiteName, websiteId, tenantId } =
        odataConfig;

    // const config = {
    //     connection: { port: 7070, domain: "http://localhost" },
    // };

    // const clientProps = {
    //     connection: config,
    // };
    let containerId;

    // console.log("VSCODE WORKER clientProps: ", clientProps);
    // const { TinyliciousClient } = tinyliciousClient;

    // console.log("VSCODE WORKER loaded the tiny client object");
    // const tinyClient = new TinyliciousClient(clientProps);

    // console.log("VSCODE WORKER tiny client created");

    console.log("VSCODE WORKER containerSchema creates");

    console.log("config", odataConfig);

    try {
        console.log(`Retrieving container`);
        // if (id === undefined) {
        //     throw new Error("Id not defined");
        // }

        const { SharedMap } = fluid;
        const containerSchema = {
            initialObjects: {
                position: SharedMap,
            },
        };
        const { container } = await azureClient.getContainer(
            swpId,
            containerSchema
        );

        // console.log("response in worker", response);

        // const { container } = await tinyClient.getContainer(
        //     id,
        //     containerSchema
        // );
        const map = container.initialObjects.sharedState;
        map.set(LINE_NUMBER_KEY, line);
        map.set(COLUMN_NUMBER_KEY, column);
        map.set(CONTAINER_ID, containerId);

        map.on("valueChanged", async (changed, local) => {
            line = map.get(LINE_NUMBER_KEY);
            column = map.get(COLUMN_NUMBER_KEY);
            containerId = map.get(CONTAINER_ID);
            console.log("Hi changed", line, column, containerId);
            await self.postMessage({
                containerId: swpId,
                lineNumber: line,
                columnNumber: column,
            });
        });

        // console.log("dependancy", dependancy);
    } catch (error) {
        console.log(`Error retrieving container: ${error}`);
        // console.log(`GETTING OR CREATING SHAREDWORKSPACE`);

        // const workspaceResult = await getOrCreateSharedWorkspace(odataConfig);

        // console.log("workspaceresult", workspaceResult);

        // const { SharedMap } = fluid;
        // const containerSchema = {
        //     initialObjects: {
        //         sharedState: SharedMap,
        //     },
        // };
        // const { container } = await azureClient.getContainer(
        //     workspaceResult[0].sharedworkspaceid,
        //     containerSchema
        // );
        // console.log("fetched container", container);
        // console.log(container.attachState);
        // // if (container.attachState !== AttachState.Attached) {
        // //     await container.attach();
        // // }

        // containerId = workspaceResult[0].sharedworkspaceid;

        // const map = container.initialObjects.sharedState;

        // // container.initialObjects = {
        // //     LINE_NUMBER_KEY: line,
        // //     COLUMN_NUMBER_KEY: column,
        // //     userid: "123",
        // // };

        // map.set(LINE_NUMBER_KEY, line);
        // map.set(COLUMN_NUMBER_KEY, column);
        // map.set(CONTAINER_ID, containerId);
        // const { container } = await tinyClient.createContainer(containerSchema);
        // const map = container.initialObjects.position;
        // map.set(LINE_NUMBER_KEY, line);
        // map.set(COLUMN_NUMBER_KEY, column);
        // containerId = await container.attach();
        // map.set(CONTAINER_ID, containerId);
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

        console.log(
            `VSCODE WORKER Received greeting from extension: ${JSON.stringify(
                message
            )}`
        );
        if (azureClient === undefined) {
            console.log(message.afrConfig);
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
            message.odataConfig,
            message.containerId,
            message.lineNumber,
            message.columnNumber,
            message.afrConfig.swpId
        );
    });
}

runFluidApp();
