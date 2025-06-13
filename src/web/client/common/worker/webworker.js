/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// eslint-disable-next-line no-undef
self.window = self;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fluid = require("fluid-framework");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { AzureClient } = require("@fluidframework/azure-client");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DataverseTokenProvider = require("../DataverseTokenProvider");

const { SharedMap, ConnectionState } = fluid;

const objectTypes = [
    SharedMap
]

const containerSchema = {
    dynamicObjectTypes: objectTypes,
    initialObjects: {
        sharedState: SharedMap,
    },
};

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

    static async fetchContainerAndService(config, id) {
        if (
            this._container?.connectionState !== ConnectionState.Connected
        ) {
            const azureClient = this.getInstance(config);
            const { container, services } = await azureClient.getContainer(
                id,
                containerSchema
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

let initialLoad = true;

async function loadContainer(config, swpId, entityInfo) {
    try {
        self.postMessage({
            type: "telemetry-info",
            methodName: loadContainer.name,
            eventName: "webExtensionWebWorkerLoadContainerStart",
        });

        const { container, audience, map } =
            await AzureFluidClient.fetchContainerAndService(config, swpId);
        const existingMembers = audience.getMembers();
        const myself = audience.getMyself();
        const selectionSharedMap = await (await map.get('selection')).get();

        const getUserIdByConnectionId = (targetConnectionId) => {
            const members = audience.getMembers();
            for (const [userId, member] of members.entries()) {
                const connections = member.connections;
                if (connections.some((connection) => connection.id === targetConnectionId)) {
                    return { userId: userId, userName: member.userName, aadObjectId: member.additionalDetails.AadObjectId };
                }
            }

            throw new Error("Web Extension WebWorker GetUserIdByConnectionId Failed");
        };

        if (audience && myself) {
            const myConnectionId = audience['container'].clientId;
            const entityIdObj = new Array(entityInfo.rootWebPageId);
            selectionSharedMap.set(myConnectionId, entityIdObj);

            if (initialLoad) {
                initialLoad = false;
                audience.getMembers().forEach(async (member) => {
                    try {
                        const userConnections = member.connections;

                        const userConnectionData = [];

                        const connectionIdInContainer = await map
                            .get("selection")
                            .get();

                        userConnections.forEach((connection) => {
                            userConnectionData.push({ connectionId: connection.id, entityId: connectionIdInContainer.get(connection.id) });
                        });

                        // aadObjectId is the unique identifier for a user
                        self.postMessage({
                            type: "client-data",
                            userId: member.additionalDetails.AadObjectId,
                            userName: member.userName,
                            containerId: swpId,
                            connectionData: userConnectionData,
                            currentConnectionId: myConnectionId,
                        });
                    } catch (error) {
                        self.postMessage({
                            type: "telemetry-error",
                            methodName: "webWorker initialLoad",
                            eventName: "webExtensionContainerInitialPopulateFailed",
                            errorMessage: error?.message,
                            error: error,
                        });
                    }
                });

                self.postMessage({
                    type: "telemetry-info",
                    methodName: "webWorker initialLoad",
                    eventName: "webExtensionContainerInitialPopulateSuccess",
                });
            }
        }

        audience.on("memberRemoved", (clientId, member) => {
            if (!existingMembers.get(member.additionalDetails.AadObjectId)) {
                self.postMessage({
                    type: "member-removed",
                    userId: member.additionalDetails.AadObjectId,
                    entityInfo: entityInfo,
                    removeConnectionData: { connectionId: clientId, entityId: entityInfo.rootWebPageId },
                });
                self.postMessage({
                    type: "telemetry-info",
                    methodName: "webWorker memberRemoved",
                    eventName: "webExtensionWebWorkerMemberRemovedSuccess",
                    userId: member.additionalDetails.AadObjectId,
                });
            } else {
                self.postMessage({
                    type: "telemetry-error",
                    methodName: "webWorker memberRemoved",
                    eventName: "webExtensionWebWorkerMemberRemovedFailed",
                    errorMessage: "Web Extension WebWorker Member Removed Failed",
                });
            }
        });

        selectionSharedMap.on("valueChanged", async (changed, local) => {
            try {
                const user = getUserIdByConnectionId(changed.key);

                const userConnections = audience
                    .getMembers()
                    .get(user.userId).connections;

                const userConnectionData = [];

                const connectionIdInContainer = await map
                    .get("selection")
                    .get();

                userConnections.forEach((connection) => {
                    userConnectionData.push({ connectionId: connection.id, entityId: connectionIdInContainer.get(connection.id) });
                });

                // aadObjectId is the unique identifier for a user
                self.postMessage({
                    type: "client-data",
                    userId: user.aadObjectId,
                    userName: user.userName,
                    containerId: swpId,
                    connectionData: userConnectionData,
                });

                self.postMessage({
                    type: "telemetry-info",
                    methodName: "webWorker valueChanged",
                    eventName: "webExtensionWebWorkerGetUserIdByConnectionIdSuccess",
                    userId: user.aadObjectId,
                });
            } catch (error) {
                self.postMessage({
                    type: "telemetry-error",
                    methodName: "webWorker valueChanged",
                    eventName: "webExtensionWebWorkerGetUserIdByConnectionIdFailed",
                    errorMessage: error?.message,
                    error: error,
                });
            }
        });
    } catch (error) {
        self.postMessage({
            type: "telemetry-error",
            eventName: "webExtensionWebWorkerLoadContainerFailed",
            methodName: loadContainer.name,
            errorMessage: error?.message,
            error: error,
        });
    }
}

function runFluidApp() {
    // Listen for messages from the extension
    // eslint-disable-next-line no-undef
    self.addEventListener("message", async (event) => {
        const message = event.data;

        await loadContainer(
            message.afrConfig,
            message.afrConfig.swpId,
            message.entityInfo
        );
    });
}

runFluidApp();
