/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "./pac/PacWrapper";

export function RegisterUriHandler(pacWrapper: PacWrapper): vscode.Disposable {
    const uriHandler = new UriHandler(pacWrapper);
    return vscode.window.registerUriHandler(uriHandler);
}

enum UriPath {
    PcfInit = '/pcfInit',
}

class UriHandler implements vscode.UriHandler {
    private readonly pacWrapper: PacWrapper;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
    }

    // URIs targeting our extension are in the format
    // vscode://<ExtensionName>/<PathArgs>?<QueryArgs>#<FragmentArgs>
    // vscode://microsoft-IsvExpTools.powerplatform-vscode/pcfInit
    public async handleUri(uri: vscode.Uri): Promise<void> {
        if (uri.path === UriPath.PcfInit) {
            return this.pcfInit();
        }
    }

    async pcfInit(): Promise<void> {
        const pcfInitLabel = vscode.l10n.t({
            message: "Select Folder for new PCF Control",
            comment: ["Do not translate 'PCF' as it is a product name."]
        });

        const openResults = await vscode.window.showOpenDialog({
            canSelectFiles: false, canSelectFolders: true, canSelectMany: false, openLabel: pcfInitLabel });

        if (openResults && openResults.length === 1) {
            const selectedFolder = openResults[0]; // TODO - Consider checking if folder is empty

            const terminal = vscode.window.createTerminal({
                name: "PAC CLI",
                cwd: selectedFolder.fsPath,
                isTransient: true,
            });

            terminal.show();
            terminal.sendText("pac pcf init");

            // Open new workspace folder, if destination was not in existing workspace
            if(vscode.workspace.getWorkspaceFolder(selectedFolder) === undefined) {
                vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders?.length ?? 0, 0, { uri: selectedFolder });
            }
        }
    }
}
