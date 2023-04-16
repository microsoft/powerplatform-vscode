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

        // webviewView.webview.onDidReceiveMessage(data => {
        // 	switch (data.type) {
        // 		case 'colorSelected':
        // 			{
        // 				vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
        // 				break;
        // 			}
        // 	}
        // });
    }


    private _getHtmlForWebview(webview: vscode.Webview) {

        const webpageIconPath = vscode.Uri.joinPath(this._extensionUri,'src', 'client', 'portal_fileicons', 'icons', 'dark', 'adx_web_pages.svg');
        const webpageIconUri = webview.asWebviewUri(webpageIconPath);

        const webfileIconPath = vscode.Uri.joinPath(this._extensionUri,'src', 'client', 'portal_fileicons', 'icons', 'dark', 'adx_web_files.svg');
        const webfileIconUri = webview.asWebviewUri(webfileIconPath);

        const tabelPermissonsIconPath = vscode.Uri.joinPath(this._extensionUri,'src', 'client', 'portal_fileicons', 'icons', 'dark', 'table_permissions.svg');
        const tabelPermissonsIconUri = webview.asWebviewUri(tabelPermissonsIconPath);

        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                }
                .chat-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 10px;
                }
                .chat-input {
                    display: flex;
                    border-top: 1px solid #ccc;
                }
                .chat-input input {
                    flex: 1;
                    border: none;
                    padding: 10px;
                }
                .chat-input button {
                    background-color: #007acc;
                    color: white;
                    border: none;
                    padding: 10px;
                    cursor: pointer;
                }
                .user-message {
                    background-color: #252526;
                    color: white;
                    margin-bottom: 5px;
                    border-bottom: 1px solid grey;
                    padding: 10px;
                }
                .api-response {
                    background-color: #1E1E1E;
                    color: white;
                    margin-bottom: 5px;
                    border-bottom: 1px solid grey;
                    padding-left: 10px;
                    padding-top: 50px;
                    padding-bottom: 10px;
                    padding-right: 10px;
                }
                .message-wrapper {
                    position: relative;
                }
                .action-wrapper {
                    position: absolute;
                    top: 0;
                    right: 0;
                    display: flex;
                }
                .action-button {
                    background-color: #007acc;
                    color: white;
                    border: none;
                    padding: 5px;
                    margin: 5px;
                    cursor: pointer;
                }

                .accordion {
                    background-color: #007acc;
                    color: white;
                    cursor: pointer;
                    padding: 5px;
                    width: fit-content;
                    border: none;
                    text-align: left;
                    outline: none;
                    font-size: 15px;
                    transition: 0.4s;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .active, .accordion:hover {
                    background-color: #0066cc;
                }

                .accordion:after {
                    content: '\\002B';
                    color: white;
                    font-weight: bold;
                    float: right;
                    margin-left: 5px;
                }

                .active:after {
                    content: "\\2212";
                }

                .accordion-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.2s ease-out;
                    background-color: transparent;
                    padding: 0 18px;
                }

                .accordion-content a {
                    display: block;
                    padding: 12px 0;
                    color: #333;
                    text-decoration: none;
                    transition: 0.3s;
                }

                .accordion-content a:hover {
                    background-color: #ddd;
                }

            </style>
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
            <script>
            const chatMessages = document.getElementById('chat-messages');
            const chatInput = document.getElementById('chat-input');
            const sendButton = document.getElementById('send-button');

            function addMessage(message, className) {
                const messageWrapper = document.createElement('div');
                messageWrapper.classList.add('message-wrapper');

                const messageElement = document.createElement('div');
                if (className === 'user-message') {
                    const makerElement = document.createElement('div');
                    makerElement.textContent = 'Maker:';
                    messageElement.appendChild(makerElement);
                    makerElement.appendChild(document.createElement('br'));
                }
                else if (className === 'api-response') {
                    const makerElement = document.createElement('div');
                    makerElement.textContent = 'PowerPages Copilot:';
                    messageElement.appendChild(makerElement);
                    makerElement.appendChild(document.createElement('br'));
                }
                const messageText = document.createElement('div');
                messageText.textContent = message;
                messageElement.appendChild(messageText);
                messageElement.classList.add('message', className);

                messageWrapper.appendChild(messageElement);

                if (className === 'api-response') {
                    const actionWrapper = document.createElement('div');
                    actionWrapper.classList.add('action-wrapper');

                    const CopyButton = document.createElement('button');
                    CopyButton.textContent = 'Copy';
                    CopyButton.classList.add('action-button');
                    CopyButton.addEventListener('click', () => {
                        console.log('Copy clicked');
                    });
                    actionWrapper.appendChild(CopyButton);

                    const InsertButton = document.createElement('button');
                    InsertButton.textContent = 'Insert';
                    InsertButton.classList.add('action-button');
                    InsertButton.addEventListener('click', () => {
                        console.log('Insert clicked');
                    });
                    actionWrapper.appendChild(InsertButton);

                    const CreateButton = document.createElement('button');
                    CreateButton.textContent = 'Create';
                    CreateButton.classList.add('accordion');

                    const accordionContent = document.createElement('div');
                    accordionContent.classList.add('accordion-content');

                    const option1 = document.createElement('button');
                    const webpageicon = document.createElement('img');
                    webpageicon.src = '${webpageIconUri}';
                    option1.appendChild(webpageicon);
                    option1.addEventListener('click', () => {
                        console.log('Create Webpage clicked');
                    });
                    accordionContent.appendChild(option1);

                    const option2 = document.createElement('button');
                    const webfileicon = document.createElement('img');
                    webfileicon.src = '${webfileIconUri}';
                    option2.appendChild(webfileicon);
                    option2.addEventListener('click', () => {
                        console.log('Create WebFile clicked');
                    });
                    accordionContent.appendChild(option2);

                    const option3 = document.createElement('button');
                    const tablepermissionicon = document.createElement('img');
                    tablepermissionicon.src = '${tabelPermissonsIconUri}';
                    option3.appendChild(tablepermissionicon);
                    option3.addEventListener('click', () => {
                        console.log('Create Table Permission clicked');
                    });
                    accordionContent.appendChild(option3);

                    CreateButton.addEventListener('click', () => {
                        CreateButton.classList.toggle('active');
                        if (accordionContent.style.maxHeight) {
                            accordionContent.style.maxHeight = null;
                        } else {
                            accordionContent.style.maxHeight = accordionContent.scrollHeight + 'px';
                        }
                    });

                    CreateButton.appendChild(accordionContent);
                    actionWrapper.appendChild(CreateButton);

                    messageWrapper.appendChild(actionWrapper);
                }

                chatMessages.appendChild(messageWrapper);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }

            async function sendMessageToApi(message) {
                // const response = await fetch('https://openAI-endpoint', {
                //     method: 'POST',
                //     headers: {
                //         'Content-Type': 'application/json'
                //     },
                //     body: JSON.stringify({ message })
                // });

                // if (response.ok) {
                //     const jsonResponse = await response.json();
                //     // Assuming the API response contains a 'responseMessage' field
                //     addMessage(jsonResponse.responseMessage, 'api-response');
                // } else {
                //     // Handle the API error, e.g., display an error message
                // }
                addMessage('This is a dummy response to your message : ' + message, 'api-response');
            }

            sendButton.addEventListener('click', () => {
                if (chatInput.value.trim()) {
                    addMessage(chatInput.value, 'user-message');
                    sendMessageToApi(chatInput.value);
                    chatInput.value = '';
                    chatInput.focus();
                }
            });

            chatInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && chatInput.value.trim()) {
                    addMessage(chatInput.value, 'user-message');
                    sendMessageToApi(chatInput.value);
                    chatInput.value = '';
                }
            });
        </script>
        </body>
        </html>`;
    }
}