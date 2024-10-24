/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

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
        const previewSiteInVsCode = new PowerPagesNode(vscode.l10n.t("Preview site in VSCode"),
            {
                command: 'powerpages.powerPagesFileExplorer.openSpecificURLwithinVSCode',
                title: vscode.l10n.t("Preview site in VSCode"),
                arguments: []
            },
            'previewSite.svg');

        nodes.push(previewSiteInVsCode);
        return nodes;
    }


    private unsavedChanges: Set<string> = new Set();

    constructor() {
        // Watch for file changes
        vscode.workspace.onDidChangeTextDocument((event) => {
            const document = event.document;
            const filePath = document.uri.fsPath;

            this.unsavedChanges.add(filePath);
        });

        // Watch for file saves
        vscode.workspace.onDidSaveTextDocument((document) => {
            const filePath = document.uri.fsPath;

            if (this.unsavedChanges.has(filePath)) {
                this.unsavedChanges.delete(filePath);
            }
        });

        // Watch for terminal output to detect pac upload command
        // vscode.window.onDidWriteTerminalData((event) => {
        //     const terminalData = event.data;

        //     if (terminalData.includes('pac pages upload')) {
        //         this.handlePacUploadCommand();
        //     }
        // });
    }
    // Function to handle pac upload command
    // private handlePacUploadCommand(): void {
    //     // Clear the unsaved changes set
    //     this.unsavedChanges.clear();
    //     vscode.window.showInformationMessage('Changes have been uploaded successfully.');
    // }

    // Function to check for unsaved changes before executing a command
    async checkForUnsavedChangesAndExecute(command: () => void): Promise<void> {
        if (this.unsavedChanges.size > 0) {
            const result = await vscode.window.showWarningMessage(
                'There are some changes. Kindly upload them from terminal within VSCode ?',
                'Ok',
                'Nahh, I will do it later'
            );

            if (result === 'Ok') {
                // Save all documents
                await vscode.workspace.saveAll();
            } else {
                await vscode.window.showInformationMessage('Preview site in VSCode command has been cancelled.');
                return;
            }
        }

        // Execute the command
        command();
    }

    async openSpecificURLWithoutAuth(): Promise<void> {

        // The desired website preview URL
        const websitePreviewUrl = "https://site-ael6h.powerappsportals.com/"; // private site

        const edgeToolsExtensionId = 'ms-edgedevtools.vscode-edge-devtools';
        const edgeToolsExtension = vscode.extensions.getExtension(edgeToolsExtensionId);

        if (edgeToolsExtension) {
            // Preserve the original state of the launch.json file and .vscode folder
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            const vscodeFolderPath = workspaceFolder ? path.join(workspaceFolder.uri.fsPath, '.vscode') : null;
            const launchJsonPath = vscodeFolderPath ? path.join(vscodeFolderPath, 'launch.json') : null;
            let originalLaunchJsonContent: string | null = null;
            let vscodeFolderExisted = false;

            if (vscodeFolderPath && fs.existsSync(vscodeFolderPath)) {
                vscodeFolderExisted = true;
                if (launchJsonPath && fs.existsSync(launchJsonPath)) {
                    originalLaunchJsonContent = fs.readFileSync(launchJsonPath, 'utf8');
                }
            }

            await this.updateLaunchJsonConfig(websitePreviewUrl);

            try {
                // Add a 2-second delay before executing the launchProject command
                await new Promise(resolve => setTimeout(resolve, 2000));
                await this.checkForUnsavedChangesAndExecute(async () => {
                    await vscode.commands.executeCommand('vscode-edge-devtools-view.launchProject');
                });
            } finally {
                // Revert the changes made to the launch.json file and remove the .vscode folder if it was created
                await new Promise(resolve => setTimeout(resolve, 2000));
                if (launchJsonPath) {
                    if (originalLaunchJsonContent !== null) {
                        fs.writeFileSync(launchJsonPath, originalLaunchJsonContent, 'utf8');
                    } else if (fs.existsSync(launchJsonPath)) {
                        fs.unlinkSync(launchJsonPath);
                    }
                }

                if (vscodeFolderPath && !vscodeFolderExisted && fs.existsSync(vscodeFolderPath)) {
                    const files = fs.readdirSync(vscodeFolderPath);
                    if (files.length === 0) {
                        fs.rmdirSync(vscodeFolderPath);
                    }
                }
            }
        } else {
            const install = await vscode.window.showWarningMessage(
                `The extension "${edgeToolsExtensionId}" is required to run this command. Do you want to install it now?`,
                'Install', 'Cancel'
            );

            if (install === 'Install') {
                // Open the Extensions view with the specific extension
                vscode.commands.executeCommand('workbench.extensions.search', edgeToolsExtensionId);
            }

            return;
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
                launchJson = launchJsonText ? JSON.parse(launchJsonText) : { configurations: [], compounds: [] };
            } catch (error) {
                // If the file does not exist or is empty, initialize it
                launchJson = { configurations: [], compounds: [] };
            }

            // Update or add the configurations for Microsoft Edge
            const edgeConfigurations = [
                {
                    type: 'pwa-msedge',
                    name: 'Launch Microsoft Edge',
                    request: 'launch',
                    runtimeArgs: ['--remote-debugging-port=9222'],
                    url: url,
                    presentation: {
                        hidden: true
                    }
                },
                {
                    type: 'pwa-msedge',
                    name: 'Launch Microsoft Edge in headless mode',
                    request: 'launch',
                    runtimeArgs: ['--headless', '--remote-debugging-port=9222'],
                    url: url,
                    presentation: {
                        hidden: true
                    }
                },
                {
                    type: 'vscode-edge-devtools.debug',
                    name: 'Open Edge DevTools',
                    request: 'attach',
                    url: url,
                    presentation: {
                        hidden: true
                    }
                }
            ];

            // Update or add the compounds for Microsoft Edge
            const edgeCompounds = [
                {
                    name: 'Launch Edge Headless and attach DevTools',
                    configurations: ['Launch Microsoft Edge in headless mode', 'Open Edge DevTools']
                },
                {
                    name: 'Launch Edge and attach DevTools',
                    configurations: ['Launch Microsoft Edge', 'Open Edge DevTools']
                }
            ];

            // Merge the new configurations and compounds with the existing ones
            launchJson.configurations = [...launchJson.configurations, ...edgeConfigurations];
            launchJson.compounds = [...launchJson.compounds, ...edgeCompounds];

            // Write the updated launch.json file
            const launchJsonContent = JSON.stringify(launchJson, null, 4);
            await vscode.workspace.fs.writeFile(launchJsonPath, Buffer.from(launchJsonContent, 'utf8'));
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to update launch.json: ${error.message}`);
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
