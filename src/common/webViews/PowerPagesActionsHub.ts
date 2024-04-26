/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';

export class PowerPagesActionsHub implements vscode.TreeDataProvider<PowerPagesNode> {

    private _onDidChangeTreeData: vscode.EventEmitter<PowerPagesNode | undefined | void> = new vscode.EventEmitter<PowerPagesNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<PowerPagesNode | undefined | void> = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PowerPagesNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PowerPagesNode): Thenable<PowerPagesNode[]> {
        if (element) {
            return Promise.resolve(this.getNodes(path.join(element.label)));
        } else {
            return Promise.resolve(this.getNodes());
        }
    }

    getNodes(label?: string): PowerPagesNode[] {
        const nodes: PowerPagesNode[] = [];
        const previewPowerPage = new PowerPagesNode(vscode.l10n.t("Preview site"),
            {
                command: 'powerpages.powerPagesFileExplorer.powerPagesRuntimePreview',
                title: vscode.l10n.t("Preview site"),
                arguments: []
            },
            'previewSite.svg');
        const backToStudio = new PowerPagesNode(vscode.l10n.t("Open in Power Pages studio"),
            {
                command: 'powerpages.powerPagesFileExplorer.backToStudio',
                title: vscode.l10n.t("Open in Power Pages studio"),
                arguments: []
            },
            'powerPages.svg');

        if (label && label === previewPowerPage.label) {
            nodes.push(previewPowerPage);
        } else if (label && label === backToStudio.label) {
            nodes.push(backToStudio);
        } else {
            nodes.push(previewPowerPage);
            nodes.push(backToStudio);
        }

        return nodes;
    }

    async previewPowerPageSite(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'powerPagesPreview',
            'Power Pages Preview',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            overflow: hidden;
                        }
                        iframe {
                            height: 100vh;
                            width: 100vw;
                        }
                    </style>
                </head>
                <body>
                    <iframe src="https://site-ka6r6.powerappsportals.com/"/>
                </body>
            </html>
        `;

        panel.reveal();
    }

    backToStudio(): void {
        // const backToStudioUrl = "https://w3schools.com";
        // vscode.env.openExternal(vscode.Uri.parse(backToStudioUrl));

        vscode.window.showInformationMessage("Not implemented");
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
