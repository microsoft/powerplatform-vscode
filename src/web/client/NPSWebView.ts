/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export class NPSWebView  {
    private readonly _webviewPanel: vscode.WebviewPanel;

    private constructor(private readonly extensionUri:vscode.Uri,webViewPanel: vscode.WebviewPanel){
        this._webviewPanel = webViewPanel;
        this.show();
    }
    public show() {
		this._webviewPanel.webview.html = this.getHtml();
        // NPSWebView.resizeSurvey();
        // NPSWebView.applyCustomStyles();
	}

    
// private static resizeSurvey() {
//     // eslint-disable-next-line no-undef
//     const embedPopup = document.getElementById('MfpEmbed_Popup');
//     if (embedPopup) {
//       // eslint-disable-next-line no-undef
//       if (window.innerHeight <= 600) {
//         embedPopup.style.maxWidth = '80%';
//         embedPopup.style.height = '90%';
//       } else {
//         embedPopup.style.maxWidth = '420px';
//         embedPopup.style.height = '460px';
//       }
//     }
//   }

//   // Apply custom styles to modal div and exit button
// private static applyCustomStyles() {
//     // eslint-disable-next-line no-undef
//     const iconDiv = document.getElementById('mfpembed_iconDiv');
//     if (iconDiv) {
//       iconDiv.style.width = '21px';
//       iconDiv.style.height = '21px';
//       iconDiv.style.border = '0px';
//       iconDiv.style.right = '6px';
//       iconDiv.style.top = '6px';
//       iconDiv.style.position = 'absolute';
//       iconDiv.style.marginRight = '0';
//       iconDiv.style.marginTop = '0';
//       iconDiv.style.fontStyle = 'normal';
//       iconDiv.style.borderRadius = '50%';
//       iconDiv.style.borderColor = 'white';
//     }
  
//     // eslint-disable-next-line no-undef
//     const crossButtonDiv = document.getElementById('MfpEmbed_CrossButton');
//     if (crossButtonDiv) {
//       crossButtonDiv.setAttribute('src',cancel.toString());
//       crossButtonDiv.style.width = '14px';
//       crossButtonDiv.style.height = '14px';
//       crossButtonDiv.style.boxSizing = 'unset';
//       crossButtonDiv.style.cursor = 'pointer';
//     }
  
//     // eslint-disable-next-line no-undef
//     const iFrame = document.getElementById('MfpEmbed_Popup_Iframe');
//     if (iFrame) {
//       iFrame.style.borderRadius = '2px';
//       iFrame.addEventListener('load', () => {
//         iFrame.focus();
//         iFrame.setAttribute('tabindex', '1');
//       });
//       // TODO: Localization
//       if (!iFrame.hasAttribute('title')) {
//         iFrame.setAttribute('title','SurveyTile');
//       }
//       // TODO: Localization
//       if (!iFrame.hasAttribute('aria-label')) {
//         iFrame.setAttribute('aria-label', 'SurveyTile');
//       }
//     }
  
//     // eslint-disable-next-line no-undef
//     const closeButton = document.getElementById('MfpEmbed_CrossButton');
//     // eslint-disable-next-line no-undef
//     const embedPopup = document.getElementById('MfpEmbed_Popup');
//     if (closeButton) {
//       closeButton.setAttribute('tabindex', '1');
//       if (!closeButton.hasAttribute('alt')) {
//         // TODO: Localization
//         closeButton.setAttribute('alt', 'Close');
//       }
//       closeButton.addEventListener('focusout', () => {
//         embedPopup?.focus();
//         iFrame?.focus();
//       });
//       closeButton.addEventListener('keypress', () => {
//         closeButton.click();
//       });
//     }
//   }

    private getHtml() {
		const nonce = getNonce();
        const mainJs = this.extensionResourceUrl('media','main.js');
        console.log("biddisha mainjs"+mainJs);
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