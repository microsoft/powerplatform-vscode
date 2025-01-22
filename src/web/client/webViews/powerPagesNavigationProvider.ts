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

        if (label && label === previewPowerPage.label) {
            nodes.push(previewPowerPage);
        } else if (label && label === backToStudio.label) {
            nodes.push(backToStudio);
        } else {
            nodes.push(previewPowerPage);
            nodes.push(backToStudio);
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
        return {
            light: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', svgFileName),
            dark: vscode.Uri.joinPath(WebExtensionContext.extensionUri, 'src', 'web', 'client', 'assets', svgFileName)
        };
    }
}
