/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getUri } from "./utilities/getUri";

export class SolutionInitPanel {
    public static currentPanel: SolutionInitPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, outputDirectory: string) {
        this._panel = panel;
        this._panel.onDidDispose(this.dispose, null, this._disposables);

        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri, outputDirectory);
        this._setWebviewMessageListener(this._panel.webview);
    }

    public static render(extensionUri: vscode.Uri, outputDirectory: string) {
        if (SolutionInitPanel.currentPanel) {
            SolutionInitPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel("solutionInit", "pac solution init", vscode.ViewColumn.One, {
                enableScripts: true,
            });

            SolutionInitPanel.currentPanel = new SolutionInitPanel(panel, extensionUri, outputDirectory);
        }
    }

    public dispose() {
        SolutionInitPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri, outputDirectory: string) {
        const toolkitUri = getUri(webview, extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js", // A toolkit.min.js file is also available
        ]);
        const messageProcessingUri = getUri(webview, extensionUri, ["src", "client", "panels", "SolutionInitMessageProcessing.js"]);

        return /*html*/ `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <script type="module" src="${toolkitUri}"></script>
        <script type="module" src="${messageProcessingUri}"></script>
        <title>pac solution init</title>
    </head>
    <body>
        <h1>Initializes a directory with a new Dataverse solution project</h1>
        <vscode-text-field id="directoryTxtBox" value="${outputDirectory}">Output Directory:</vscode-text-field>
        <vscode-text-field id="publisherNameTxtBox">Publisher Name:</vscode-text-field>
        <vscode-text-field id="publisherPrefixTxtBox">Publisher Prefix</vscode-text-field>
        <vscode-button id="submit">Submit</vscode-button>
    </body>
</html>
        `;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: {command: string, outputDirectory: string, publisherName: string, publisherPrefix: string}) => {
                const command = message.command;
                const outputDirectory = message.outputDirectory;
                const publisherName = message.publisherName;
                const publisherPrefix = message.publisherPrefix;

                switch (command) {
                    case "submit":
                        vscode.window.showInformationMessage(
                            `pac solution init --outputDirectory "${outputDirectory}" --publisher-prefix "${publisherPrefix}" --publisher-name "${publisherName}"`);
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }
}
