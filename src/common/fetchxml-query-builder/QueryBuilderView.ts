/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export class FetchXmlQueryBuilderPanel {
    public static currentPanel: FetchXmlQueryBuilderPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (FetchXmlQueryBuilderPanel.currentPanel) {
            FetchXmlQueryBuilderPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'fetchXML-query-builder',
            'FetchXML Query Builder',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')]
            }
        );

        FetchXmlQueryBuilderPanel.currentPanel = new FetchXmlQueryBuilderPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // Set the HTML content for the webview
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(this._handleMessage.bind(this));

        // Dispose of the panel when it's closed
        this._panel.onDidDispose(() => this.dispose(), null, []);
    }

    public dispose() {
        FetchXmlQueryBuilderPanel.currentPanel = undefined;
        this._panel.dispose();
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FetchXML Query Builder</title>
        </head>
        <body>
          <div id="root"></div>
          <script src="${scriptUri}"></script>
        </body>
        <script>
          window.addEventListener('load', () => {
            debugger;
            if (typeof FetchXmlQueryBuilder.renderApp === 'function') {
              FetchXmlQueryBuilder.renderApp('root');
            } else {
              console.error('renderApp is not defined.');
            }
          });
        </script>
        </html>`;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _handleMessage(message: any) {
        switch (message.type) {
            case 'getEntities':
                // Handle the 'getEntities' message
                this._panel.webview.postMessage({ type: 'getEntities', entities: [] });
                break;
            // Add more cases to handle other message types
        }
    }
}
