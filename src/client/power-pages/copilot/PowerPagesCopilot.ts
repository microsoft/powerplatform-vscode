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

        const copyIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'codicon_copy.svg');
        const copyIconUri = webview.asWebviewUri(copyIconPath);

        const insertIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'row_insert.svg');
        const insertIconUri = webview.asWebviewUri(insertIconPath);

        const previewIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'codicon_eye_open.svg');
        const previewIconUri = webview.asWebviewUri(previewIconPath);

        const previewEndIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'codicon_eye_closed.svg');
        const previewEndIconUri = webview.asWebviewUri(previewEndIconPath);

        const createIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'codicon_add.svg');
        const createIconUri = webview.asWebviewUri(createIconPath);

        const sendIconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'client', 'power-pages', 'copilot', 'assets', 'icons', 'send.svg');
        const sendIconUri = webview.asWebviewUri(sendIconPath);
        
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
                    <input type="text" id="chat-input" placeholder="Ask Copilot a question or type '/' for tables" />
                    <button id="send-button"></button>
                </div>
            </div>
            <script>         
                const vscode = acquireVsCodeApi();
                const dequeue = [];
                const chatMessages = document.getElementById('chat-messages');
                const chatInput = document.getElementById('chat-input');

                const autocompletePanel = document.createElement('div');
                autocompletePanel.classList.add('autocomplete-panel');
                chatInput.parentNode?.appendChild(autocompletePanel);

                chatInput.addEventListener('focus', () => {
                    chatInput.style.border = '1px solid blue';
                });
                chatInput.addEventListener('blur', () => {
                    chatInput.style.border = 'none';
                });

                chatInput.style.background = 'rgb(60, 60, 60)';

                const SendButton = document.getElementById('send-button');
                SendButton.title = 'Send';
                const SendIcon = document.createElement('img');
                SendIcon.src = "${sendIconUri}";
                SendIcon.alt = 'Send';
                SendButton.appendChild(SendIcon);
            
                function addToDequeue(element) {
                    if (dequeue.length >= 5) {
                        dequeue.shift(); // Remove the first element from the dequeue
                    }
                    dequeue.push(element); // Add the new element to the end of the dequeue
                }
            
                function addMessage(message, className) {
                    const messageWrapper = document.createElement('div');
                    messageWrapper.classList.add('message-wrapper');
            
                    const messageElement = document.createElement('div');
                    if (className === 'user-message') {
                        addToDequeue(message);
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
                        const CopyIcon = document.createElement('img');
                        CopyIcon.src = "${copyIconUri}";
                        CopyIcon.alt = 'Copy';
                        CopyButton.appendChild(CopyIcon);
                        CopyButton.addEventListener('click', () => {
                            copyCodeToClipboard(message);
                        });
                        CopyButton.title = 'Copy to clipboard';
                        CopyButton.style.margin = '0';
                        CopyButton.style.padding = '5px';
                        CopyButton.style.border = '0';
                        CopyButton.style.background = 'none';
                        CopyButton.style.color = 'inherit';
                        CopyButton.addEventListener('mouseenter', () => {
                            CopyButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
                        });
                        CopyButton.addEventListener('mouseleave', () => {
                            CopyButton.style.boxShadow = 'none';
                        });
                        actionWrapper.appendChild(CopyButton);
            
                        const InsertButton = document.createElement('button');
                        const InsertIcon = document.createElement('img');
                        InsertIcon.src = "${insertIconUri}";
                        InsertIcon.alt = 'Insert';
                        InsertButton.appendChild(InsertIcon);
                        InsertButton.addEventListener('click', () => {
                            insertCode(message);
                        });
                        InsertButton.title = 'Insert code into editor';
                        InsertButton.style.margin = '0';
                        InsertButton.style.padding = '5px';
                        InsertButton.style.border = '0';
                        InsertButton.style.background = 'none';
                        InsertButton.style.color = 'inherit';
                        InsertButton.addEventListener('mouseenter', () => {
                            InsertButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
                        });
                        InsertButton.addEventListener('mouseleave', () => {
                            InsertButton.style.boxShadow = 'none';
                        });
                        actionWrapper.appendChild(InsertButton);
                        const PreviewButton = document.createElement('button');
                        const PreviewIcon = document.createElement('img');
                        let isPreviewing = false;
                        PreviewIcon.src = "${previewIconUri}";
                        PreviewIcon.alt = 'Preview';
                        PreviewButton.appendChild(PreviewIcon);
                        PreviewButton.addEventListener('click', () => {
                            isPreviewing = !isPreviewing;
                            if (isPreviewing) {
                                PreviewIcon.src = "${previewEndIconUri}";
                            } else {
                                PreviewIcon.src = "${previewIconUri}";
                            }
                            previewCode(message);
                        });
                        PreviewButton.title = 'Preview';
                        PreviewButton.style.margin = '0';
                        PreviewButton.style.padding = '5px';
                        PreviewButton.style.border = '0';
                        PreviewButton.style.background = 'none';
                        PreviewButton.style.color = 'inherit';
                        PreviewButton.addEventListener('mouseenter', () => {
                            PreviewButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
                        });
                        PreviewButton.addEventListener('mouseleave', () => {
                            PreviewButton.style.boxShadow = 'none';
                        });
                        actionWrapper.appendChild(PreviewButton);
            
                        const CreateButton = document.createElement('button');
                        const CreateIcon = document.createElement('img');
                        CreateIcon.src = "${createIconUri}";
                        CreateIcon.alt = 'Create';
                        CreateButton.appendChild(CreateIcon);
                        CreateButton.addEventListener('click', () => {
                            console.log('Create Button Clicked');
                        });
                        CreateButton.title = 'Create a new record';
                        CreateButton.style.margin = '0';
                        CreateButton.style.padding = '5px';
                        CreateButton.style.border = '0';
                        CreateButton.style.background = 'none';
                        CreateButton.style.color = 'inherit';
                        CreateButton.addEventListener('mouseenter', () => {
                            CreateButton.style.boxShadow = '0 0 5px rgba(0, 0, 0, 0.5)';
                        });
                        CreateButton.addEventListener('mouseleave', () => {
                            CreateButton.style.boxShadow = 'none';
                        });
                        actionWrapper.appendChild(CreateButton);
            
                        messageWrapper.appendChild(actionWrapper);
                    }
            
                    chatMessages.appendChild(messageWrapper);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            
                async function sendMessageToApi(message) {
                    const engineeredPrompt = generateEngineeredPrompt(message);
                    // const response = await fetch('https://openAI-endpoint', {
                    //     method: 'POST',
                    //     headers: {
                    //         'Content-Type': 'application/json'
                    //     },
                    //     body: JSON.stringify({ engineeredPrompt })
                    // });
            
                    // if (response.ok) {
                    //     const jsonResponse = await response.json();
                    //     // Assuming the API response contains a 'responseMessage' field
                    //     addMessage(jsonResponse.responseMessage, 'api-response');
                    // } else {
                    //     // Handle the API error, e.g., display an error message
                    // }
                    console.log('engineeredPrompt : ' + engineeredPrompt);
                    addMessage('This is a dummy response to your message : ' + message, 'api-response');
                }
            
                function generateEngineeredPrompt(userPrompt) {
                    let prompts = '';
                    for (let i = 0; i < dequeue.length; i++) {
                        const element = dequeue[i];
                        prompts += (i + 1) + '.' + element + ' '; // fix this to the required format for chat
                    }
            
                    console.log(prompts);
                    return prompts;
                }
            
                function insertCode(code) {
                    vscode.postMessage({ type: 'insertCode', value: code });
                }
            
                function copyCodeToClipboard(code) {
                    vscode.postMessage({ type: 'copyCodeToClipboard', value: code });
                }
            
                function createWebpage(code) {
                    vscode.postMessage({ type: 'createWebpage', value: code });
                }
            
                function createWebfile(code) {
                    vscode.postMessage({ type: 'createWebfile', value: code });
                }
            
                function createTablePermission(code) {
                    vscode.postMessage({ type: 'createTablePermission', value: code });
                }
            
                SendButton.addEventListener('click', () => {
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

                chatInput.addEventListener('input', () => {
                    if (chatInput.value === '/') {
                        showAutocompletePanel();
                    } else {
                        hideAutocompletePanel();
                    }
                });

                document.addEventListener('click', (event) => {
                    if (!chatInput.contains(event.target)) {
                        hideAutocompletePanel();
                    }
                });

                function showAutocompletePanel() {
                    autocompletePanel.innerHTML = \`<ul><li><a href="#">/webpage</a></li><li><a href="#">/webfile</a></li><li><a href="#">/tablepermission</a></li><li><a href="#">/webTemplate</a></li><li><a href="#">/pageTemplate</a></li><li><a href="#">/contentSnippet</a></li><li><a href="#">/liquid</a></li><li><a href="#">/security scan</a></li></ul>\`;
                    autocompletePanel.style.display = 'block';
                    autocompletePanel.style.position = 'absolute';
                    autocompletePanel.style.top = chatInput.offsetTop - autocompletePanel.offsetHeight + 'px';
                    autocompletePanel.style.left = chatInput.offsetLeft + 'px';
            
                    const listItems = autocompletePanel.querySelectorAll('li');
                    listItems.forEach((item) => {
                        item.addEventListener('click', () => {
                            const selectedItem = item.querySelector('a').textContent;
                            chatInput.value = selectedItem + ' ';
                            hideAutocompletePanel();
                        });
                    });
                }

                function hideAutocompletePanel() {
                    autocompletePanel.style.display = 'none';
                }
                
            </script>
        </body>
        </html>`;
    }
}