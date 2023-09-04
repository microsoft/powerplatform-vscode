/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { AzureFluidClient } from "./AzureClientService";

// eslint-disable-next-line no-undef
self.window = self;

let initial = false;

async function loadContainer(config, id, swpId, file) {
    try {
        const { container, audience, map } = await AzureFluidClient.fetchContainerAndService(config, swpId);

        console.log("container", container);
        console.log("audience", audience);
        console.log("container status", container.connectionState);
        console.log("map", map);

        const existingMembers = audience.getMembers();

        const myself = audience.getMyself();

        const currentUser = {
            containerId: id,
            fileName: file.fileName,
            filePath: file.filePath,
            userName: myself.userName,
        };

        map.set(myself.userId, currentUser);

        audience.on("memberRemoved", (clientId, member) => {
            console.log("EXISTING MEMBER LEFT", clientId, member);

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
                console.log("in intial other user", otherUser);
                self.postMessage({
                    type: "client-data",
                    totalUsers: existingMembers.size,
                    userName: otherUser.userName,
                    userId: key,
                    containerId: swpId,
                    fileName: otherUser.fileName === undefined ? "On Studio" : otherUser.fileName,
                    filePath: otherUser.filePath,
                });
            });
            initial = true;
        }
    } catch (error) {
        console.log(`Error retrieving container: ${error}`);
    }
}

function runFluidApp() {
    // eslint-disable-next-line no-undef
    self.addEventListener("message", async (event) => {
        const message = event.data;

        await loadContainer(
            message.afrConfig,
            message.containerId,
            message.afrConfig.swpId,
            message.file
        );
    });
}

runFluidApp();
