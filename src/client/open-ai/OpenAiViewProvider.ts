/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { sendApiRequest } from "./WebpageCreationUtility";

export class OpenAiViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "powerpages.copilot";

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    // _context: vscode.WebviewViewResolveContext,
    // _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview();

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "submit": {
           // Handle the submit message
           const newMessage = data.message;
           sendApiRequest(newMessage);
          break;
        }
      }
    });
  }

  private _getHtmlForWebview() {
    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();

    return `<!DOCTYPE html>
        <html>
            <head>
                <style>
                    .chat-form {
                        display: flex;
                        margin-bottom: 10px;
                    }

                    .chat-form input[type="text"] {
                        flex-grow: 1;
                        margin-right: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="chat-form">
                    <input type="text" id="message-input" placeholder="Type your wish...">
                    <button id="submit-button">Submit</button>
                </div>
                <div id="chat-messages"></div>
                <script nonce="${nonce}">
                    const messageInput = document.getElementById('message-input');
                    const submitButton = document.getElementById('submit-button');
                    const chatMessages = document.getElementById('chat-messages');

                    const vscode = acquireVsCodeApi();

                    submitButton.addEventListener('click', () => {
                        const message = messageInput.value.trim();
                        if (message) {
                            // Send the message to the extension
                            vscode.postMessage({ type: 'submit', message });
                            // Clear the input
                            messageInput.value = '';
                        }
                    });

                    function addMessage(message) {
                        const messageElem = document.createElement('div');
                        messageElem.innerText = message;
                        chatMessages.appendChild(messageElem);
                    }

                    // Receive messages from the extension
                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.type) {
                            case 'addMessage':
                                addMessage(message.message);
                                break;
                        }
                    });
                </script>
            </body>
            </html>`;
  }
}

function getNonce() {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
