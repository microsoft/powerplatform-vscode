/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import WebExtensionContext from "../WebExtensionContext";
import { httpMethod } from '../common/constants';
import { getBackToStudioURL, getValidWebsitePreviewUrl } from '../utilities/commonUtil';
import { webExtensionTelemetryEventNames } from '../../../common/OneDSLoggerTelemetry/web/client/webExtensionTelemetryEvents';
import { PowerPagesNavigationConstants } from './constants/powerPagesNavigationConstants';

export class PowerPagesNavigationProvider implements vscode.TreeDataProvider<PowerPagesNode> {

    private _onDidChangeTreeData: vscode.EventEmitter<PowerPagesNode | undefined | void> = new vscode.EventEmitter<PowerPagesNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<PowerPagesNode | undefined | void> = this._onDidChangeTreeData.event;
    private isWebsitePreviewURLValid: Promise<{ websiteUrl: string, isValid: boolean }> = getValidWebsitePreviewUrl();

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PowerPagesNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: PowerPagesNode): Thenable<PowerPagesNode[]> {
        if (element) {
            return Promise.resolve(this.getNodes(path.join(element.label)));
        } else {
            return Promise.resolve(this.getNodes());
        }
    }

    getNodes(label?: string): PowerPagesNode[] {
        const nodes: PowerPagesNode[] = [];
        const previewPowerPage = new PowerPagesNode(vscode.l10n.t(PowerPagesNavigationConstants.messages.PREVIEW_SITE),
            {
                command: PowerPagesNavigationConstants.commands.RUNTIME_PREVIEW,
                title: vscode.l10n.t(PowerPagesNavigationConstants.messages.PREVIEW_SITE),
                arguments: []
            },
            PowerPagesNavigationConstants.icons.PREVIEW_SITE);
        const backToStudio = new PowerPagesNode(vscode.l10n.t(PowerPagesNavigationConstants.messages.OPEN_IN_POWER_PAGES_STUDIO),
            {
                command: PowerPagesNavigationConstants.commands.BACK_TO_STUDIO,
                title: vscode.l10n.t(PowerPagesNavigationConstants.messages.OPEN_IN_POWER_PAGES_STUDIO),
                arguments: []
            },
            PowerPagesNavigationConstants.icons.POWER_PAGES);
        const openInDesktop = new PowerPagesNode(vscode.l10n.t(PowerPagesNavigationConstants.messages.OPEN_IN_VS_CODE_DESKTOP),
            {
                command: PowerPagesNavigationConstants.commands.OPEN_IN_DESKTOP,
                title: vscode.l10n.t(PowerPagesNavigationConstants.messages.OPEN_IN_VS_CODE_DESKTOP),
                arguments: []
            },
            PowerPagesNavigationConstants.icons.DESKTOP);

        if (label && label === previewPowerPage.label) {
            nodes.push(previewPowerPage);
        } else if (label && label === backToStudio.label) {
            nodes.push(backToStudio);
        } else if (label && label === openInDesktop.label) {
            nodes.push(openInDesktop);
        } else {
            nodes.push(previewPowerPage);
            nodes.push(backToStudio);
            nodes.push(openInDesktop);
        }

        return nodes;
    }

    async previewPowerPageSite(): Promise<void> {
        let requestSentAtTime = new Date().getTime();

        const { isValid, websiteUrl } = await this.isWebsitePreviewURLValid;

        if (!isValid) {
            vscode.window.showErrorMessage(vscode.l10n.t(PowerPagesNavigationConstants.messages.PREVIEW_SITE_URL_INVALID));

            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_WEBSITE_PREVIEW_URL_INVALID,
                this.previewPowerPageSite.name,
                `websitePreviewUrl:${websiteUrl}`
            );
            return;
        }

        // Runtime clear cache call
        const requestUrl = `${websiteUrl.endsWith('/') ? websiteUrl : websiteUrl.concat('/')}${PowerPagesNavigationConstants.endpoints.CACHE_CONFIG}`;

        WebExtensionContext.telemetry.sendAPITelemetry(
            requestUrl,
            "Preview power pages site",
            httpMethod.DELETE,
            this.previewPowerPageSite.name
        );
        requestSentAtTime = new Date().getTime();
        WebExtensionContext.dataverseAuthentication();

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                cancellable: true,
                title: vscode.l10n.t(PowerPagesNavigationConstants.messages.OPENING_PREVIEW_SITE),
            },
            async () => {
                const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, {
                    headers: {
                        [PowerPagesNavigationConstants.headers.AUTHORIZATION]: PowerPagesNavigationConstants.headers.BEARER_PREFIX + WebExtensionContext.dataverseAccessToken,
                        [PowerPagesNavigationConstants.headers.ACCEPT]: PowerPagesNavigationConstants.headers.ACCEPT_ALL,
                        [PowerPagesNavigationConstants.headers.CONTENT_TYPE]: PowerPagesNavigationConstants.headers.TEXT_PLAIN,
                    },
                    method: 'DELETE',
                });

                if (response.ok) {
                    WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                        requestUrl,
                        "Preview power pages site",
                        httpMethod.DELETE,
                        new Date().getTime() - requestSentAtTime,
                        this.previewPowerPageSite.name
                    );
                } else {
                    WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                        requestUrl,
                        "Preview power pages site",
                        httpMethod.DELETE,
                        new Date().getTime() - requestSentAtTime,
                        this.previewPowerPageSite.name,
                        JSON.stringify(response),
                        '',
                        response?.status.toString()
                    );
                }


            }
        );

        vscode.env.openExternal(vscode.Uri.parse(websiteUrl));
        WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_PREVIEW_SITE_TRIGGERED);
    }

    backToStudio(): void {
        const backToStudioUrl = getBackToStudioURL();

        if (backToStudioUrl === undefined) {
            vscode.window.showErrorMessage(vscode.l10n.t(PowerPagesNavigationConstants.messages.POWER_PAGES_STUDIO_URL_NOT_AVAILABLE));

            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED,
                vscode.l10n.t(PowerPagesNavigationConstants.messages.POWER_PAGES_STUDIO_URL_NOT_AVAILABLE)
            );
            return;
        }

        vscode.env.openExternal(vscode.Uri.parse(backToStudioUrl));

        WebExtensionContext.telemetry.sendInfoTelemetry(webExtensionTelemetryEventNames.WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED, {
            backToStudioUrl: backToStudioUrl
        });
    }

    openInDesktop(): void {
        try {
            const websiteId = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.WEBSITE_ID);
            const envId = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.ENV_ID);

            // Validate required parameters
            if (!websiteId) {
                vscode.window.showErrorMessage(vscode.l10n.t(PowerPagesNavigationConstants.messages.WEBSITE_ID_NOT_AVAILABLE));
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                    this.openInDesktop.name,
                    "Missing website ID"
                );
                return;
            }

            if (!envId) {
                vscode.window.showErrorMessage(vscode.l10n.t(PowerPagesNavigationConstants.messages.ENVIRONMENT_ID_NOT_AVAILABLE));
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                    this.openInDesktop.name,
                    "Missing environment ID"
                );
                return;
            }

            // Extract environment ID from the URL format if needed
            const environmentId = envId.split("/").pop() || envId;

            // Build VS Code desktop URI (this is now async to include website URL)
            this.buildDesktopUri(websiteId, environmentId).then((desktopUri: string | null) => {
                if (!desktopUri) {
                    vscode.window.showErrorMessage(vscode.l10n.t(PowerPagesNavigationConstants.messages.UNABLE_TO_GENERATE_DESKTOP_URL));
                    WebExtensionContext.telemetry.sendErrorTelemetry(
                        webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                        this.openInDesktop.name,
                        "Unable to generate desktop URI"
                    );
                    return;
                }

                // Open in VS Code Desktop
                vscode.env.openExternal(vscode.Uri.parse(desktopUri));

                // Show informational message with fallback options (don't await to avoid blocking)
                vscode.window.showInformationMessage(
                    vscode.l10n.t(PowerPagesNavigationConstants.messages.OPENING_IN_VS_CODE_DESKTOP),
                    vscode.l10n.t(PowerPagesNavigationConstants.messages.DOWNLOAD_VS_CODE),
                    vscode.l10n.t(PowerPagesNavigationConstants.messages.UPDATE_EXTENSION),
                ).then((showInstructions) => {
                    if (showInstructions === vscode.l10n.t(PowerPagesNavigationConstants.messages.DOWNLOAD_VS_CODE)) {
                        vscode.env.openExternal(vscode.Uri.parse(PowerPagesNavigationConstants.urls.VS_CODE_DOWNLOAD));
                    } else if (showInstructions === vscode.l10n.t(PowerPagesNavigationConstants.messages.UPDATE_EXTENSION)) {
                        vscode.env.openExternal(vscode.Uri.parse(PowerPagesNavigationConstants.urls.VS_CODE_MARKETPLACE));
                    }
                });
            }).catch((error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(vscode.l10n.t(PowerPagesNavigationConstants.messages.FAILED_TO_GENERATE_DESKTOP_URL, errorMessage));
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                    this.openInDesktop.name,
                    errorMessage
                );
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(vscode.l10n.t(PowerPagesNavigationConstants.messages.FAILED_TO_OPEN_IN_DESKTOP, errorMessage));

            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                this.openInDesktop.name,
                errorMessage
            );
        }
    }

    private async buildDesktopUri(websiteId: string, environmentId: string): Promise<string | null> {
        try {
            // Get current URL parameters
            const orgUrl = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.ORG_URL);
            const region = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.REGION);
            const schema = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.SCHEMA);
            const tenantId = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.TENANT_ID);
            const portalId = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.PORTAL_ID);
            const siteName = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.SITE_NAME);
            const siteUrl = WebExtensionContext.urlParametersMap?.get(PowerPagesNavigationConstants.urlParams.SITE_URL);


            // Validate required parameters for desktop URI
            if (!orgUrl || !schema) {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                    this.buildDesktopUri.name,
                    `Missing required parameters: orgUrl=${!!orgUrl}, schema=${!!schema}`
                );
                return null;
            }

            // Base desktop URI format - this should match the VS Code desktop extension's expected format
            const baseUri = PowerPagesNavigationConstants.urls.DESKTOP_URI_SCHEME;

            // Build query parameters for the desktop extension
            const params = new URLSearchParams();
            params.append(PowerPagesNavigationConstants.urlParams.WEBSITE_ID, websiteId);
            params.append(PowerPagesNavigationConstants.urlParams.ENV_ID, environmentId);
            params.append(PowerPagesNavigationConstants.urlParams.ORG_URL, orgUrl);
            params.append(PowerPagesNavigationConstants.urlParams.SCHEMA, schema);

            if (region) params.append(PowerPagesNavigationConstants.urlParams.REGION, region);
            if (tenantId) params.append(PowerPagesNavigationConstants.urlParams.TENANT_ID, tenantId);
            if (portalId) params.append(PowerPagesNavigationConstants.urlParams.PORTAL_ID, portalId);
            if (siteName) params.append(PowerPagesNavigationConstants.urlParams.SITE_NAME, siteName);
            if (siteUrl) params.append(PowerPagesNavigationConstants.urlParams.SITE_URL, siteUrl);

            const finalUri = `${baseUri}?${params.toString()}`;

            // Log telemetry for successful URI generation
            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_TRIGGERED,
                {
                    websiteId: websiteId,
                    environmentId: environmentId,
                    desktopUri: finalUri,
                    hasSiteName: siteName ? PowerPagesNavigationConstants.values.TRUE : PowerPagesNavigationConstants.values.FALSE,
                    hasSiteUrl: params.has(PowerPagesNavigationConstants.urlParams.SITE_URL) ? PowerPagesNavigationConstants.values.TRUE : PowerPagesNavigationConstants.values.FALSE,
                    schema: schema
                }
            );

            return finalUri;

        } catch (error) {
            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                this.buildDesktopUri.name,
                `Error building desktop URI: ${error instanceof Error ? error.message : String(error)}`
            );
            return null;
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
        // Check if this icon has theme-specific versions
        const iconName = svgFileName.replace('.svg', '');
        const hasThemeVariants = PowerPagesNavigationConstants.icons.THEME_VARIANTS.includes(iconName);

        if (hasThemeVariants) {
            return {
                light: vscode.Uri.joinPath(WebExtensionContext.extensionUri, PowerPagesNavigationConstants.paths.ASSETS, `${iconName}-icon`, PowerPagesNavigationConstants.paths.LIGHT_ICONS, svgFileName),
                dark: vscode.Uri.joinPath(WebExtensionContext.extensionUri, PowerPagesNavigationConstants.paths.ASSETS, `${iconName}-icon`, PowerPagesNavigationConstants.paths.DARK_ICONS, svgFileName)
            };
        }

        // Fallback to single icon for both themes
        return {
            light: vscode.Uri.joinPath(WebExtensionContext.extensionUri, PowerPagesNavigationConstants.paths.ASSETS, svgFileName),
            dark: vscode.Uri.joinPath(WebExtensionContext.extensionUri, PowerPagesNavigationConstants.paths.ASSETS, svgFileName)
        };
    }
}
