/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export async function updateLaunchJsonConfig(url: string): Promise<void> {

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage(
            vscode.l10n.t('No workspace folder is open.'));
        return;
    }

    const launchJsonPath = vscode.Uri.joinPath(workspaceFolders[0].uri, '.vscode', 'launch.json');
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    } catch (e) {
        if(e instanceof Error) {
            vscode.window.showErrorMessage(
                vscode.l10n.t("Failed to update launch.json: ${0}", e.message));
        }
    }
}
