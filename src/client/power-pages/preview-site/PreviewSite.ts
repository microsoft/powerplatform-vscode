/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ECSFeaturesClient } from '../../../common/ecs-features/ecsFeatureClient';
import { EnableSiteRuntimePreview } from '../../../common/ecs-features/ecsFeatureGates';
import { WorkspaceFolder } from 'vscode-languageclient/node';
import { getWebsiteRecordId } from '../../../common/utilities/WorkspaceInfoFinderUtil';
import { PROVIDER_ID, WebsiteDataModel } from '../../../common/services/Constants';
import { PPAPIService } from '../../../common/services/PPAPIService';
import { VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY, VSCODE_EXTENSION_SITE_PREVIEW_ERROR } from '../../../common/services/TelemetryConstants';
import { EDGE_TOOLS_EXTENSION_ID, SUCCESS, TRUE } from '../../../common/constants';
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { getWorkspaceFolders, showProgressWithNotification } from '../../../common/utilities/Utils';
import { Events, Messages } from './Constants';
import { dataverseAuthentication } from '../../../common/services/AuthenticationProvider';
import PacContext from '../../pac/PacContext';
import ArtemisContext from '../../ArtemisContext';
import { PacTerminal } from '../../lib/PacTerminal';
import CurrentSiteContext from '../actions-hub/CurrentSiteContext';
import { IWebsiteDetails } from '../../../common/services/Interfaces';
import { uploadSite } from '../actions-hub/ActionsHubCommandHandlers';
import { SiteTreeItem } from '../actions-hub/tree-items/SiteTreeItem';
import { SiteVisibility } from '../actions-hub/models/SiteVisibility';

export const SITE_PREVIEW_COMMAND_ID = "microsoft.powerplatform.pages.preview-site";

export class PreviewSite {
    private static _websiteDetails: IWebsiteDetails | undefined = undefined;
    private static _isInitialized = false;
    private static _pacTerminal: PacTerminal;


    static isSiteRuntimePreviewEnabled(): boolean {
        const enableSiteRuntimePreview = ECSFeaturesClient.getConfig(EnableSiteRuntimePreview).enableSiteRuntimePreview

        if (enableSiteRuntimePreview === undefined) {
            return false;
        }

        return enableSiteRuntimePreview;
    }

