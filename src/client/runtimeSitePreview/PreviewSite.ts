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

    static async launchBrowserAndDevToolsWithinVsCode(webSitePreviewURL: string): Promise<void> {

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
                // Added a 2-second delay before executing the launchProject command to handle the case where the launch.json file is not saved yet
                await new Promise(resolve => setTimeout(resolve, 2000));
                await vscode.commands.executeCommand('vscode-edge-devtools-view.launchProject');

            } finally {
                // Revert the changes made to the launch.json file and remove the .vscode folder if it was created

                // Added a 2-second delay to ensure that debug session is closed and then launch.json file is removed
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
}
