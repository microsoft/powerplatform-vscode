/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";

export const CONTAINER_ID = "containerId";
export const LINE_NUMBER_KEY = "lineNumber";
export const COLUMN_NUMBER_KEY = "columnNumber";

export interface IContainerData {
    containerId: string;
    lineNumber: number;
    columnNumber: number;
}

export async function loadContainer(id: string, line: number, column: number) {
    console.log("VSCODE WEBVIEW Inside loadContainer with ", id);
    console.log(`VSCODE WEBVIEW Line: ${line}`);
    console.log(`VSCODE WEBVIEW Column: ${column}`);

    const config = {
        connection: { port: 7070, domain: "http://localhost" },
    };

    const clientProps = {
        connection: config,
    };

    console.log("VSCODE WEBVIEW clientProps: ", clientProps);

    const { TinyliciousClient } =
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require("@fluidframework/tinylicious-client");

    const tinyClient = new TinyliciousClient(clientProps);

    console.log("VSCODE WEBVIEW tiny client created");

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { SharedMap } = require("fluid-framework");

    const containerSchema = {
        initialObjects: { position: SharedMap },
    };

    console.log("VSCODE WEBVIEW shared map loaded");

    try {
        const { container } = await tinyClient.getContainer(
            WebExtensionContext.containerId,
            containerSchema
        );
        const map = container.initialObjects.position;
        const activeEditor = vscode.window.activeTextEditor;

        // Update active editor cursor location based on the container parameters
        if (activeEditor) {
            const newPosition = new vscode.Position(
                map.get(LINE_NUMBER_KEY) as number,
                map.get(COLUMN_NUMBER_KEY) as number
            ); // line 3, column 1
            const newSelection = new vscode.Selection(newPosition, newPosition);
            activeEditor.selection = newSelection;
            console.log(
                "VSCODE WEBVIEW New position updated to existing values",
                line,
                column
            );
        }
    } catch (error) {
        console.error(`Error retrieving container: ${error}`);
        console.error(`Creating new container`);

        const { container } = await tinyClient.createContainer(containerSchema);
        const map = container.initialObjects.position;
        map.set(LINE_NUMBER_KEY, line);
        map.set(COLUMN_NUMBER_KEY, column);
        WebExtensionContext.containerId = await container.attach();
        map.set(CONTAINER_ID, WebExtensionContext.containerId);
        console.log(
            "VSCODE WEBVIEW New position updated to new values",
            line,
            column
        );
    }
}
