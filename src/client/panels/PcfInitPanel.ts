/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getUri } from "./utilities/getUri";

export class PcfInitPanel {
    public static currentPanel: PcfInitPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, outputDirectory: string) {
        this._panel = panel;
        this._panel.onDidDispose(this.dispose, null, this._disposables);

        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri, outputDirectory);
        this._setWebviewMessageListener(this._panel.webview);
    }

    public static render(extensionUri: vscode.Uri, outputDirectory: string) {
        if (PcfInitPanel.currentPanel) {
            PcfInitPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel("pcfInit", "pac pcf init", vscode.ViewColumn.One, {
                enableScripts: true,
            });

            PcfInitPanel.currentPanel = new PcfInitPanel(panel, extensionUri, outputDirectory);
        }
    }

    public dispose() {
        PcfInitPanel.currentPanel = undefined;

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
        const messageProcessingUri = getUri(webview, extensionUri, ["src", "client", "panels", "PcfInitMessageProcessing.js"]);

        return /*html*/ `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <script type="module" src="${toolkitUri}"></script>
        <script type="module" src="${messageProcessingUri}"></script>
        <title>pac pcf init</title>
    </head>
    <body>
        <h1>Initializes a directory with a new Dataverse pcf project</h1>
        <section id="pcfForm">
            <vscode-text-field id="directoryTxtBox" value="${outputDirectory}">Output Directory:</vscode-text-field>
            <vscode-text-field id="namespaceTxtBox">Namespace:</vscode-text-field>
            <vscode-text-field id="nameTxtBox">Name:</vscode-text-field>
            <vscode-dropdown id="templateDropDown">
                <vscode-option value="field">field</vscode-option>
                <vscode-option value="dataset">dataset</vscode-option>
            </vscode-dropdown>
            </section>
        <vscode-button id="submit">Submit</vscode-button>
    </body>
</html>
        `;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                const outputDirectory = message.outputDirectory;
                const name = message.name;
                const namespace = message.namespace;
                const template = message.template;

                switch (command) {
                    case "submit":
                        vscode.window.showInformationMessage(
                            `pac pcf init --outputDirectory "${outputDirectory}" --name "${name}" --namespace "${namespace}" --template "${template}"`);
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }
}
