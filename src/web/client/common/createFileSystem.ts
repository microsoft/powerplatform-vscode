/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import { PORTALS_URI_SCHEME } from "./constants";
import { PortalsFS } from "./fileSystemProvider";

export function createFileSystem(portalsFS: PortalsFS, portalFolderName: string) {
    portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/`, true));
    vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${portalFolderName}/`), name: portalFolderName });
}
