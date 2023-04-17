import * as vscode from "vscode";

export class PowerPagesCopilot implements vscode.WebviewViewProvider {

    public static readonly viewType = 'powerpages.copilot';

    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [
                this._extensionUri
            ]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(data => {
        	switch (data.type) {
        		case 'insertCode':
        			{
                        console.log('code ready to be inserted ' + data.value);
        				vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`${data.value}`));
        				break;
        			}
                case 'copyCodeToClipboard':
                    {
                        console.log('code ready to be copied to clipboard ' + data.value);
                        vscode.env.clipboard.writeText(data.value);
                        break;
                    }
                case 'createWebpage':
                    {
                        console.log('create webpage with code = ' + data.value);
                        break;
                    }
                case 'createWebfile':
                    {
                        console.log('create webfile with image = ' + data.value);
                        break;
                    }
                case 'createTablePermission':
                    {
                        console.log('create table permission with code = ' + data.value);
                        break;
                    }
        	}
        });
    }


    private _getHtmlForWebview(webview: vscode.Webview) {

        const webpageIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'web_pages.svg');
        const webpageIconUri = webview.asWebviewUri(webpageIconPath);

        const webfileIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'web_files.svg');
        const webfileIconUri = webview.asWebviewUri(webfileIconPath);

        const tabelPermissonsIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'table_permissions.svg');
        const tabelPermissonsIconUri = webview.asWebviewUri(tabelPermissonsIconPath);

        const copilotScriptPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'scripts', 'copilot.js');
        const copilotScriptUri = webview.asWebviewUri(copilotScriptPath);

        const copilotStylePath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'styles', 'copilot.css');
        const copilotStyleUri = webview.asWebviewUri(copilotStylePath);

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${copilotStyleUri}" rel="stylesheet"></link>
            <title>Chat View</title>
        </head>
        <body>
            <div class="chat-container">
                <div class="chat-messages" id="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" id="chat-input" placeholder="Type your message..." />
                    <button id="send-button">Send</button>
                </div>
            </div>
            <script src = "${copilotScriptUri}"> </script>
        </body>
        </html>`;
    }
}