/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
// import { createAiWebpage } from "./Utils";
import { sendApiRequest } from "./IntelligenceApi";

declare const IS_DESKTOP: boolean;

export class PowerPagesCopilot implements vscode.WebviewViewProvider {
    public static readonly viewType = "powerpages.copilot";
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

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


        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "webViewLoaded": {
                    console.log("webview loaded");
                    this.sendMessageToWebview({ type: 'env', value: this.isDesktop });
                    break;
                }
                case "newUserPrompt": {
                    const engineeredPrompt = this.promptEngine(data.value);
                    const apiResponse = await sendApiRequest(engineeredPrompt);
                    this.sendMessageToWebview({ type: 'apiResponse', value: apiResponse });
                    break;
                }
                case "insertCode": {
                    console.log("code ready to be inserted " + data.value);
                    vscode.window.activeTextEditor?.insertSnippet(
                        new vscode.SnippetString(`${data.value}`)
                    );
                    break;
                }
                case "copyCodeToClipboard": {
                    console.log(
                        "code ready to be copied to clipboard " + data.value
                    );
                    vscode.env.clipboard.writeText(data.value);
                    break;
                }
                case "createWebpage": {
                    console.log("create webpage with code = " + data.value);

                    if (IS_DESKTOP) {
                        try {
                          const { createAiWebpage } = await import("./Utils");
                          createAiWebpage(data.value);
                        } catch (e) {
                          console.error(e);
                        }
                    }
                    break;
                }
                case "createWebfile": {
                    console.log("create webfile with image = " + data.value);
                    break;
                }
                case "createTablePermission": {
                    console.log(
                        "create table permission with code = " + data.value
                    );
                    break;
                }
                case "createNewFile": {
                    console.log("create new file with code = " + data.value);
                    //createNewFile(data.value);
                }
            }
        });
    }

    public promptEngine(message: string) {
        //const entityList=  `The list gets its data asynchronously, and when it's complete it will trigger an event 'loaded' that your custom JavaScript can listen for and do something with items in the grid. The following code is a sample javascript code: \`+"${"```"}" +\` $(document).ready(function () { $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("tr").each(function () { // do something with each row $(this).css("background-color", "yellow"); }); }); }); \`+"${"```"}" +\` Find a particular attribute field and get its value to possibly modify the rendering of the value. The following code gets each table cell that contains the value of the accountnumber attribute. Replace accountnumber with an attribute appropriate for your table and view. \`+"${"```"}" +\` $(document).ready(function (){ $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("td[data-attribute='accountnumber']").each(function (i, e){ var value = $(this).data(value); \`+"${"```"}" +\` // now that you have the value you can do something to the value }); }); });`
        const activeEditorContent = this.getActiveEditorContent();

        const enigneeredPrompt = message + " " + activeEditorContent; // modify the user prompt here

        return enigneeredPrompt;
    }


    private getActiveEditorContent() {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            return activeEditor.document.getText();
        }
        return "";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public sendMessageToWebview(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        } else {
            console.log("webview not found");
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {


        const copilotScriptPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'common', 'copilot', 'assets', 'scripts', 'copilot.js');
        const copilotScriptUri = webview.asWebviewUri(copilotScriptPath);

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

        // Use a nonce to only allow specific scripts to be run
		const nonce = getNonce();


        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; connect-src https://api.openai.com;">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${copilotStyleUri}" rel="stylesheet"></link>
            <title>Chat View</title>
        </head>
        <body>
            <div class="chat-container">
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" id="chat-input" placeholder="Ask Copilot a question or type '/' for tables" />
                    <button id="send-button"></button>
                </div>
            </div>
            <script nonce="${nonce}" src="${copilotScriptUri}"></script>
        </body>
        </html>`;
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
