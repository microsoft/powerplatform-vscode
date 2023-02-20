/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export class NPSWebView  {
    private readonly _webviewPanel: vscode.WebviewPanel;

    private constructor(private readonly extensionUri:vscode.Uri,webViewPanel: vscode.WebviewPanel){
        this._webviewPanel = webViewPanel;
        this._webviewPanel.webview.html = this._getHtml();
    }

    private _getHtml() {
		const nonce = getNonce();
        const mainJs = this.extensionResourceUrl('media','main.js');
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Test CES Survey</title>
                <script data-main="scripts/app" src="scripts/require.js"></script>
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; frame-src https://customervoice.microsoft.com/ ; img-src https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/cross.svg ; style-src  https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.css 'nonce-${nonce}';script-src https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.js 'nonce-${nonce}';">
            </head>
            <body>
                <div id="surveyDiv"></div>
                <script src="https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.js" type="text/javascript"></script>
                <link rel="stylesheet" type="text/css" href="https://mfpembedcdnmsit.azureedge.net/mfpembedcontmsit/Embed.css" />
                <script nonce="${nonce}" type="module" src="${mainJs}"></script>
            </body>
            </html>`;
    }

    private extensionResourceUrl(...parts: string[]): vscode.Uri {
		return this._webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, ...parts));
	}

    public static createOrShow(extensionUri: vscode.Uri): NPSWebView {
        const webview = vscode.window.createWebviewPanel(
            'testCESSurvey',
            "Test CES Survey",
            {viewColumn:vscode.ViewColumn.One,
                preserveFocus:false
            },
            {
                enableScripts:true,
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, 'media','main.js')
                ]
            }
        );
        return new NPSWebView(extensionUri,  webview);
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 64; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}