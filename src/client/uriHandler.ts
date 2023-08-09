/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URLSearchParams } from "node:url";
import { PacWrapper } from "./pac/PacWrapper";
// import * as fs from "fs-extra";
// import * as path from "node:path";

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
    PcfInit = '/pcfInit',
}

class UriHandler implements vscode.UriHandler {
    private debugOutput = vscode.window.createOutputChannel("Crash Uri Debugging");
    private readonly pacWrapper: PacWrapper;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
    }

    // URIs targeting our extension are in the format
    // vscode://<ExtensionName>/<PathArgs>?<QueryArgs>#<FragmentArgs>
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/pcfInit
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

        if (uri.path === UriPath.PcfInit) {

            await vscode.commands.executeCommand("workbench.action.openWalkthrough", "pacCLI.pcfWalkthrough#pacCommands", true);

            const openResults = await vscode.window.showOpenDialog({
                canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: "Select Folder" }); // TODO - Localize

            if (openResults && openResults.length === 1) {
                const selectedFolder = openResults[0];
                // TODO - Check if folder is empty?

                // Option 1 - execute command directly in a terminal, so that user can see the command and its output
                const terminal = vscode.window.createTerminal({
                    name: "PAC CLI",
                    cwd: selectedFolder.fsPath,
                    isTransient: true,
                    message: "PCF Init", // TODO - Localize
                });

                terminal.show();
                terminal.sendText("pac pcf init");

                // Option 2 - use existing PAC non-interactively.  This will result in not seeing the command output.
                // const result = await this.pacWrapper.pcfInit(selectedFolder[0].fsPath);
                // if (result?.Status === "Success") {
                //     vscode.window.showInformationMessage("PCF project initialized successfully."); // TODO - Localize
                // } else {
                //     vscode.window.showErrorMessage("Failed to initialize PCF project."); // TODO - Localize
                // }

                // Open new workspace folder, if destination was not in existing workspace
                if(vscode.workspace.getWorkspaceFolder(selectedFolder) === undefined) {
                    vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, { uri: selectedFolder });
                }

            }
        }
    }

}
