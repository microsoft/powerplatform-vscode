/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { orgChangeEvent } from '../../client/OrgChangeNotifier';
import { ActiveOrgOutput } from '../../client/pac/PacTypes';
import { dataverseAuthentication } from '../services/AuthenticationProvider';
import TelemetryReporter from '@vscode/extension-telemetry';
import { ITelemetry } from '../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { getEntities, getEntityColumns } from '../copilot/dataverseMetadata';
import { PacWrapper } from '../../client/pac/PacWrapper';
import { SUCCESS } from '../constants';
import { createAuthProfileExp } from '../copilot/utils/copilotUtil';

export class FetchXmlQueryBuilderPanel {
    public static currentPanel: FetchXmlQueryBuilderPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private readonly _pacWrapper?: PacWrapper;
    private readonly _disposables: vscode.Disposable[] = [];
    private orgUrl = '';
    private telemetry: ITelemetry | TelemetryReporter;



    public static createOrShow(extensionUri: vscode.Uri, telementry: ITelemetry | TelemetryReporter, pacWrapper: PacWrapper) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        // If we already have a panel, show it.
        if (FetchXmlQueryBuilderPanel.currentPanel) {
            FetchXmlQueryBuilderPanel.currentPanel._panel.reveal(column);
            return;
        }

        // Otherwise, create a new panel.
        const panel = vscode.window.createWebviewPanel(
            'fetchXML-query-builder',
            'FetchXML Query Builder',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist')]
            }
        );

        FetchXmlQueryBuilderPanel.currentPanel = new FetchXmlQueryBuilderPanel(panel, extensionUri, telementry, pacWrapper);
    }


    constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, telemetry: ITelemetry, pacWrapper: PacWrapper) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this.telemetry = telemetry;
        this._pacWrapper = pacWrapper;

        // Call the async initialization method
        this.initialize();
    }

    private async initialize() {
        // Set the HTML content for the webview
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(this._handleMessage.bind(this));

        // Wait for handleOrgChange to complete
        await this.handleOrgChange();

        // Dispose of the panel when it's closed
        this._panel.onDidDispose(() => this.dispose(), null, []);

        this._disposables.push(
            orgChangeEvent((orgDetails: ActiveOrgOutput) => this.handleOrgChangeSuccess(orgDetails))
        );
    }

    private async handleOrgChange() {
        const pacOutput = await this._pacWrapper?.activeOrg();

        if (pacOutput && pacOutput.Status === SUCCESS) {
            this.handleOrgChangeSuccess(pacOutput.Results);
        } else if (this._panel.visible) {
            await createAuthProfileExp(this._pacWrapper)
        }
    }

    private handleOrgChangeSuccess(orgDetails: ActiveOrgOutput) {
        this.orgUrl = orgDetails.OrgUrl;
    }

    public dispose() {
        FetchXmlQueryBuilderPanel.currentPanel = undefined;
        this._panel.dispose();
    }

    private _getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>FetchXML Query Builder</title>
        </head>
        <body>
          <div id="root"></div>
          <script src="${scriptUri}"></script>
        </body>
        <script>
          window.addEventListener('load', () => {
            debugger;
            if (typeof FetchXmlQueryBuilder.renderApp === 'function') {
              FetchXmlQueryBuilder.renderApp('root');
            } else {
              console.error('renderApp is not defined.');
            }
          });
        </script>
        </html>`;
    }

    private async _handleMessage(message: any) {
        const webView = this._panel.webview;
        const orgUrl = this.orgUrl;
        switch (message.type) {
            case 'getEntities':
                {
                    const dataverseToken = (await dataverseAuthentication(this.telemetry, orgUrl, true)).accessToken;
                    const entities = await getEntities(orgUrl, dataverseToken, this.telemetry, '')
                    webView.postMessage({ type: 'getEntities', entities: entities });
                    break;
                }
            case 'getAttributes':
                {
                    const dataverseToken = (await dataverseAuthentication(this.telemetry, orgUrl, true)).accessToken;
                    const attributes = await getEntityColumns(message.entity, orgUrl, dataverseToken, this.telemetry, '')
                    webView.postMessage({ type: 'getAttributes', attributes: attributes })
                }
            // Add more cases to handle other message types
        }
    }
}
