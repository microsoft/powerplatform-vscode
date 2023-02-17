/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export class NPSWebView {
    public static currentPanel: NPSWebView | undefined;

    public static readonly viewType = "npsPreview";

    private readonly _panel: vscode.WebviewPanel;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel) {
		this._panel = panel;
	//	this._extensionUri = extensionUri;

		// Set the webview's initial html content
		this._update();

		// Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programmatically
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

		// Update the content based on view changes
		this._panel.onDidChangeViewState(
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			e => {
				if (this._panel.visible) {
					this._update();
				}
			},
			null,
			this._disposables
		);

		// Handle messages from the webview
		this._panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'alert':
						vscode.window.showErrorMessage(message.text);
						return;
				}
			},
			null,
			this._disposables
		);
	}

    public dispose() {
		NPSWebView.currentPanel = undefined;

		// Clean up our resources
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) {
				x.dispose();
			}
		}
	}

    public static getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    private _update() {
	//	const webview = this._panel.webview;
     //   this._panel.webview.html = this._getHtmlForWebview(webview, cats[catName]);
    }

    public static _getHtmlForWebview(_extensionUri: vscode.Uri,webview: vscode.Webview) {
        const scriptPathOnDisk = vscode.Uri.joinPath(_extensionUri, 'media', 'main.js');
        const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

        const nonce = NPSWebView.getNonce();
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none';script-src 'nonce-${nonce}';">
            <title>Test CES Survey</title>
        </head>
        <body>
            <div id="surveyDiv" style="height:800px; width:500px;"></div>
            <script src="${scriptUri}" nonce="${nonce}"></script>
        </body>
        </html>`;
    }

    public static createOrShow(): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // If we already have a panel, show it.
        if (NPSWebView.currentPanel) {
            NPSWebView.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            NPSWebView.viewType,
            "NPS Preview",
            vscode.ViewColumn.Two,
            {enableScripts:true}
        );

        NPSWebView.currentPanel = new NPSWebView(panel);
    }

    public static revive(panel: vscode.WebviewPanel): void {
        NPSWebView.currentPanel = new NPSWebView(panel);
    }

}