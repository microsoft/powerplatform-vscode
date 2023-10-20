/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import WebExtensionContext from "../WebExtensionContext";
import { httpMethod, queryParameters } from '../common/constants';
import { getBackToStudioURL } from '../utilities/commonUtil';
import { telemetryEventNames } from '../telemetry/constants';

export class PowerPagesNavigationProvider
    implements vscode.TreeDataProvider<PowerPagesNode | UserNode>
{
    private _onDidChangeTreeData: vscode.EventEmitter<
        PowerPagesNode | UserNode | undefined | void
    > = new vscode.EventEmitter<PowerPagesNode | UserNode |undefined | void>();
    readonly onDidChangeTreeData: vscode.Event<
        PowerPagesNode | UserNode | undefined | void
    > = this._onDidChangeTreeData.event;

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: PowerPagesNode | UserNode): vscode.TreeItem {
        return element;
    }

    getChildren(
        element?: PowerPagesNode
    ): Thenable<PowerPagesNode[] | UserNode[]> {
        if (element) {
            if (element.label === "Users Present") {
                return Promise.resolve(this.getConnectedUsers());
            } else {
                return Promise.resolve(this.getNodes(path.join(element.label)));
            }
        } else {
            return Promise.resolve(this.getNodes());
        }
    }

    getConnectedUsers(): UserNode[] {
        return [
            new UserNode("Ritik", vscode.TreeItemCollapsibleState.None),
            new UserNode("Nidhi", vscode.TreeItemCollapsibleState.None),
            new UserNode("Amit", vscode.TreeItemCollapsibleState.None),
        ];
    }

    getNodes(label?: string): PowerPagesNode[] {
        const nodes: PowerPagesNode[] = [];
        const previewPowerPage = new PowerPagesNode(
            vscode.l10n.t("Preview site"),
            "powerPages.svg",
            vscode.TreeItemCollapsibleState.None,
            {
                command:
                    "powerpages.powerPagesFileExplorer.powerPagesRuntimePreview",
                title: vscode.l10n.t("Preview site"),
                arguments: [],
            }
        );
        const backToStudio = new PowerPagesNode(
            vscode.l10n.t("Open in Power Pages"),
            "backToStudio.svg",
            vscode.TreeItemCollapsibleState.None,
            {
                command: "powerpages.powerPagesFileExplorer.backToStudio",
                title: vscode.l10n.t("Open in Power Pages"),
                arguments: [],
            }
        );
        const usersPresent = new PowerPagesNode(
            "Users Present",
            "",
            vscode.TreeItemCollapsibleState.Collapsed
        );

        if (label && label === previewPowerPage.label) {
            nodes.push(previewPowerPage);
        } else if (label && label === backToStudio.label) {
            nodes.push(backToStudio);
        } else {
            nodes.push(previewPowerPage);
            nodes.push(backToStudio);
        }

        nodes.push(usersPresent);

        return nodes;
    }

    async previewPowerPageSite(): Promise<void> {
        let requestSentAtTime = new Date().getTime();
        const websitePreviewUrl = WebExtensionContext.urlParametersMap.get(
            queryParameters.WEBSITE_PREVIEW_URL
        ) as string;
        // Runtime clear cache call
        const requestUrl = `${
            websitePreviewUrl.endsWith("/")
                ? websitePreviewUrl
                : websitePreviewUrl.concat("/")
        }_services/cache/config`;

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
                const response =
                    await WebExtensionContext.concurrencyHandler.handleRequest(
                        requestUrl,
                        {
                            headers: {
                                authorization:
                                    "Bearer " +
                                    WebExtensionContext.dataverseAccessToken,
                                Accept: "*/*",
                                "Content-Type": "text/plain",
                            },
                            method: "DELETE",
                        }
                    );

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
                        "",
                        response?.status.toString()
                    );
                }
            }
        );

        vscode.env.openExternal(vscode.Uri.parse(websitePreviewUrl));
        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_PREVIEW_SITE_TRIGGERED
        );
    }

    backToStudio(): void {
        const backToStudioUrl = getBackToStudioURL();
        vscode.env.openExternal(vscode.Uri.parse(backToStudioUrl));

        WebExtensionContext.telemetry.sendInfoTelemetry(
            telemetryEventNames.WEB_EXTENSION_BACK_TO_STUDIO_TRIGGERED,
            {
                backToStudioUrl: backToStudioUrl,
            }
        );
    }

    openTeamsChat(): void {
        console.log("Open Teams chat");
    }

    openMail(): void {
        console.log("Open mail");
    }
}

export class PowerPagesNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly svgFileName: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly command?: vscode.Command
    ) {
        super(label, collapsibleState);

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

export class UserNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);

        this.tooltip = this.label;
        this.iconPath = new vscode.ThemeIcon("account");
    }

    contextValue = "userNode"
}