/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import WebExtensionContext from "../WebExtensionContext";
import { queryParameters } from '../common/constants';
import { getBackToStudioURL } from '../utilities/commonUtil';
import { telemetryEventNames } from '../telemetry/constants';
import { PortalRuntimeClient, RuntimeParameters } from './PortalRuntimeClient';

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

    async previewPowerPageSite(): Promise<void> {
        const websitePreviewUrl = WebExtensionContext.urlParametersMap.get(queryParameters.WEBSITE_PREVIEW_URL) as string;
        const runtimeParameters: RuntimeParameters = {
            instanceUrl: websitePreviewUrl,
            bearerToken: WebExtensionContext.urlParametersMap.get(WebExtensionContext.dataverseAccessToken) as string
        };
        
        const portalRuntimeClient = new PortalRuntimeClient(runtimeParameters);
        portalRuntimeClient.fetchAndApplyContent('/').then((htmlContent: string) => {
            const previewPanel = vscode.window.createWebviewPanel(
                'powerPagesPreview',
                'Power Pages Preview',
                vscode.ViewColumn.One,
                {
                    enableScripts: true
                }
            );

            previewPanel.webview.html = htmlContent;

            previewPanel.reveal();
        });
    }

    backToStudio(): void {
        const backToStudioUrl = getBackToStudioURL();
        vscode.env.openExternal(vscode.Uri.parse(backToStudioUrl));

        WebExtensionContext.telemetry.sendInfoTelemetry(telemetryEventNames.WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED, {
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
