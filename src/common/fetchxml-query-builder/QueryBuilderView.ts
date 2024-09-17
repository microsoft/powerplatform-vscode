/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export class FetchXMLQueryBuilderProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'fetchXML-query-builder';
  
    constructor(private readonly _extensionUri: vscode.Uri) {}
  
    // This is called when the webview view is shown in the sidebar
    public resolveWebviewView(
      webviewView: vscode.WebviewView,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _context: vscode.WebviewViewResolveContext,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      _token: vscode.CancellationToken
    ) {
      // Allow scripts in the webview
      webviewView.webview.options = {
        enableScripts: true,
        localResourceRoots: [this._extensionUri]
      };
      // Set the HTML content of the webview
      webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
    }
  
    // Define the HTML content for the webview
    
    private _getHtmlForWebview(webview: vscode.Webview): string {
      // The base URI is used to load the script
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
              console.log('ttt-hi');
              
              FetchXmlQueryBuilder.renderApp('root'); // Call the render function to mount the React app
              console.log('ttt-hi2');
            } else {
              console.error('renderApp is not defined.');
            }
          });
        </script>
        </html>`;
    }    
}