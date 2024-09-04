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

    openSpecificURLWithoutAuth(context: vscode.ExtensionContext): void {
        const websitePreviewUrl = "https://site-wug4q.powerappsportals.com/"; //public site
        //const websitePreviewUrl = "https://site-nwz9m.powerappsportals.com/"; //private site
        // const browserLiteExtensionId = 'antfu.browse-lite';
        // const browserLiteExtension = vscode.extensions.getExtension(browserLiteExtensionId);

        // if (browserLiteExtension) {
        //     if (browserLiteExtension.isActive) {
        //         vscode.commands.executeCommand('browse-lite.open', websitePreviewUrl);
        //     } else {
        //         browserLiteExtension.activate().then(() => {
        //             vscode.commands.executeCommand('browse-lite.open', websitePreviewUrl);
        //         });
        //     }
        // } else {
        //     vscode.window.showErrorMessage('Browser Lite extension is not installed.');
        // }
        context;
        const edgeToolsExtensionId = 'ms-edgedevtools.vscode-edge-devtools';
        const edgeToolsExtension = vscode.extensions.getExtension(edgeToolsExtensionId);

        if (edgeToolsExtension) {
            if (edgeToolsExtension.isActive) {
                // vscode.commands.executeCommand('vscode-edge-devtools-view.launchConfigureJson');
                // vscode.commands.executeCommand('vscode-edge-devtools.launch');
                this.updateLaunchJsonConfig(websitePreviewUrl).then(() => {
                    vscode.commands.executeCommand('vscode-edge-devtools.launch');
                });
            } else {
                edgeToolsExtension.activate().then(() => {
                    vscode.commands.executeCommand('vscode-edge-devtools.launch', context , vscode.Uri.parse(websitePreviewUrl));
                });
            }
        } else {
            vscode.window.showErrorMessage('Ms Edge Tools extension is not installed.');
        }

    }

    async updateLaunchJsonConfig(url: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace folder is open.');
            return;
        }

        const launchJsonPath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.vscode', 'launch.json');
try {
    let launchJson: any;
    let launchJsonDoc: vscode.TextDocument | undefined;

        try {
            launchJsonDoc = await vscode.workspace.openTextDocument(launchJsonPath);
            const launchJsonText = launchJsonDoc.getText();
            launchJson = launchJsonText ? JSON.parse(launchJsonText) : { version: '0.2.0', configurations: [] };
        } catch (error) {
            // If the file does not exist or is empty, initialize it
            launchJson = { version: '0.2.0', configurations: [] };
        }

        // Update or add the configuration for Edge DevTools
        const edgeConfig = launchJson.configurations.find((config: any) => config.type === 'edge');
        if (edgeConfig) {
            edgeConfig.url = url;
        } else {
            launchJson.configurations.push({
                type: 'edge',
                request: 'launch',
                name: 'Launch Edge DevTools',
                url: url,
                webRoot: "${workspaceFolder}"
            });
        }

        // Write the updated launch.json back to the file
        const edit = new vscode.WorkspaceEdit();
        const launchJsonContent = JSON.stringify(launchJson, null, 4);
        if (launchJsonDoc) {
            edit.replace(launchJsonPath, new vscode.Range(0, 0, launchJsonDoc.lineCount, 0), launchJsonContent);
        } else {
            edit.createFile(launchJsonPath, { overwrite: true });
            edit.insert(launchJsonPath, new vscode.Position(0, 0), launchJsonContent);
        }
        await vscode.workspace.applyEdit(edit);
        if (launchJsonDoc) {
            await launchJsonDoc.save();
        }
        } catch (exception) {
            const error = exception as Error;
            vscode.window.showErrorMessage('Failed to update launch.json: ' + error.message);
        }
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
