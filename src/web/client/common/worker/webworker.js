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

let intital = false;

async function loadContainer(config, swpId, entityInfo) {
    try {
        const { container, audience, map } =
            await AzureFluidClient.fetchContainerAndService(config, swpId);
        const existingMembers = audience.getMembers();
        const myself = audience.getMyself();
        const selectionSharedMap = await (await map.get('selection')).get();

        if (audience && myself) {
            const myConnectionId = audience['container'].clientId;
            if (intital) {
                const entityIdObj = new Array(entityInfo.rootWebPageId);
                selectionSharedMap.set(myConnectionId, entityIdObj);
            } else {
                intital = true;
            }
        }

        audience.on("memberRemoved", (clientId, member) => {
            if (!existingMembers.get(member.additionalDetails.AadObjectId)) {
                self.postMessage({
                    type: "member-removed",
                    userId: member.additionalDetails.AadObjectId,
                });
            }
        });

        const getUserIdByConnectionId = (targetConnectionId) => {
            const members = audience.getMembers();
            for (const [userId, member] of members.entries()) {
                const connections = member.connections;
                if (connections.some((connection) => connection.id === targetConnectionId)) {
                    return { userId: userId, userName: member.userName, aadObjectId: member.additionalDetails.AadObjectId };
                }
            }

            return null;
        };

        selectionSharedMap.on("valueChanged", async (changed, local) => {
            const user = getUserIdByConnectionId(changed.key);
            if (user) {
                const userConnections = audience
                    .getMembers()
                    .get(user.userId).connections;

                const userEntityIdArray = [];

                const connectionIdInContainer = await map
                    .get("selection")
                    .get();

                userConnections.forEach((connection) => {
                    userEntityIdArray.push(
                        connectionIdInContainer.get(connection.id)
                    );
                });

                // aadObjectId is the unique identifier for a user
                await self.postMessage({
                    type: "client-data",
                    userId: user.aadObjectId,
                    userName: user.userName,
                    containerId: swpId,
                    entityId: userEntityIdArray,
                });
            }
        });
    } catch (error) {
        // TODO: add telemetry
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
