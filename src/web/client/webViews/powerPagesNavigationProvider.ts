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
        const previewPowerPage = new PowerPagesNode(vscode.l10n.t("Preview site"),
            {
                command: 'powerpages.powerPagesFileExplorer.powerPagesRuntimePreview',
                title: vscode.l10n.t("Preview site"),
                arguments: []
            },
            'previewSite.svg');
        const backToStudio = new PowerPagesNode(vscode.l10n.t("Open in Power Pages studio"),
            {
                command: 'powerpages.powerPagesFileExplorer.backToStudio',
                title: vscode.l10n.t("Open in Power Pages studio"),
                arguments: []
            },
            'powerPages.svg');
        const openInDesktop = new PowerPagesNode(vscode.l10n.t("Open in VS Code Desktop"),
            {
                command: 'powerpages.powerPagesFileExplorer.openInDesktop',
                title: vscode.l10n.t("Open in VS Code Desktop"),
                arguments: []
            },
            'desktop.svg');

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
            vscode.window.showErrorMessage(vscode.l10n.t("Preview site URL is not valid"));

            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_WEBSITE_PREVIEW_URL_INVALID,
                this.previewPowerPageSite.name,
                `websitePreviewUrl:${websiteUrl}`
            );
            return;
        }

        // Runtime clear cache call
        const requestUrl = `${websiteUrl.endsWith('/') ? websiteUrl : websiteUrl.concat('/')}_services/cache/config`;

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
                title: vscode.l10n.t("Opening preview site..."),
            },
            async () => {
                const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, {
                    headers: {
                        authorization: "Bearer " + WebExtensionContext.dataverseAccessToken,
                        'Accept': '*/*',
                        'Content-Type': 'text/plain',
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
            vscode.window.showErrorMessage(vscode.l10n.t("Power Pages studio URL is not available"));

            WebExtensionContext.telemetry.sendErrorTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED,
                vscode.l10n.t("Power Pages studio URL is not available")
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
            const websiteId = WebExtensionContext.urlParametersMap?.get('websiteid');
            const envId = WebExtensionContext.urlParametersMap?.get('envid');

            // Validate required parameters
            if (!websiteId) {
                vscode.window.showErrorMessage(vscode.l10n.t("Website ID is not available"));
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                    this.openInDesktop.name,
                    "Missing website ID"
                );
                return;
            }

            if (!envId) {
                vscode.window.showErrorMessage(vscode.l10n.t("Environment ID is not available"));
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
                    vscode.window.showErrorMessage(vscode.l10n.t("Unable to generate VS Code Desktop URL"));
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
                    vscode.l10n.t("Opening in VS Code Desktop. If it doesn't open or shows an error, you may need to install VS Code or update the Power Platform extension."),
                    vscode.l10n.t("Download VS Code"),
                    vscode.l10n.t("Update Extension"),
                ).then((showInstructions) => {
                    if (showInstructions === vscode.l10n.t("Download VS Code")) {
                        vscode.env.openExternal(vscode.Uri.parse("https://code.visualstudio.com/download"));
                    } else if (showInstructions === vscode.l10n.t("Get Extension")) {
                        vscode.env.openExternal(vscode.Uri.parse("https://marketplace.visualstudio.com/items?itemName=microsoft-IsvExpTools.powerplatform-vscode"));
                    }
                });
            }).catch((error: unknown) => {
                const errorMessage = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(vscode.l10n.t("Failed to generate VS Code Desktop URL: {0}", errorMessage));
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_FAILED,
                    this.openInDesktop.name,
                    errorMessage
                );
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(vscode.l10n.t("Failed to open in VS Code Desktop: {0}", errorMessage));

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
            const orgUrl = WebExtensionContext.urlParametersMap?.get('orgurl');
            const region = WebExtensionContext.urlParametersMap?.get('region');
            const schema = WebExtensionContext.urlParametersMap?.get('schema');
            const tenantId = WebExtensionContext.urlParametersMap?.get('tenantid');
            const portalId = WebExtensionContext.urlParametersMap?.get('websitepreviewid');
            const siteName = WebExtensionContext.urlParametersMap?.get('websitename');
            const siteUrl = WebExtensionContext.urlParametersMap?.get('websitepreviewurl');


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
            const baseUri = 'vscode://microsoft-IsvExpTools.powerplatform-vscode/open';

            // Build query parameters for the desktop extension
            const params = new URLSearchParams();
            params.append('websiteid', websiteId);
            params.append('envid', environmentId);
            params.append('orgurl', orgUrl);
            params.append('schema', schema);

            if (region) params.append('region', region);
            if (tenantId) params.append('tenantid', tenantId);
            if (portalId) params.append('websitepreviewid', portalId);
            if (siteName) params.append('sitename', siteName);
            if (siteUrl) params.append('siteurl', siteUrl);

            const finalUri = `${baseUri}?${params.toString()}`;

            // Log telemetry for successful URI generation
            WebExtensionContext.telemetry.sendInfoTelemetry(
                webExtensionTelemetryEventNames.WEB_EXTENSION_OPEN_DESKTOP_TRIGGERED,
                {
                    websiteId: websiteId,
                    environmentId: environmentId,
                    desktopUri: finalUri,
                    hasSiteName: siteName ? 'true' : 'false',
                    hasSiteUrl: params.has('siteurl') ? 'true' : 'false',
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
        const hasThemeVariants = ['desktop', 'powerPages', 'previewSite'].includes(iconName);

        if (hasThemeVariants) {
            return {
                light: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', `${iconName}-icon`, 'light', svgFileName),
                dark: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', `${iconName}-icon`, 'dark', svgFileName)
            };
        }

        // Fallback to single icon for both themes
        return {
            light: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', svgFileName),
            dark: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', svgFileName)
        };
    }
}
