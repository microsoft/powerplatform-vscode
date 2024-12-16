/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ECSFeaturesClient } from '../../common/ecs-features/ecsFeatureClient';
import { EnableSiteRuntimePreview } from '../../common/ecs-features/ecsFeatureGates';
import { ITelemetry } from '../../common/OneDSLoggerTelemetry/telemetry/ITelemetry';
import { WorkspaceFolder } from 'vscode-languageclient/node';
import { getWebsiteRecordId } from '../../common/utilities/WorkspaceInfoFinderUtil';
import { ServiceEndpointCategory } from '../../common/services/Constants';
import { PPAPIService } from '../../common/services/PPAPIService';
import { VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY } from '../../common/services/TelemetryConstants';
import { EDGE_TOOLS_EXTENSION_ID } from '../../common/constants';
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { showProgressNotification } from '../../common/controls/ShowProgressNotification';

export const SITE_PREVIEW_COMMAND_ID = "microsoft.powerplatform.pages.preview-site";

export class PreviewSite {
    static isSiteRuntimePreviewEnabled(): boolean {
        const enableSiteRuntimePreview = ECSFeaturesClient.getConfig(EnableSiteRuntimePreview).enableSiteRuntimePreview

        if (enableSiteRuntimePreview === undefined) {
            return false;
        }

        return enableSiteRuntimePreview;
    }

    static async getWebSiteURL(workspaceFolders: WorkspaceFolder[], stamp: ServiceEndpointCategory, envId: string, telemetry: ITelemetry): Promise<string> {
        const websiteRecordId = getWebsiteRecordId(workspaceFolders, telemetry);
        if (!websiteRecordId) {
            telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY, {
                websiteRecordId: websiteRecordId
            });
            return "";
        }
        const websiteDetails = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(stamp, envId, websiteRecordId, telemetry);
        return websiteDetails?.websiteUrl || "";
    }

    static async launchBrowserAndDevToolsWithinVsCode(webSitePreviewURL: string | undefined): Promise<void> {
        if (!webSitePreviewURL || webSitePreviewURL === "") {
            return;
        }

        const edgeToolsExtension = vscode.extensions.getExtension(EDGE_TOOLS_EXTENSION_ID);

        if (!edgeToolsExtension) {
            const install = await vscode.window.showWarningMessage(
                vscode.l10n.t(
                    `The extension Microsoft Edge Tools is required to run this command. Do you want to install it now?`
                ),
                vscode.l10n.t('Install'),
                vscode.l10n.t('Cancel')
            );

            if (install === vscode.l10n.t('Install')) {
                await vscode.commands.executeCommand('workbench.extensions.search', EDGE_TOOLS_EXTENSION_ID);
            }

            return;
        }

        const settings = vscode.workspace.getConfiguration('vscode-edge-devtools');
        const currentDefaultUrl = await settings.get('defaultUrl');
        await settings.update('defaultUrl', webSitePreviewURL);
        await vscode.commands.executeCommand('vscode-edge-devtools-view.launch');
        await settings.update('defaultUrl', currentDefaultUrl);
    }

    static async handlePreviewRequest(isSiteRuntimePreviewEnabled: boolean, websiteURL: string | undefined, telemetry: ITelemetry) {
        telemetry.sendTelemetryEvent("StartCommand", {
            commandId: SITE_PREVIEW_COMMAND_ID,
        });
        oneDSLoggerWrapper.getLogger().traceInfo("StartCommand", {
            commandId: SITE_PREVIEW_COMMAND_ID
        });

        if (!isSiteRuntimePreviewEnabled) {
            await vscode.window.showInformationMessage(vscode.l10n.t("Site runtime preview feature is not enabled."));
            return;
        }

        if (!vscode.workspace.workspaceFolders) {
            await vscode.window.showErrorMessage(vscode.l10n.t("No workspace folder opened. Please open a site folder to preview."));
            return;
        }

        if (!websiteURL || websiteURL === "") {
            await vscode.window.showErrorMessage(vscode.l10n.t("Website URL not found."));
            return;
        }

        await showProgressNotification(
            vscode.l10n.t('Opening site preview...'),
            async () => await PreviewSite.launchBrowserAndDevToolsWithinVsCode(websiteURL)
        );
    }
}
