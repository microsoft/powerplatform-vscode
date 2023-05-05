/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const LINE_NUMBER_KEY = "lineNumber";
const COLUMN_NUMBER_KEY = "columnNumber";

const tinyliciousClient = require("@fluidframework/tinylicious-client");
const fluid = require("fluid-framework");

const config = {
    connection: { port: 7070, domain: "http://localhost" },
};

const clientProps = {
    connection: config,
};
const { TinyliciousClient } = tinyliciousClient;
const tinyClient = new TinyliciousClient(clientProps);
const { SharedMap } = fluid;

const containerSchema = {
    initialObjects: { position: SharedMap },
};

// console.log("hi from worker");

self.addEventListener("message", async function (e) {
    const message = e.data;
    if (message.type === "subscribe") {
        const { container } = await tinyClient.getContainer(
            message.containerId,
            containerSchema
        );
        const existingMap = container.initialObjects.position;

        self.postMessage({
            status: "connected",
            container: message.containerId,
            position: existingMap,
        });
    } else if (message.type === "create") {
        const { container } = await tinyClient.createContainer(containerSchema);
        const createdMap = container.initialObjects.position;
        createdMap.set(LINE_NUMBER_KEY, message.line);
        createdMap.set(COLUMN_NUMBER_KEY, message.column);

        const containerId = await container.attach();
        createdMap.set("CONTAINER_ID", containerId);

        // console.log("in craeted map ", message);

        self.postMessage({
            status: "client-pos",
            container: message.containerId,
            position: createdMap,
        });
    }
});

// class MyWorker {
//     constructor() {
//         self.addEventListener("message", this.handleMessage.bind(this));
//     }

//     async handleMessage(e) {
//         const message = e.data;
//         if (message.type === "subscribe") {
//             const { container } = await tinyClient.getContainer(
//                 message.containerId,
//                 containerSchema
//             );
//             const existingMap = container.initialObjects.position;

//             self.postMessage({
//                 status: "connected",
//                 container: message.containerId,
//                 position: existingMap,
//             });
//         } else if (message.type === "create") {
//             const { container } = await tinyClient.createContainer(
//                 containerSchema
//             );
//             const createdMap = container.initialObjects.position;

//             console.log("in craeted map ", message);
//             // createdMap.set(LINE_NUMBER_KEY, message.line);
//             // createdMap.set(COLUMN_NUMBER_KEY, );
//         }
//     }
// }

// export default MyWorker;
