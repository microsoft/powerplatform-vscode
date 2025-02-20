/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ECSFeaturesClient } from '../../../common/ecs-features/ecsFeatureClient';
import { EnableSiteRuntimePreview } from '../../../common/ecs-features/ecsFeatureGates';
import { WorkspaceFolder } from 'vscode-languageclient/node';
import { getWebsiteRecordId } from '../../../common/utilities/WorkspaceInfoFinderUtil';
import { PROVIDER_ID } from '../../../common/services/Constants';
import { PPAPIService } from '../../../common/services/PPAPIService';
import { VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY, VSCODE_EXTENSION_SITE_PREVIEW_ERROR } from '../../../common/services/TelemetryConstants';
import { EDGE_TOOLS_EXTENSION_ID } from '../../../common/constants';
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { getWorkspaceFolders, showProgressWithNotification } from '../../../common/utilities/Utils';
import { Events, Messages } from './Constants';
import { dataverseAuthentication } from '../../../common/services/AuthenticationProvider';
import PacContext from '../../pac/PacContext';
import ArtemisContext from '../../ArtemisContext';

export const SITE_PREVIEW_COMMAND_ID = "microsoft.powerplatform.pages.preview-site";

export class PreviewSite {
    private static _websiteUrl: string | undefined = undefined;
    private static _isInitialized = false;


    static isSiteRuntimePreviewEnabled(): boolean {
        const enableSiteRuntimePreview = ECSFeaturesClient.getConfig(EnableSiteRuntimePreview).enableSiteRuntimePreview

        if (enableSiteRuntimePreview === undefined) {
            return false;
        }

        return enableSiteRuntimePreview;
    }

    static async initialize(context: vscode.ExtensionContext, workspaceFolders: WorkspaceFolder[]): Promise<void> {
        if (PreviewSite._isInitialized) {
            return;
        }

        try {
            const isSiteRuntimePreviewEnabled = PreviewSite.isSiteRuntimePreviewEnabled();

            oneDSLoggerWrapper.getLogger().traceInfo("EnableSiteRuntimePreview", {
                isEnabled: isSiteRuntimePreviewEnabled.toString()
            });

            const artemisResponse = ArtemisContext.ServiceResponse;
            const orgDetails = PacContext.OrgInfo;

            if (artemisResponse && orgDetails && isSiteRuntimePreviewEnabled) {
                PacContext.onChanged(async () => await PreviewSite.loadSiteUrl(workspaceFolders));

                context.subscriptions.push(
                    vscode.commands.registerCommand(
                        SITE_PREVIEW_COMMAND_ID,
                        async () => await PreviewSite.handlePreviewRequest()
                    )
                );

                await PreviewSite.loadSiteUrl(workspaceFolders);
                await vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.siteRuntimePreviewEnabled", true);
            }

            PreviewSite._isInitialized = true;
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Events.PREVIEW_SITE_INITIALIZATION_FAILED, exceptionError.message, exceptionError);
        }
    }

    static async loadSiteUrl(workspaceFolders: WorkspaceFolder[]): Promise<void> {
        const websiteUrl = await PreviewSite.getWebSiteUrl(workspaceFolders);

        this._websiteUrl = websiteUrl;
    }

    private static async getWebSiteUrl(workspaceFolders: WorkspaceFolder[]): Promise<string> {
        const websiteRecordId = getWebsiteRecordId(workspaceFolders);
        if (!websiteRecordId) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY, {
                websiteRecordId: websiteRecordId
            });
            return "";
        }

        const orgDetails = PacContext.OrgInfo;

        if (!orgDetails) {
            return "";
        }

        const websiteDetails = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(ArtemisContext.ServiceResponse.stamp, orgDetails.EnvironmentId, websiteRecordId);
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

    public static async launchBrowserAndDevToolsWithinVsCode(webSitePreviewURL: string | undefined): Promise<void> {
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
            async () => await vscode.commands.executeCommand('vscode-edge-devtools.launch', { launchUrl: webSitePreviewURL })
        );

        await vscode.window.showInformationMessage(Messages.PREVIEW_SHOWN_FOR_PUBLISHED_CHANGES);
    }

    static async handlePreviewRequest() {

        oneDSLoggerWrapper.getLogger().traceInfo("StartCommand", {
            commandId: SITE_PREVIEW_COMMAND_ID
        });

        if (!PreviewSite.isSiteRuntimePreviewEnabled()) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.SITE_PREVIEW_FEATURE_NOT_ENABLED });
            await vscode.window.showInformationMessage(Messages.SITE_PREVIEW_FEATURE_NOT_ENABLED);
            return;
        }

        if (!vscode.workspace.workspaceFolders) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.NO_FOLDER_OPENED });
            await vscode.window.showErrorMessage(Messages.NO_FOLDER_OPENED);
            return;
        }

        if (this._websiteUrl === undefined) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.INITIALIZING_PREVIEW_TRY_AGAIN });
            await vscode.window.showWarningMessage(Messages.INITIALIZING_PREVIEW_TRY_AGAIN);
            return;
        }

        const orgDetails = PacContext.OrgInfo;

        if (!orgDetails) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.ORG_DETAILS_ERROR });
            await vscode.window.showWarningMessage(Messages.ORG_DETAILS_ERROR);
            return;
        }

        if (this._websiteUrl === "") {
            let shouldRepeatLoginFlow = true;

            while (shouldRepeatLoginFlow) {
                shouldRepeatLoginFlow = await PreviewSite.handleEmptyWebsiteUrl();
            }
        }

        await PreviewSite.clearCache(this._websiteUrl);

        await PreviewSite.launchBrowserAndDevToolsWithinVsCode(this._websiteUrl);
    }

    public static async clearCache(websiteUrl: string | undefined): Promise<void> {
        if (!websiteUrl) {
            return;
        }

        const orgDetails = PacContext.OrgInfo;

        if (!orgDetails) {
            return;
        }

        const requestUrl = `${websiteUrl.endsWith('/') ? websiteUrl : websiteUrl.concat('/')}_services/cache/config`;

        await showProgressWithNotification(
            Messages.INITIALIZING_PREVIEW,
            async (progress) => {
                progress.report({ message: Messages.CLEARING_CACHE });

                const authResponse = await dataverseAuthentication(orgDetails.OrgUrl);

                const clearCacheResponse = await fetch(requestUrl, {
                    headers: {
                        authorization: "Bearer " + authResponse.accessToken,
                        'Accept': '*/*',
                        'Content-Type': 'text/plain',
                    },
                    method: 'DELETE'
                });

                if (!clearCacheResponse.ok) {
                    const response = await clearCacheResponse.text();
                    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_SITE_PREVIEW_ERROR, { error: Messages.UNABLE_TO_CLEAR_CACHE, response: response, statusCode: clearCacheResponse.status.toString() });
                }
            }
        );

    }

    private static async handleEmptyWebsiteUrl(): Promise<boolean> {
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

                    const artemisResponse = ArtemisContext.ServiceResponse;

                    if (artemisResponse === null || artemisResponse.response === null) {
                        vscode.window.showErrorMessage(Messages.FAILED_TO_GET_ENDPOINT);
                        return;
                    }

                    progress.report({ message: Messages.GETTING_WEBSITE_ENDPOINT });

                    await PreviewSite.loadSiteUrl(getWorkspaceFolders());

                    if (this._websiteUrl === "") {
                        shouldRepeatLoginFlow = true;
                    }
                }
            );
        }

        return shouldRepeatLoginFlow;
    }
}
