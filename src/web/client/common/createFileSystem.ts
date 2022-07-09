/* eslint-disable @typescript-eslint/no-unused-vars */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import { PORTALS_FOLDER_NAME, PORTALS_URI_SCHEME, PORTALS_WORKSPACE_NAME } from "./constants";
import { PortalsFS } from "./fileSystemProvider";

export function createFileSystem(portalsFS: PortalsFS) {
    vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri: vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/`), name: PORTALS_WORKSPACE_NAME });
    portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${PORTALS_FOLDER_NAME}/`, true));
}
