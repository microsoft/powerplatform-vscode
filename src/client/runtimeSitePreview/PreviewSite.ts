/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { updateLaunchJsonConfig } from './LaunchJsonHelper';
import { ECSFeaturesClient } from '../../common/ecs-features/ecsFeatureClient';
import { EnableSiteRuntimePreview } from '../../common/ecs-features/ecsFeatureGates';
import { ITelemetry } from '../../common/OneDSLoggerTelemetry/telemetry/ITelemetry';
import { WorkspaceFolder } from 'vscode-languageclient/node';
import { getWebsiteRecordID } from '../../common/utilities/WorkspaceInfoFinderUtil';
import { ServiceEndpointCategory } from '../../common/services/Constants';
import { PPAPIService } from '../../common/services/PPAPIService';

export class PreviewSite {

    static isSiteRuntimePreviewEnabled(): boolean {
        const enableSiteRuntimePreview = ECSFeaturesClient.getConfig(EnableSiteRuntimePreview).enableSiteRuntimePreview

        if(enableSiteRuntimePreview === undefined) {
            return false;
        }

        return enableSiteRuntimePreview;
    }

    static async getWebSiteURL(workspaceFolders: WorkspaceFolder[], stamp: ServiceEndpointCategory, envId: string, telemetry: ITelemetry): Promise<string> {

        const websiteRecordId = getWebsiteRecordID(workspaceFolders, telemetry);
        const websiteDetails = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(stamp, envId, websiteRecordId, telemetry);
        return websiteDetails?.websiteUrl || "";
    }

    static async launchBrowserAndDevToolsWithinVsCode(webSitePreviewURL: string | undefined): Promise<void> {

        // The desired website preview URL
        if (!webSitePreviewURL) {
            webSitePreviewURL = "https://site-ael6h.powerappsportals.com/"; //private site
        }

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

            await updateLaunchJsonConfig(webSitePreviewURL);


            try {
                // Add a 2-second delay before executing the launchProject command
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Polling mechanism to check if the launch.json file has been created
                //await this.waitForFileCreation(launchJsonPath);
                await vscode.commands.executeCommand('vscode-edge-devtools-view.launchProject');


            } finally {
                // Revert the changes made to the launch.json file and remove the .vscode folder if it was created
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Event listener to detect when the Edge DevTools extension is closed
                //await this.waitForExtensionClosure(edgeToolsExtensionId);
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
                vscode.l10n.t(
                `The extension "${edgeToolsExtensionId}" is required to run this command. Do you want to install it now?`,
                'Install', 'Cancel'
            ));

            if (install === 'Install') {
                // Open the Extensions view with the specific extension
                vscode.commands.executeCommand('workbench.extensions.search', edgeToolsExtensionId);
            }

            return;
        }
    }

    static async waitForFileCreation(filePath: string | null): Promise<void> {
        if (!filePath) return;

        const timeout = 10000; // 10 seconds
        const interval = 100; // 100 milliseconds
        let elapsed = 0;

        while (elapsed < timeout) {
            if (fs.existsSync(filePath)) {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
            elapsed += interval;
        }

        throw new Error(`File ${filePath} was not created within the timeout period.`);
    }

    static async waitForExtensionClosure(extensionId: string): Promise<void> {
        return new Promise<void>((resolve) => {
            const checkInterval = setInterval(() => {
                const extension = vscode.extensions.getExtension(extensionId);
                if (!extension || !extension.isActive) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    }
}
