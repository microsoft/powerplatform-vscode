/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ECSFeaturesClient } from '../../../common/ecs-features/ecsFeatureClient';
import { EnableSiteRuntimePreview } from '../../../common/ecs-features/ecsFeatureGates';
import { ITelemetry } from '../../../common/OneDSLoggerTelemetry/telemetry/ITelemetry';
import { WorkspaceFolder } from 'vscode-languageclient/node';
import { getWebsiteRecordId } from '../../../common/utilities/WorkspaceInfoFinderUtil';
import { PROVIDER_ID, ServiceEndpointCategory } from '../../../common/services/Constants';
import { PPAPIService } from '../../../common/services/PPAPIService';
import { VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY, VSCODE_EXTENSION_SITE_PREVIEW_ERROR } from '../../../common/services/TelemetryConstants';
import { EDGE_TOOLS_EXTENSION_ID } from '../../../common/constants';
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { getWorkspaceFolders, showProgressWithNotification } from '../../../common/utilities/Utils';
import { PacTerminal } from '../../lib/PacTerminal';
import { initializeOrgDetails } from '../../../common/utilities/OrgHandlerUtils';
import { ArtemisService } from '../../../common/services/ArtemisService';
import { Messages } from './Constants';
import { dataverseAuthentication } from '../../../common/services/AuthenticationProvider';
import { IOrgDetails } from '../../../common/chat-participants/powerpages/PowerPagesChatParticipantTypes';

export const SITE_PREVIEW_COMMAND_ID = "microsoft.powerplatform.pages.preview-site";

export class PreviewSite {
    private static _websiteUrl: string | undefined = undefined;

