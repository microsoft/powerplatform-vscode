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

// let azureClient;
// let myContainer;
// let map;
// let audience;
let initial = false;

class AzureFluidClient {
    static _clientInstance;
    static _container;
    static _audience;
    static _userSharedMap;

    static getInstance(config) {
        if (!this._clientInstance) {
            const afrClientProps = {
                connection: {
                    type: "remote",
                    tenantId: config.swptenantId,
                    tokenProvider: new DataverseTokenProvider(
                        config.swpAccessToken,
                        () => this.fetchAccessToken()
                    ),
                    endpoint: config.discoveryendpoint,
                },
            };

            AzureFluidClient._clientInstance = new AzureClient(afrClientProps);
        }
        return this._clientInstance;
    }

    static async fetchContainerAndService(config, swpId) {
        console.log("VSCODE WORKER  Inside fetchContainerAndService");
        console.log(
            "VSCODE WORKER details",
            this._container,
            this.audience?.connectionState
        );
        if (
            !this._container &&
            this._container?.connectionState !== ConnectionState.Connected
        ) {
            const azureClient = this.getInstance(config);
            console.log("VSCODE WORKER  azureClient", azureClient);
            const { container, services } = await azureClient.getContainer(
                swpId,
                containerSchema
            );
            console.log("VSCODE WORKER  container", container);
            console.log("VSCODE WORKER  container", container?.connectionState);
            console.log("VSCODE WORKER  services", services.audience);
            console.log(
                "VSCODE WORKER  users",
                container.initialObjects.sharedState
            );
            if (container.connectionState !== ConnectionState.Connected) {
                await new Promise((resolve) => {
                    container.once("connected", () => {
                        resolve();
                    });
                });
            }
            this._container = container;
            this._audience = services.audience;
            this._userSharedMap = container.initialObjects.sharedState;
        }
        return {
            container: this._container,
            audience: this._audience,
            map: this._userSharedMap,
        };
    }
}

async function loadContainer(config, id, line, column, swpId, file) {
    console.log("VSCODE WORKER Inside loadContainer with ", id, swpId);
    console.log("VSCODE WORKER Inside loadContainer with ", config, file);
    console.log(`VSCODE WORKER Line: ${line}`);
    console.log(`VSCODE WORKER Column: ${column}`);

    console.log("VSCODE WORKER containerSchema creates");

    try {
        console.log(`VSCODE WORKER  Retrieving container`);

        // if (myContainer === undefined) {
        // const { container, services } = await azureClient.getContainer(
        //     swpId,
        //     containerSchema
        // );

        const { container, audience, map } =
            await AzureFluidClient.fetchContainerAndService(config, swpId);
        // const myContainer = container;
        // const audience = services.audience;
        // }
        console.log("VSCODE WORKER  container", container);
        console.log("VSCODE WORKER  audience", audience);
        console.log(
            "VSCODE WORKER  container status",
            container.connectionState
        );

        // if (myContainer.connectionState !== ConnectionState.Connected) {
        //     await new Promise((resolve) => {
        //         myContainer.once("connected", () => {
        //             resolve();
        //         });
        //     });
        // }
        // // if (map === undefined) {
        // const map = myContainer.initialObjects.sharedState;
        // // }
        const existingMembers = audience.getMembers();
        //  console.log("VSCODE WORKER  active users", existingMembers);
        const myself = audience.getMyself();
        //  console.log("VSCODE WORKER  myself", myself);

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
        //  console.log("VSCODE WORKER  all memebers", allMembers);
        audience.on("membersChanged", (e) => {
            self.postMessage({
                type: "members-changed",
                totalUsers: existingMembers.size,
            });
        });
        audience.on("memberAdded", (clientId, member) => {
            console.log("VSCODE WORKER  NEW MEMBER JOINED", clientId, member);

            // if (!existingMembers.get(member.userId)) {
            //     self.postMessage({
            //         type: "member-removed",
            //         removedUserId: member.userId,
            //     });
            // }
        });

        audience.on("memberRemoved", (clientId, member) => {
            console.log(
                "VSCODE WORKER  EXISTING MEMBER LEFT",
                clientId,
                member
            );

            if (!existingMembers.get(member.userId)) {
                self.postMessage({
                    type: "member-removed",
                    userId: member.userId,
                });
            }
        });
        console.log("VSCODE WORKER  audience members", audience.getMembers());

        if (!initial) {
            existingMembers.forEach(async (value, key) => {
                const otherUser = map.get(key);
                console.log("VSCODE WORKER  in intial other user", otherUser);
                self.postMessage({
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
            console.log("VSCODE WORKER  event counter", eventCounter);
            console.log("VSCODE WORKER  changes", local, changed);

            console.log(`VSCODE WORKER  CHANGED BY USER ${map.get(USER_ID)}`);
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
        console.log(`VSCODE WORKER  Error retrieving container: ${error}`);
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
        // if (azureClient === undefined) {
        //     const afrClientProps = {
        //         connection: {
        //             type: "remote",
        //             tenantId: message.afrConfig.swptenantId,
        //             tokenProvider: new DataverseTokenProvider(
        //                 message.afrConfig.swpAccessToken,
        //                 () => this.fetchAccessToken()
        //             ),
        //             endpoint: message.afrConfig.discoveryendpoint,
        //         },
        //     };
        //     azureClient = new AzureClient(afrClientProps);
        // }

        await loadContainer(
            //vscode,
            // message.username,
            message.afrConfig,
            message.containerId,
            message.lineNumber,
            message.columnNumber,
            message.afrConfig.swpId,
            message.file
        );
    });
}

runFluidApp();
