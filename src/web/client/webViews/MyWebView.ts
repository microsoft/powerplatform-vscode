/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// import * as vscode from "vscode";
// import WebExtensionContext from "../WebExtensionContext";
// import TinyliciousClient from "@fluidframework/tinylicious-client";

// export class MyWebview {
//     private panel!: vscode.WebviewPanel;
//     private extensionUri: vscode.Uri;

//     constructor(extensionUri: vscode.Uri) {
//         this.extensionUri = extensionUri;
//     }

//     public async show() {
//         if (this.panel) {
//             this.panel.reveal(vscode.ViewColumn.One);
//         } else {
//             this.panel = vscode.window.createWebviewPanel(
//                 "myWebview",
//                 "My Webview",
//                 vscode.ViewColumn.One,
//                 {
//                     enableScripts: true,
//                     localResourceRoots: [this.extensionUri],
//                 }
//             );

//             // Load the HTML content for the webview
//             this.panel.webview.html = this.getWebviewContent();
//             WebExtensionContext.setTinyClient = new TinyliciousClient();
//         }
//     }

//     private getWebviewContent() {
//         // Load your HTML content here
//         // You can use `this.extensionUri` to reference files in your extension's directory
//         return `
//       <html>
//         <head>
//           <meta charset="UTF-8">
//           <meta name="viewport" content="width=device-width, initial-scale=1.0">
//           <title>My Webview</title>
//         </head>
//         <body>
//           <h1>Welcome to my webview!</h1>
//           <button id="request-button">Send request to host extension</button>
//           <script>
//             const vscode = acquireVsCodeApi();

//             const requestButton = document.getElementById('request-button');
//             requestButton.addEventListener('click', () => {
//               vscode.postMessage({
//                 type: 'request',
//               });
//             });

//             window.addEventListener('message', (event) => {
//               const message = event.data;
//               if (message.type === 'response') {
//                 alert(message.payload);
//               } else {
//                 console.error(\`Unknown message type: \${message.type}\`);
//               }
//             });
//           </script>
//         </body>
//       </html>
//     `;
//     }
// }
