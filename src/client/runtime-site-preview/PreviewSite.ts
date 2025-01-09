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
import { PROVIDER_ID, ServiceEndpointCategory } from '../../common/services/Constants';
import { PPAPIService } from '../../common/services/PPAPIService';
import { VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY } from '../../common/services/TelemetryConstants';
import { EDGE_TOOLS_EXTENSION_ID } from '../../common/constants';
import { oneDSLoggerWrapper } from "../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { getWorkspaceFolders, showProgressWithNotification } from '../../common/utilities/Utils';
import { PacTerminal } from '../lib/PacTerminal';
import { initializeOrgDetails } from '../../common/utilities/OrgHandlerUtils';
import { ArtemisService } from '../../common/services/ArtemisService';

export const SITE_PREVIEW_COMMAND_ID = "microsoft.powerplatform.pages.preview-site";

export class PreviewSite {
    private static _websiteUrl: string | undefined = undefined;

    static isSiteRuntimePreviewEnabled(): boolean {
        const enableSiteRuntimePreview = ECSFeaturesClient.getConfig(EnableSiteRuntimePreview).enableSiteRuntimePreview

        if (enableSiteRuntimePreview === undefined) {
            return false;
        }

        return true;
    }

    static async loadSiteUrl(
        workspaceFolders: WorkspaceFolder[],
        stamp: ServiceEndpointCategory,
        envId: string,
        telemetry: ITelemetry)
        : Promise<void> {
        const websiteUrl = await PreviewSite.getWebSiteUrl(workspaceFolders, stamp, envId, telemetry);

        this._websiteUrl = websiteUrl;
    }

    static getSiteUrl(): string | undefined {
        return this._websiteUrl;
    }

    private static async getWebSiteUrl(workspaceFolders: WorkspaceFolder[], stamp: ServiceEndpointCategory, envId: string, telemetry: ITelemetry): Promise<string> {
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

        await showProgressWithNotification(
            vscode.l10n.t('Opening site preview...'),
            async () => {
                const settings = vscode.workspace.getConfiguration('vscode-edge-devtools');
                const currentDefaultUrl = await settings.get('defaultUrl');
                await settings.update('defaultUrl', webSitePreviewURL);
                await vscode.commands.executeCommand('vscode-edge-devtools-view.launch');
                await settings.update('defaultUrl', currentDefaultUrl);
            }
        );

        await vscode.window.showInformationMessage(vscode.l10n.t('The preview shown is for published changes.'));
    }

    static async handlePreviewRequest(
        isSiteRuntimePreviewEnabled: boolean,
        telemetry: ITelemetry,
        pacTerminal: PacTerminal) {

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

        if (this._websiteUrl === undefined) {
            await vscode.window.showWarningMessage(vscode.l10n.t("Initializing site preview. Please try again after few seconds."));
            return;
        }

        if (this._websiteUrl === "") {
            let shouldRepeatLoginFlow = true;

            while (shouldRepeatLoginFlow) {
                shouldRepeatLoginFlow = await PreviewSite.handleEmptyWebsiteUrl(pacTerminal, telemetry);
            }
        }

        await PreviewSite.launchBrowserAndDevToolsWithinVsCode(this._websiteUrl);
    }

    private static async handleEmptyWebsiteUrl(pacTerminal: PacTerminal, telemetry: ITelemetry): Promise<boolean> {
        const shouldInitiateLogin = await vscode.window.showErrorMessage(
            vscode.l10n.t(
                `Website not found in the environment. Please check the credentials and login with correct account.`
            ),
            vscode.l10n.t('Login'),
            vscode.l10n.t('Cancel')
        );

        let shouldRepeatLoginFlow = false;

        if (shouldInitiateLogin === vscode.l10n.t('Login')) {
            await vscode.authentication.getSession(PROVIDER_ID, [], { forceNewSession: true, clearSessionPreference: true });

            await showProgressWithNotification(
                vscode.l10n.t('Initializing site preview'),
                async (progress) => {
                    progress.report({ message: vscode.l10n.t('Getting org details...') });

                    const orgDetails = await initializeOrgDetails(false, pacTerminal.getWrapper());

                    progress.report({ message: vscode.l10n.t('Getting region information...') });

                    const artemisResponse = await ArtemisService.getArtemisResponse(orgDetails.orgID, telemetry, "");

                    if (artemisResponse === null || artemisResponse.response === null) {
                        vscode.window.showErrorMessage(vscode.l10n.t("Failed to get website endpoint. Please try again later"));
                        return;
                    }

                    progress.report({ message: vscode.l10n.t('Getting website endpoint...') });

                    const websiteUrl = await PreviewSite.getWebSiteUrl(getWorkspaceFolders(), artemisResponse?.stamp, orgDetails.environmentID, telemetry);

                    if (websiteUrl === "") {
                        shouldRepeatLoginFlow = true;
                    }
                    else {
                        this._websiteUrl = websiteUrl;
                    }
                }
            );
        }

        return shouldRepeatLoginFlow;
    }
}
