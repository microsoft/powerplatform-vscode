/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export class DecorationManager {
    private static instanceMap: Map<string, vscode.TextEditorDecorationType> =
        new Map();
    private static highlightColors = [
        "#FFC107",
        "#FF5722",
        "#4CAF50",
        "#2196F3",
        "#9C27B0",
        "#F44336",
        "#00BCD4",
        "#E91E63",
        "#FFEB3B",
        "#00E676",
        "#3F51B5",
        "#8BC34A",
        "#673AB7",
        "#03A9F4",
        "#9E9E9E",
    ];

    private constructor() {
        // Private constructor to prevent external instantiation
    }

    public static getInstance(userName: string): any {
        if (!this.instanceMap.has(userName)) {
            const randomColor = this.getRandomColor();
            const decorationType = vscode.window.createTextEditorDecorationType(
                {
                    before: {
                        contentText: "",
                        fontWeight: "bold",
                        margin: "0 0 0 0",
                        width: "1px",
                        backgroundColor: randomColor,
                    },
                    after: {
                        contentText: userName,
                        color: randomColor,
                        fontWeight: "bold",
                        border: `1px solid ${randomColor}`,
                    },
                }
            );
            DecorationManager.instanceMap.set(userName, decorationType);
        }
        return this.instanceMap.get(userName);
    }

    public static getRandomColor() {
        const randomIndex = Math.floor(
            Math.random() * this.highlightColors.length
        );
        return this.highlightColors[randomIndex];
    }
}
