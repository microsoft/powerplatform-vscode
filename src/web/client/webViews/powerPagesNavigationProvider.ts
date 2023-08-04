/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import WebExtensionContext from "../WebExtensionContext";
import { httpMethod, queryParameters } from '../common/constants';
//import { getCommonHeaders } from '../common/authenticationProvider';

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
        const previewPowerPage = new PowerPagesNode('Show site in new tab',
            {
                command: 'powerPagesFileExplorer.previewPowerPages',
                title: '',
                arguments: []
            });
        const backToStudio = new PowerPagesNode('Open powerpages',
            {
                command: 'powerPagesFileExplorer.backToStudio',
                title: '',
                arguments: []
            });

        console.log(path.join(__filename, '..', '..', 'src', 'web', 'client', 'assets', 'backToStudio.svg'));

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
        // TODO: implement
        console.log("Execute preview power pages site", WebExtensionContext.urlParametersMap.get(queryParameters.WEBSITE_PREVIEW_URL) as string);

        // Runtime clear cache call
        const requestUrl = "https://site-npeby.powerappsportals.com/_services/portal/547f0b36-0ad2-446f-9543-99effc6fce8e/invalidate-cache-maker";

        WebExtensionContext.telemetry.sendAPITelemetry(
            requestUrl,
            "Preview power pages site",
            httpMethod.POST,
            this.previewPowerPageSite.name
        );
        requestSentAtTime = new Date().getTime();
        WebExtensionContext.dataverseAuthentication();

        const response = await WebExtensionContext.concurrencyHandler.handleRequest(requestUrl, {
            // headers: getCommonHeaders(WebExtensionContext.dataverseAccessToken),
            headers: {
                authorization: "Bearer " + WebExtensionContext.dataverseAccessToken,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                //'referrer-policy': 'strict-origin-when-cross-origin',
                // 'Access-Control-Allow-Origin': '*',
                // 'Access-Control-Allow-Headers': 'access-control-allow-origin,authorization,content-type,referrer-policy'
            },
            method: 'POST',
            body: JSON.stringify({
                runtimeInvalidationRequest: "{\"entities\":[{\"entityName\":\"*\"}],\"source\":\"\"}"
            })
        });

        if (response.ok) {
            WebExtensionContext.telemetry.sendAPISuccessTelemetry(
                requestUrl,
                "Preview power pages site",
                httpMethod.POST,
                new Date().getTime() - requestSentAtTime,
                this.previewPowerPageSite.name
            );
        } else {
            WebExtensionContext.telemetry.sendAPIFailureTelemetry(
                requestUrl,
                "Preview power pages site",
                httpMethod.POST,
                new Date().getTime() - requestSentAtTime,
                this.previewPowerPageSite.name,
                JSON.stringify(response),
                '',
                response?.status.toString()
            );
        }


        vscode.env.openExternal(vscode.Uri.parse(WebExtensionContext.urlParametersMap.get(queryParameters.WEBSITE_PREVIEW_URL) as string));
    }

    backToStudio(): void {
        // TODO: implement
        console.log("Execute back to studio");
        vscode.env.openExternal(vscode.Uri.parse("https://make.test.powerpages.microsoft.com/e/5b6338ff-aa3e-ecd4-a8ab-1d48fda1e109/sites/b17443f1-f825-ee11-bdf4-0022481d5eb9/pages"));
    }
}



export class PowerPagesNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly command?: vscode.Command
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);

        this.tooltip = this.label;
        this.command = command;
    }

    iconPath = {
        light: path.join(__filename, '..', '..', 'src', 'web', 'client', 'assets', 'backToStudio.svg'),
        dark: path.join(__filename, '..', '..', 'src', 'web', 'client', 'assets', 'powerPages.svg')
    };
}