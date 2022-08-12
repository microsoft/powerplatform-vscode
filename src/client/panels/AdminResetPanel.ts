/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getUri } from "./utilities/getUri";

export class AdminResetPanel {
    public static currentPanel: AdminResetPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._panel.onDidDispose(this.dispose, null, this._disposables);

        this._panel.webview.html = this._getWebviewContent(this._panel.webview, extensionUri);
        this._setWebviewMessageListener(this._panel.webview);
    }

    public static render(extensionUri: vscode.Uri) {
        if (AdminResetPanel.currentPanel) {
            AdminResetPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel("adminreset", "pad admin reset", vscode.ViewColumn.One, {
                enableScripts: true,
            });

            AdminResetPanel.currentPanel = new AdminResetPanel(panel, extensionUri);
        }
    }

    public dispose() {
        AdminResetPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    private _getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
        const toolkitUri = getUri(webview, extensionUri, [
            "node_modules",
            "@vscode",
            "webview-ui-toolkit",
            "dist",
            "toolkit.js", // A toolkit.min.js file is also available
        ]);
        const messageProcessingUri = getUri(webview, extensionUri, ["src", "client", "panels", "AdminResetMessageProcessing.js"]);

        return /*html*/ `
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <script type="module" src="${toolkitUri}"></script>
        <script type="module" src="${messageProcessingUri}"></script>
        <title>pac admin reset</title>
    </head>
    <body>
        <h1>Reset environment from your tenant</h1>
        <vscode-text-field id="envTxtBox" placeholder="URL or ID of the Environment that needs to be reset">Environment:</vscode-text-field>
        <vscode-text-field id="currencyTxtBox" placeholder="Sets the currency used for your environment. [defaults to USD]">    Currency:</vscode-text-field>
        <vscode-text-field id="domainTxtBox">Domain:</vscode-text-field>
        <vscode-text-field id="nameTxtBox">Name:</vscode-text-field>
        <vscode-text-field id="languageTxtBox">Language:</vscode-text-field>
        <vscode-text-field id="purposeTxtBox">Purpose:</vscode-text-field>
        <!-- multi select box - Sets Dynamics365 app that needs to be deployed. [passed as comma separated values] e.g : -tm "D365_Sample, D365_Sales" (alias: -tm)-->
        <vscode-text-field id="templatesTxtBox">templates</vscode-text-field>
        <vscode-dropdown id="templates">
            <vscode-option>None</vscode-option>
            <vscode-option>D365_Sample</vscode-option>
            <vscode-option>D365_Sales</vscode-option>
        </vscode-dropdown>
        <vscode-checkbox id="asyncCheckBox">Async</vscode-checkbox>
        <vscode-button id="submitBtn">Submit</vscode-button>
    </body>
</html>
        `;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                const command = message.command;
                switch (command) {
                    case "submit":
                        vscode.window.showInformationMessage(
                            `pac admin reset --environment ${message.environment} --currency ${message.currency} --domain ${message.domain} --name ${message.name} --language ${message.language} --purpose ${message.purpose} --templates ${message.templates} --async ${message.async}`);
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }
}
