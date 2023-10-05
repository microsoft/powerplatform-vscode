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

async function loadContainer(config, id, swpId) {
    try {
        const { container, audience, map } =
            await AzureFluidClient.fetchContainerAndService(config, swpId);

        const existingMembers = audience.getMembers();

        // TODO: insert user with entity id in container

        audience.on("memberRemoved", (clientId, member) => {
            if (!existingMembers.get(member.userId)) {
                self.postMessage({
                    type: "member-removed",
                    userId: member.userId,
                });
            }
        });

        if (!initial) {
            existingMembers.forEach(async (value, key) => {
                const otherUser = value;
                const connectionArray = otherUser.connections;

                const EntityID = [];

                for (let i = 0; i < connectionArray.length; i++) {
                    const connection = connectionArray[i]?.id;
                    EntityID.push((await container.initialObjects.sharedState.get('selection').get()).get(connection));
                }

                self.postMessage({
                    type: "client-data",
                    userName: otherUser.userName,
                    userId: key,
                    containerId: swpId,
                    entityId: EntityID,
                });
            });
            initial = true;
        }

        map.on("valueChanged", async (changed, local) => {
            if (!local) {
                const otherUser = map.get(changed.key);
                const connectionArray = otherUser.connections;

                const EntityID = [];

                for (let i = 0; i < connectionArray.length; i++) {
                    const connection = connectionArray[i]?.id;
                    EntityID.push((await container.initialObjects.sharedState.get('selection').get()).get(connection));
                }

                // eslint-disable-next-line no-undef
                await self.postMessage({
                    type: "client-data",
                    userId: changed.key,
                    userName: otherUser.userName,
                    containerId: swpId,
                    entityId: EntityID,
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
            message.containerId,
            message.afrConfig.swpId,
        );
    });
}

runFluidApp();
