/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

const highlightColors = [
    "#FFC107", // Amber
    "#FF5722", // Deep Orange
    "#4CAF50", // Green
    "#2196F3", // Blue
    "#9C27B0", // Purple
    "#F44336", // Red
    "#00BCD4", // Cyan
    "#E91E63", // Pink
    "#FFEB3B", // Yellow
    "#00E676", // Light Green
    "#3F51B5", // Indigo
    "#8BC34A", // Lime Green
    "#673AB7", // Deep Purple
    "#03A9F4", // Light Blue
    "#9E9E9E", // Grey
];
function getRandomColorIndex() {
    const randomIndex = Math.floor(Math.random() * highlightColors.length);
    return randomIndex;
}

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

    public static getInstance(
        userName: string
    ): vscode.TextEditorDecorationType {
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
