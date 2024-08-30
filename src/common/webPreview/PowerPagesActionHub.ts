/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { dataverseAuthentication } from '../../common/services/AuthenticationProvider';
import { ITelemetry } from '../OneDSLoggerTelemetry/telemetry/ITelemetry';

export class PowerPagesActionHub implements vscode.TreeDataProvider<PowerPagesNode> {

    private _onDidChangeTreeData: vscode.EventEmitter<PowerPagesNode | undefined | void> = new vscode.EventEmitter<PowerPagesNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<PowerPagesNode | undefined | void> = this._onDidChangeTreeData.event;

    getTreeItem(element: PowerPagesNode): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<PowerPagesNode[]> {
        return Promise.resolve(this.getNodes());
    }

    getNodes(): PowerPagesNode[] {
        const nodes: PowerPagesNode[] = [];
        const previewSiteInVsCode = new PowerPagesNode(vscode.l10n.t("Preview site VSCode"),
            {
                command: 'powerpages.powerPagesFileExplorer.openSpecificURLwithinVSCode',
                title: vscode.l10n.t("Preview site in VSCode"),
                arguments: []
            },
            'previewSite.svg');

        nodes.push(previewSiteInVsCode);
        return nodes;
    }

    openSpecificURLWithoutAuth(): void {
        const websitePreviewUrl = "https://site-wug4q.powerappsportals.com/";
        vscode.commands.executeCommand('simpleBrowser.show', vscode.Uri.parse(websitePreviewUrl));
    }

    async openSpecificURLWithAuth(telemetry: ITelemetry): Promise<void>{
        const websitePreviewUrl = "https://site-wug4q.powerappsportals.com/";  // update the site URL with your private site
        const dataverseOrgURL = 'https://orgf2f8b607.crm.dynamics.com/';

        try {
            const { accessToken } = await dataverseAuthentication(telemetry, dataverseOrgURL);
            await dataverseAuthentication(telemetry, dataverseOrgURL);

            if (accessToken) {
                await vscode.commands.executeCommand('simpleBrowser.show', vscode.Uri.parse(websitePreviewUrl), {
                    headers: {
                        "Authorization": `Bearer ${accessToken}`
                    }
                });
            } else {
                vscode.window.showErrorMessage('Failed to authenticate.');
            }
        } catch (exception) {
            const error = exception as Error;
            vscode.window.showErrorMessage('An error occurred: ' + error.message);
        }
    }
}

export class PowerPagesNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly command: vscode.Command,
        public readonly svgFileName: string
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);

        this.tooltip = this.label;
        this.command = command;
        this.iconPath = this.getIconPath(svgFileName);
    }

    getIconPath(svgFileName: string) {
        return {
            light: path.join(__filename, '..', '..', '..', '..', 'resources', svgFileName),
            dark: path.join(__filename, '..', '..', '..', '..', 'resources', svgFileName)
        };
    }
}
