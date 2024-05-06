/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import WebExtensionContext from "../../web/client/WebExtensionContext";
import { httpMethod } from './constants';
import { isStringUndefinedOrEmpty } from '../Utils';
import { WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED, WEB_EXTENSION_PREVIEW_SITE_TRIGGERED } from '../TelemetryConstants';

declare const IS_DESKTOP: string | undefined;

export class PowerPagesNavigationProvider implements vscode.TreeDataProvider<PowerPagesNode> {

    private _onDidChangeTreeData: vscode.EventEmitter<PowerPagesNode | undefined | void> = new vscode.EventEmitter<PowerPagesNode | undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<PowerPagesNode | undefined | void> = this._onDidChangeTreeData.event;

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

    async previewPowerPageSite(websitePreviewUrl: string): Promise<void> {
        let requestSentAtTime = new Date().getTime();

        if (isStringUndefinedOrEmpty(websitePreviewUrl)) {
            vscode.window.showErrorMessage(vscode.l10n.t("Preview site URL is not available"));

            WebExtensionContext.telemetry.sendErrorTelemetry(
                WEB_EXTENSION_PREVIEW_SITE_TRIGGERED,
                vscode.l10n.t("Preview site URL is not available")
            );
            return;
        }

        // Runtime clear cache call
        const requestUrl = `${websitePreviewUrl.endsWith('/') ? websitePreviewUrl : websitePreviewUrl.concat('/')}_services/cache/config`;

        WebExtensionContext.telemetry.sendAPITelemetry(
            requestUrl,
            "Preview power pages site",
            httpMethod.DELETE,
            this.previewPowerPageSite.name
        );
        requestSentAtTime = new Date().getTime();

        if (IS_DESKTOP) {
            // call dataverseAuthentication() for desktop
        } else {
            WebExtensionContext.dataverseAuthentication();
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                cancellable: true,
                title: vscode.l10n.t("Opening preview site..."),
            },
            async () => {
                let dataverseAccessToken = undefined;

                if (IS_DESKTOP) {
                    // get dataverseAccessToken for desktop
                } else {
                    dataverseAccessToken = WebExtensionContext.dataverseAccessToken;
                }

                const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, {
                    headers: {
                        authorization: "Bearer " + dataverseAccessToken,
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

        vscode.env.openExternal(vscode.Uri.parse(websitePreviewUrl));
        WebExtensionContext.telemetry.sendInfoTelemetry(WEB_EXTENSION_PREVIEW_SITE_TRIGGERED);
    }

    backToStudio(backToStudio: string | undefined): void {
        const backToStudioUrl = backToStudio;

        if (backToStudioUrl === undefined) {
            vscode.window.showErrorMessage(vscode.l10n.t("Power Pages studio URL is not available"));

            WebExtensionContext.telemetry.sendErrorTelemetry(
                WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED,
                vscode.l10n.t("Power Pages studio URL is not available")
            );
            return;
        }

        vscode.env.openExternal(vscode.Uri.parse(backToStudioUrl));

        WebExtensionContext.telemetry.sendInfoTelemetry(WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED, {
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
