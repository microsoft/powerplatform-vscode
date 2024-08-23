/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';

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

    async openSpecificURL(): Promise<void> {
        const livePreviewExtension = vscode.extensions.getExtension('ms-vscode.live-server');
        const websitePreviewUrl = "https://wikipedia.com/";
        if (livePreviewExtension) {
            if (!livePreviewExtension.isActive) {
                await livePreviewExtension.activate();
            }
            try {
                await vscode.commands.executeCommand('livePreview.start', vscode.Uri.parse(websitePreviewUrl));
                await vscode.commands.executeCommand('livePreview.start.internalPreview.atFile', vscode.Uri.parse(websitePreviewUrl));
            } catch (error) {
                console.error('Failed to execute Live Preview command:', error);
                vscode.window.showErrorMessage('Failed to start Live Preview server.');
            }
        } else {
            vscode.window.showErrorMessage('Live Preview extension is not installed or activated.');
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
