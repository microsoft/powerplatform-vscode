/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export class MyWebview {
    private _panel!: vscode.WebviewPanel;
    private _extensionUri: vscode.Uri;

    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
    }

    public get panel() {
        return this._panel;
    }

    public async show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
        } else {
            this._panel = vscode.window.createWebviewPanel(
                "myWebview",
                "My Webview",
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    localResourceRoots: [this._extensionUri],
                    retainContextWhenHidden: true,
                }
            );

            // Load the HTML content for the webview
            this._panel.webview.html = this.getWebviewContent();
        }
    }

    private getWebviewContent() {
        console.log("extensionUri", this._extensionUri);
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(
            this._extensionUri,
            "src",
            "web",
            "client",
            "webViews",
            "main.js"
        );
        console.log("scriptPathOnDisk", scriptPathOnDisk);

        // And the uri we use to load this script in the webview
        const scriptUri = scriptPathOnDisk.with({ scheme: "vscode-resource" });

        // Use a nonce to only allow specific scripts to be run
        const nonce = this.getNonce();
        // Load your HTML content here
        // You can use `this.extensionUri` to reference files in your extension's directory
        return `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>My Webview</title>
        </head>
        <body>
        
			<script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
    }

    private getNonce() {
        let text = "";
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        return text;
    }
}