    static async initialize(context: vscode.ExtensionContext, workspaceFolders: WorkspaceFolder[], pacTerminal: PacTerminal): Promise<void> {
        if (PreviewSite._isInitialized) {
            return;
        }

        PreviewSite._pacTerminal = pacTerminal;

        try {
            const isSiteRuntimePreviewEnabled = PreviewSite.isSiteRuntimePreviewEnabled();

            oneDSLoggerWrapper.getLogger().traceInfo("EnableSiteRuntimePreview", {
                isEnabled: isSiteRuntimePreviewEnabled.toString()
            });

            const artemisResponse = ArtemisContext.ServiceResponse;
            const orgDetails = PacContext.OrgInfo;

            if (artemisResponse && orgDetails && isSiteRuntimePreviewEnabled) {
                PacContext.onChanged(async () => await PreviewSite.loadSiteDetails(workspaceFolders));

                context.subscriptions.push(
                    vscode.commands.registerCommand(
                        SITE_PREVIEW_COMMAND_ID,
                        PreviewSite.handlePreviewRequest
                    )
                );

                await PreviewSite.loadSiteDetails(workspaceFolders);
                await vscode.commands.executeCommand("setContext", "microsoft.powerplatform.pages.siteRuntimePreviewEnabled", true);
            }

            PreviewSite._isInitialized = true;
            oneDSLoggerWrapper.getLogger().traceInfo(Events.PREVIEW_SITE_INITIALIZED, {
                isEnabled: isSiteRuntimePreviewEnabled.toString()
            });
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Events.PREVIEW_SITE_INITIALIZATION_FAILED, exceptionError.message, exceptionError);
        }
    }

    static async loadSiteDetails(workspaceFolders: WorkspaceFolder[]): Promise<void> {
        const websiteDetails = await PreviewSite.getWebsiteDetails(workspaceFolders);

        PreviewSite._websiteDetails = websiteDetails;
    }

    private static async getWebsiteDetails(workspaceFolders: WorkspaceFolder[]): Promise<IWebsiteDetails> {
        const websiteRecordId = getWebsiteRecordId(workspaceFolders);
        if (!websiteRecordId) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GET_WEBSITE_RECORD_ID_EMPTY, {
                websiteRecordId: websiteRecordId
            });
            return {} as IWebsiteDetails;
        }

        const orgDetails = PacContext.OrgInfo;

        if (!orgDetails) {
            return {} as IWebsiteDetails;
        }

        const websiteDetails = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(ArtemisContext.ServiceResponse.stamp, orgDetails.EnvironmentId, websiteRecordId);
        return websiteDetails ?? {} as IWebsiteDetails;
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

    public static async launchBrowserAndDevToolsWithinVsCode(webSitePreviewURL: string | undefined, dataModelVersion: 1 | 2, siteVisibility: SiteVisibility | undefined): Promise<void> {
        if (!webSitePreviewURL || webSitePreviewURL === "" || !siteVisibility) {
            return;
        }

        const edgeToolsExtension = vscode.extensions.getExtension(EDGE_TOOLS_EXTENSION_ID);

        if (!edgeToolsExtension) {
            await PreviewSite.promptInstallEdgeTools();
            return;
        }

        await showProgressWithNotification(
            Messages.OPENING_SITE_PREVIEW,
            async () => {
                PreviewSite.closeExistingPreview();
                await vscode.commands.executeCommand('vscode-edge-devtools.launch', { launchUrl: webSitePreviewURL });
            }
        );

        const websitePath = CurrentSiteContext.currentSiteFolderPath;
        if (websitePath) {
            await PreviewSite.showUploadWarning(websitePath, dataModelVersion, siteVisibility);
        }
    }

    private static async showUploadWarning(websitePath: string, dataModelVersion: 1 | 2, siteVisibility: SiteVisibility) {
        const pendingChangesResult = await PreviewSite._pacTerminal.getWrapper().pendingChanges(websitePath, dataModelVersion);

        try {
            if (pendingChangesResult.Status === SUCCESS && pendingChangesResult.Information[pendingChangesResult.Information.length - 1].includes(TRUE)) {
                const result = await vscode.window.showInformationMessage(Messages.PREVIEW_WARNING, Messages.UPLOAD_CHANGES, Messages.CANCEL);
                if (result === Messages.UPLOAD_CHANGES) {
                    await uploadSite({
                        siteInfo: {
                            dataModelVersion: dataModelVersion,
                            siteVisibility: siteVisibility
                        }
                    } as SiteTreeItem, websitePath);
                }
            } else {
                await vscode.window.showInformationMessage(Messages.PREVIEW_SHOWN_FOR_PUBLISHED_CHANGES);
            }
        } catch (exception) {
            const exceptionError = exception as Error;
            oneDSLoggerWrapper.getLogger().traceError(Events.PREVIEW_SITE_UPLOAD_WARNING_FAILED, exceptionError.message, exceptionError);
        }
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

        if (PreviewSite._websiteDetails === undefined) {
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

        if (!PreviewSite._websiteDetails.websiteUrl) {
            let shouldRepeatLoginFlow = true;

            while (shouldRepeatLoginFlow) {
                shouldRepeatLoginFlow = await PreviewSite.handleEmptyWebsiteUrl();
            }
        }


        await PreviewSite.clearCache(PreviewSite._websiteDetails.websiteUrl);

        await PreviewSite.launchBrowserAndDevToolsWithinVsCode(
            PreviewSite._websiteDetails.websiteUrl,
            PreviewSite._websiteDetails.dataModel === WebsiteDataModel.Standard ? 1 : 2,
            PreviewSite._websiteDetails.siteVisibility
        );
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

                if (!authResponse) {
                    progress.report({ message: Messages.LOGIN_REQUIRED });
                    return;
                }

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

                    await PreviewSite.loadSiteDetails(getWorkspaceFolders());

                    if (!PreviewSite._websiteDetails?.websiteUrl) {
                        shouldRepeatLoginFlow = true;
                    }
                }
            );
        }

        return shouldRepeatLoginFlow;
    }

    private static closeExistingPreview() {
        try {
            vscode.window.tabGroups.all.forEach((tabGroup) => {
                tabGroup.tabs.forEach(async (tab) => {
                    if (tab.label.toLowerCase().startsWith("edge devtools")) {
                        await vscode.window.tabGroups.close(tab);
                    }
                });
            });
        } catch (error) {
            const exceptionError = error as Error;
            oneDSLoggerWrapper.getLogger().traceError(Events.PREVIEW_SITE_CLOSE_EXISTING_PREVIEW_FAILED, (error as Error).message, exceptionError);
        }
    }
}
