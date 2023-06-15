/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URLSearchParams } from "node:url";
import { PacWrapper } from "./pac/PacWrapper";
import * as fs from "fs-extra";
import * as path from "node:path";
import * as os from "node:os";

export function RegisterUriHandler(pacWrapper: PacWrapper): vscode.Disposable {
    const uriHandler = new UriHandler(pacWrapper);
    return vscode.window.registerUriHandler(uriHandler);
}

function convertQueryParamsToObject(query: URLSearchParams) : Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of query) {
        result[key] = value;
    }
    return result;
}

enum UriPath {
    Component = '/component',
}

enum ComponentType {
    Connector = 'connector',
}

class UriHandler implements vscode.UriHandler {
    private debugOutput = vscode.window.createOutputChannel("Crash Uri Debugging");
    private readonly pacWrapper: PacWrapper;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
    }

    // URIs targeting our extension are in the format
    // vscode://<ExtensionName>/<PathArgs>?<QueryArgs>#<FragmentArgs>
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/component?ComponentType=connector&EnvironmentId=Default-3041a058-5110-495a-a575-b2a5571d9eac&ConnectorId=24a08f2d-4806-ee11-8f6e-00224804bb56&destination=prompt
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/component?ComponentType=connector&EnvironmentId=Default-3041a058-5110-495a-a575-b2a5571d9eac&ConnectorId=24a08f2d-4806-ee11-8f6e-00224804bb56&destination=temp
    public async handleUri(uri: vscode.Uri): Promise<void> {

        const queryArgs = convertQueryParamsToObject(new URLSearchParams(uri.query));

        this.debugOutput.show();
        this.debugOutput.appendLine(`Recieved URI: ${uri.toString()}`);
        this.debugOutput.appendLine(`Path: ${uri.path}`);
        this.debugOutput.appendLine(`Query: ${uri.query}`);
        this.debugOutput.appendLine(`Fragment: ${uri.fragment}`);
        this.debugOutput.appendLine(`Authority: ${uri.authority}`);
        this.debugOutput.appendLine(`Scheme: ${uri.scheme}`);
        this.debugOutput.appendLine("");

        if (uri.path === UriPath.Component) {
            if (queryArgs.ComponentType === ComponentType.Connector) {

                // TODO - Check that parameters are not null/undefined
                const environmentId = queryArgs.EnvironmentId && queryArgs.EnvironmentId.startsWith("Default-") ? queryArgs.EnvironmentId.substring(8) : queryArgs.EnvironmentId;
                const connectorId = queryArgs.ConnectorId;
                const destination = queryArgs.destination;

                // TODO - pick one implementation
                let outputDir: string;
                if (destination === "prompt") {
                    const selectedFolder = await vscode.window.showOpenDialog({ canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: "Select Folder" }); // TODO - Localize
                    if (selectedFolder && selectedFolder.length > 0) {
                        outputDir = selectedFolder[0].fsPath;
                    } else {
                        return;
                    }
                } else if (destination === "temp") {
                    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'PowerPlatform-Connector-'));
                } else {
                    vscode.window.showErrorMessage("Invalid destination."); // TODO - Localize
                    return;
                }

                const result = await this.pacWrapper.connectorDownload(environmentId, connectorId, outputDir);
                if (result?.Status === "Success") {
                    vscode.window.showInformationMessage("Connector downloaded successfully."); // TODO - Localize

                    // Open new workspace folder, if destination was not in existing workspace
                    if(vscode.workspace.getWorkspaceFolder(vscode.Uri.file(outputDir)) === undefined) {
                        vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, { uri: vscode.Uri.file(outputDir) });
                    }

                } else {
                    vscode.window.showErrorMessage("Failed to download connector."); // TODO - Localize
                }

            }
        }
    }

}
