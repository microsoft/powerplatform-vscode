/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const LINE_NUMBER_KEY = "lineNumber";
const COLUMN_NUMBER_KEY = "columnNumber";
const FILE_NAME = "fileName";
const FILE_PATH = "filePath";
const USER_ID = "userId";

let eventCounter = 0;
// eslint-disable-next-line no-undef
self.window = self;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fluid = require("fluid-framework");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AzureClient } = require("@fluidframework/azure-client");
// eslint-disable-next-line @typescript-eslint/no-var-requires
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
let initial = false;

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
        console.log("container", myContainer);
        console.log("audienc", audience);

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
        const existingMembers = audience.getMembers();
        console.log("active users", existingMembers);
        const myself = audience.getMyself();

        const currentUser = {
            lineNumber: line,
            columnNumber: column,
            containerId: id,
            fileName: file.fileName,
            filePath: file.filePath,
            userName: myself.userName,
        };

        map.set(myself.userId, currentUser);
        // const allMembers = audience.getMembers();
        // console.log("all memebers", allMembers);
        audience.on("membersChanged", (e) => {
            self.postMessage({
                type: "members-changed",
                totalUsers: existingMembers.size,
            });
        });

        audience.on("memberRemoved", (clientId, member) => {
            console.log("EXISTING MEMBER LEFT", clientId);

            if (!existingMembers.get(member.userId)) {
                self.postMessage({
                    type: "member-removed",
                    removedUserId: member.userId,
                });
            }
        });
        console.log("audience members", audience.getMembers());

        if (!initial) {
            existingMembers.forEach(async (value, key) => {
                const otherUser = map.get(key);
                console.log("in intial other user", otherUser);
                await self.postMessage({
                    type: "client-data",
                    totalUsers: existingMembers.size,
                    userName: otherUser.userName,
                    userId: key,
                    containerId: swpId,
                    lineNumber: otherUser.lineNumber,
                    columnNumber: otherUser.columnNumber,
                    fileName: otherUser.fileName,
                    filePath: otherUser.filePath,
                });
            });
            initial = true;
        }

        // map.set(USER, audience.getMyself());

        map.on("valueChanged", async (changed, local) => {
            eventCounter += 1;
            console.log("event counter", eventCounter);
            console.log("changes", local, changed);

            console.log(`CHANGED BY USER ${map.get(USER_ID)}`);
            console.log(
                `IN ${map.get(FILE_NAME)} PATH ${map.get(
                    FILE_PATH
                )} at postion ${map.get(LINE_NUMBER_KEY)}, ${map.get(
                    COLUMN_NUMBER_KEY
                )}`
            );
            if (!local) {
                const otherUser = map.get(changed.key);
                // eslint-disable-next-line no-undef
                await self.postMessage({
                    type: "client-data",
                    userId: changed.key,
                    userName: otherUser.userName,
                    containerId: swpId,
                    lineNumber: otherUser.lineNumber,
                    columnNumber: otherUser.columnNumber,
                    fileName: otherUser.fileName,
                    filePath: otherUser.filePath,
                });
            }
        });
    } catch (error) {
        console.log(`Error retrieving container: ${error}`);
    }

    console.log("VSCODE WORKER Sending message back");

    // Send a message to the extension
    // eslint-disable-next-line no-undef
    // await self.postMessage({
    //     containerId: swpId,
    //     lineNumber: line,
    //     columnNumber: column,
    // });
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
            // message.username,
            message.containerId,
            message.lineNumber,
            message.columnNumber,
            message.afrConfig.swpId,
            message.file
        );
    });
}

runFluidApp();
