/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
export let apiToken: string;
export let sessionID: string;
export let userName: string;
export let orgID: string;
export let environmentName: string;



export class PowerPagesCopilot implements vscode.WebviewViewProvider {
  public static readonly viewType = "powerpages.copilot";
  private _view?: vscode.WebviewView;


  constructor(private readonly _extensionUri: vscode.Uri) {

  }


  private isDesktop: boolean = vscode.env.uiKind === vscode.UIKind.Desktop;

  public async resolveWebviewView(
    webviewView: vscode.WebviewView,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: vscode.WebviewViewResolveContext,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;


    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);


  }


  private _getHtmlForWebview(webview: vscode.Webview) {



    const copilotStylePath = vscode.Uri.joinPath(
      this._extensionUri,
      'src',
      "common",
      "copilot",
      "assets",
      "styles",
      "copilot.css"
  );

  const copilotStyleUri = webview.asWebviewUri(copilotStylePath);
    const codiconStylePath = vscode.Uri.joinPath(
      this._extensionUri,
      'src',
      "common",
      "copilot",
      "assets",
      "styles",
      "codicon.css"
    );
    const codiconStyleUri = webview.asWebviewUri(codiconStylePath);



    //TODO: Add CSP
    return `
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <link href="${copilotStyleUri}" rel="stylesheet">
          </link>
          <link href="${codiconStyleUri}" rel="stylesheet">
          </link>
          <title>Chat View</title>
        </head>
        
        <body>
          <div class="copilot-window">
        
            <div class="chat-messages" id="chat-messages">
              <div id="copilot-header"></div>
            </div>
        
            <div class="chat-input">
              <div class="input-container">
                <input type="text" placeholder="Ask a question..." id="chat-input" class="input-field">
                <button aria-label="Match Case" id="send-button" class="send-button">
                  <span>
                    <svg width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1.17683 1.1185C1.32953 0.989145 1.54464 0.963297 1.72363 1.05279L14.7236 7.55279C14.893 7.63748 15 7.81061 15 8C15 8.18939 14.893 8.36252 14.7236 8.44721L1.72363 14.9472C1.54464 15.0367 1.32953 15.0109 1.17683 14.8815C1.02414 14.7522 0.96328 14.5442 1.02213 14.353L2.97688 8L1.02213 1.64705C0.96328 1.45578 1.02414 1.24785 1.17683 1.1185ZM3.8693 8.5L2.32155 13.5302L13.382 8L2.32155 2.46979L3.8693 7.5H9.50001C9.77615 7.5 10 7.72386 10 8C10 8.27614 9.77615 8.5 9.50001 8.5H3.8693Z"
                        class="send-icon" />
                    </svg>
                  </span>
                </button>
              </div>
              <p class="disclaimer">Make sure AI-generated content is accurate and appropriate before using. <a href="https://go.microsoft.com/fwlink/?linkid=2240145">Learn more</a> | <a href="#">View
                  terms</a></p>
            </div>
          </div>
        
        </body>
        
        </html>`;
  }
}