    static isSiteRuntimePreviewEnabled(): boolean {
        const enableSiteRuntimePreview = ECSFeaturesClient.getConfig(EnableSiteRuntimePreview).enableSiteRuntimePreview

        if (enableSiteRuntimePreview === undefined) {
            return false;
        }

        return enableSiteRuntimePreview;
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

    private static async promptInstallEdgeTools(): Promise<void> {
        const install = await vscode.window.showWarningMessage(
            Messages.EDGE_DEV_TOOLS_NOT_INSTALLED_MESSAGE,
            Messages.INSTALL,
            Messages.CANCEL
        );
        if (install === Messages.INSTALL) {
            await vscode.commands.executeCommand('workbench.extensions.search', EDGE_TOOLS_EXTENSION_ID);
        }
    }

    private static async launchBrowserAndDevToolsWithinVsCode(webSitePreviewURL: string | undefined): Promise<void> {
        if (!webSitePreviewURL || webSitePreviewURL === "") {
            return;
        }

        const edgeToolsExtension = vscode.extensions.getExtension(EDGE_TOOLS_EXTENSION_ID);

        if (!edgeToolsExtension) {
            await this.promptInstallEdgeTools();
            return;
        }

        await showProgressWithNotification(
            Messages.OPENING_SITE_PREVIEW,
            async () => {
                const settings = vscode.workspace.getConfiguration('vscode-edge-devtools');
                const currentDefaultUrl = await settings.get('defaultUrl');
                await settings.update('defaultUrl', webSitePreviewURL);
                await vscode.commands.executeCommand('vscode-edge-devtools.launch');
                await settings.update('defaultUrl', currentDefaultUrl);
            }
        );

        await vscode.window.showInformationMessage(Messages.PREVIEW_SHOWN_FOR_PUBLISHED_CHANGES);
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
            telemetry.sendTelemetryErrorEvent(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.SITE_PREVIEW_FEATURE_NOT_ENABLED });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.SITE_PREVIEW_FEATURE_NOT_ENABLED });
            await vscode.window.showInformationMessage(Messages.SITE_PREVIEW_FEATURE_NOT_ENABLED);
            return;
        }

        if (!vscode.workspace.workspaceFolders) {
            telemetry.sendTelemetryErrorEvent(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.NO_FOLDER_OPENED });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.NO_FOLDER_OPENED });
            await vscode.window.showErrorMessage(Messages.NO_FOLDER_OPENED);
            return;
        }

        if (this._websiteUrl === undefined) {
            telemetry.sendTelemetryErrorEvent(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.INITIALIZING_PREVIEW_TRY_AGAIN });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.INITIALIZING_PREVIEW_TRY_AGAIN });
            await vscode.window.showWarningMessage(Messages.INITIALIZING_PREVIEW_TRY_AGAIN);
            return;
        }

        let orgDetails: IOrgDetails | undefined = undefined;
        await showProgressWithNotification(
            Messages.INITIALIZING_PREVIEW,
            async (progress) => {
                progress.report({ message: Messages.GETTING_ORG_DETAILS });

                orgDetails = await initializeOrgDetails(false, pacTerminal.getWrapper());
            });

        if (!orgDetails) {
            telemetry.sendTelemetryErrorEvent(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.ORG_DETAILS_ERROR });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.ORG_DETAILS_ERROR });
            await vscode.window.showWarningMessage(Messages.ORG_DETAILS_ERROR);
            return;
        }

        if (this._websiteUrl === "") {
            let shouldRepeatLoginFlow = true;

            while (shouldRepeatLoginFlow) {
                shouldRepeatLoginFlow = await PreviewSite.handleEmptyWebsiteUrl(orgDetails, telemetry);
            }
        }

        await PreviewSite.clearCache(telemetry, orgDetails);

        await PreviewSite.launchBrowserAndDevToolsWithinVsCode(this._websiteUrl);
    }

    private static async clearCache(telemetry: ITelemetry, orgDetails: IOrgDetails): Promise<void> {
        if (!this._websiteUrl) {
            return;
        }

        const requestUrl = `${this._websiteUrl.endsWith('/') ? this._websiteUrl : this._websiteUrl.concat('/')}_services/cache/config`;

        await showProgressWithNotification(
            Messages.INITIALIZING_PREVIEW,
            async (progress) => {
                progress.report({ message: Messages.CLEARING_CACHE });

                const authResponse = await dataverseAuthentication(telemetry, orgDetails.orgUrl);

                const clearCacheResponse = await fetch(requestUrl, {
                    headers: {
                        authorization: "Bearer " + authResponse.accessToken,
                        'Accept': '*/*',
                        'Content-Type': 'text/plain',
                    },
                    method: 'DELETE'
                });

                if (!clearCacheResponse.ok) {
                    telemetry.sendTelemetryErrorEvent(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.UNABLE_TO_CLEAR_CACHE, response: await clearCacheResponse.json(), statusCode: clearCacheResponse.status.toString() });
                    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.UNABLE_TO_CLEAR_CACHE, response: await clearCacheResponse.json(), statusCode: clearCacheResponse.status.toString() });
                }
            }
        );

    }

    private static async handleEmptyWebsiteUrl(orgDetails: IOrgDetails, telemetry: ITelemetry): Promise<boolean> {
        const shouldInitiateLogin = await vscode.window.showErrorMessage(
            Messages.WEBSITE_NOT_FOUND_IN_ENVIRONMENT,
            Messages.LOGIN,
            Messages.CANCEL
        );

        let shouldRepeatLoginFlow = false;

        if (shouldInitiateLogin === Messages.LOGIN) {
            await vscode.authentication.getSession(PROVIDER_ID, [], { forceNewSession: true, clearSessionPreference: true });

            await showProgressWithNotification(
                Messages.INITIALIZING_PREVIEW,
                async (progress) => {
                    progress.report({ message: Messages.GETTING_REGION_INFORMATION });

                    const artemisResponse = await ArtemisService.getArtemisResponse(orgDetails.orgID, telemetry, "");

                    if (artemisResponse === null || artemisResponse.response === null) {
                        vscode.window.showErrorMessage(Messages.FAILED_TO_GET_ENDPOINT);
                        return;
                    }

                    progress.report({ message: Messages.GETTING_WEBSITE_ENDPOINT });

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
