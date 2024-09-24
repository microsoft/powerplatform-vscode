/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { getNonce } from '../../../common/utilities/Utils';
import { Disposable } from '../../../common/utilities/dispose';

export enum NavEditCommands {
    DISABLE_BACK,
    ENABLE_BACK,
    DISABLE_FORWARD,
    ENABLE_FORWARD,
}

/**
 * @description the object responsible for communicating messages to the webview.
 */
export class RuntimePreview extends Disposable {
    public currentAddress: string; // encoded address

    constructor(
        private readonly _panel: vscode.WebviewPanel,
        private readonly _extensionUri: vscode.Uri,
        private readonly _runtimeUri: string,
    ) {
        super();
        this.currentAddress = _runtimeUri;

        this._panel.webview.postMessage({
            command: 'set-url',
            text: JSON.stringify({
                fullPath: this._runtimeUri,
                pathname: this._runtimeUri,
            }),
        });

        this._register(
            this._panel.webview.onDidReceiveMessage((message) =>
                this._handleWebviewMessage(message)
            )
        );

        this._panel.webview.html = this._getHtmlForWebview();
    }

    /**
     * @description generate the HTML to load in the webview; this will contain the full-page iframe with the hosted content,
     *  in addition to the top navigation bar.
     */
    private _getHtmlForWebview(): string {
        // Local path to main script run in the webview
        const scriptPathOnDisk = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'runtime.js'
        );

        // And the uri we use to load this script in the webview
        const scriptUri = this._panel.webview.asWebviewUri(scriptPathOnDisk);

        // Local path to css styles
        const stylesPathMainPath = vscode.Uri.joinPath(
            this._extensionUri,
            'media',
            'runtime.css'
        );
        const codiconsPathMainPath = vscode.Uri.joinPath(
            this._extensionUri,
            'src', 'common', 'copilot', 'assets', 'styles', 'codicon.css'
        );

        // Uri to load styles into webview
        const stylesMainUri = this._panel.webview.asWebviewUri(stylesPathMainPath);
        const codiconsUri = this._panel.webview.asWebviewUri(codiconsPathMainPath);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        const back = vscode.l10n.t('Back');
        const forward = vscode.l10n.t('Forward');
        const reload = vscode.l10n.t('Reload');
        const more = vscode.l10n.t('More Browser Actions');
        const find_prev = vscode.l10n.t('Previous');
        const find_next = vscode.l10n.t('Next');
        const find_x = vscode.l10n.t('Close');
        const browser_open = vscode.l10n.t('Open in Browser');
        const find = vscode.l10n.t('Find in Page');
        const devtools_open = vscode.l10n.t('Open Devtools Pane');

        return `<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta http-equiv="Content-type" content="text/html;charset=UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="
					default-src 'none';
					font-src ${this._panel.webview.cspSource};
					style-src ${this._panel.webview.cspSource};
					script-src 'nonce-${nonce}';
				">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${stylesMainUri}" rel="stylesheet">
				<link rel="stylesheet" type="text/css" href="${codiconsUri}">

				<title>${"Test [review"}</title>
			</head>
			<body>
			<div class="displayContents">
				<div class="header">
					<div class="headercontent">
						<nav class="controls">
							<button
								id="back"
								title="${back}"
								class="back-button icon leftmost-nav"><i class="codicon codicon-arrow-left"></i></button>
							<button
								id="forward"
								title="${forward}"
								class="forward-button icon leftmost-nav"><i class="codicon codicon-arrow-right"></i></button>
							<button
								id="reload"
								title="${reload}"
								class="reload-button icon leftmost-nav"><i class="codicon codicon-refresh"></i></button>
							<input
								id="url-input"
								class="url-input"
								type="text">
							<button
								id="more"
								title="${more}"
								class="more-button icon"><i class="codicon codicon-list-flat"></i></button>
						</nav>
						<div class="find-container" id="find-box" hidden=true>
							<nav class="find">
								<input
									id="find-input"
									class="find-input"
									type="text">
								<div
									id="find-result"
									class="find-result icon" hidden=true><i id="find-result-icon" class="codicon" ></i></div>
								<button
									id="find-prev"
									title="${find_prev}"
									class="find-prev-button icon find-nav"><i class="codicon codicon-chevron-up"></i></button>
								<button
									id="find-next"
									tabIndex=-1
									title="${find_next}"
									class="find-next-button icon find-nav"><i class="codicon codicon-chevron-down"></i></button>
								<button
									id="find-x"
									tabIndex=-1
									title="${find_x}"
									class="find-x-button icon find-nav"><i class="codicon codicon-chrome-close"></i></button>
							</nav>
						</div>
					</div>
					<div class="extras-menu" id="extras-menu-pane" hidden=true;>
						<table cellspacing="0" cellpadding="0">
							<tr>
								<td>
									<button tabIndex=-1
										id="browser-open" class="extra-menu-nav">${browser_open}</button>
								</td>
							</tr>
							<tr>
								<td>
									<button tabIndex=-1
										id="find" class="extra-menu-nav">${find}</button>
								</td>
							</tr>
							<tr>
								<td>
									<button tabIndex=-1
										id="devtools-open" class="extra-menu-nav">${devtools_open}</button>
								</td>
							</tr>
						</table>
					</div>
				</div>
				<div class="content">
                    <iframe id="hostedContent" src="${this._runtimeUri}" sandbox="allow-popups allow-top-navigation allow-scripts allow-same-origin" width="100%" height="100%" frameborder="0"></iframe>
				</div>
			</div>
			<div id="link-preview"></div>
            <script nonce="${nonce}">
                const WS_URL= "${"test url"}";
            </script>
            <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
		</html>`;
    }

    /**
     * @description handle messages from the webview (see messages sent from `media/main.js`).
     * @param {any} message the message from webview
     */
    private async _handleWebviewMessage(message: any): Promise<void> {
        switch (message.command) {
            case 'alert':
                vscode.window.showErrorMessage(message.text);
                return;
            case 'update-path': {
                // const msgJSON = JSON.parse(message.text);
                // this._webviewComm.handleNewPageLoad(
                //     msgJSON.path.pathname,
                //     this.currentConnection,
                //     msgJSON.title
                // );
                return;
            }
            case 'go-back':
                //await this._webviewComm.goBack();
                return;
            case 'go-forward':
                //await this._webviewComm.goForwards();
                return;
            case 'open-browser':
                //await this._openCurrentAddressInExternalBrowser();
                return;
            case 'add-history': {
                // const msgJSON = JSON.parse(message.text);
                // const connection = this._connectionManager.getConnectionFromPort(
                //     msgJSON.port
                // );
                // await this._webviewComm.setUrlBar(msgJSON.path, connection);
                return;
            }
            case 'refresh-back-forward-buttons':
                // this._webviewComm.updateForwardBackArrows();
                return;
            case 'go-to-file':
                // await this._goToFullAddress(message.text);
                return;

            case 'console': {
                // const msgJSON = JSON.parse(message.text);
                // this._handleConsole(msgJSON.type, msgJSON.data);
                return;
            }
            case 'devtools-open':
                vscode.commands.executeCommand(
                    'workbench.action.webview.openDeveloperTools'
                );
                return;
        }
    }
}
