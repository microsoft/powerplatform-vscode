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
                    padding-top: 20px;
                    padding-bottom: 10px;
                    padding-right: 10px;
                }
                .message-wrapper {
                    position: relative;
                }
                .reaction-wrapper {
                    position: absolute;
                    top: 0;
                    right: 0;
                    display: flex;
                }
                .reaction-button {
                    background-color: transparent;
                    border: none;
                    margin-left: 5px;
                    cursor: pointer;
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
                    const reactionWrapper = document.createElement('div');
                    reactionWrapper.classList.add('reaction-wrapper');

                    const thumbsUpButton = document.createElement('button');
                    thumbsUpButton.textContent = '👍';
                    thumbsUpButton.classList.add('reaction-button');
                    thumbsUpButton.addEventListener('click', () => {
                        console.log('Thumbs up clicked');
                    });
                    reactionWrapper.appendChild(thumbsUpButton);

                    const thumbsDownButton = document.createElement('button');
                    thumbsDownButton.textContent = '👎';
                    thumbsDownButton.classList.add('reaction-button');
                    thumbsDownButton.addEventListener('click', () => {
                        console.log('Thumbs down clicked');
                    });
                    reactionWrapper.appendChild(thumbsDownButton);

                    messageWrapper.appendChild(reactionWrapper);
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