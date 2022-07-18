/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PORTALS_URI_SCHEME, PORTALS_WORKSPACE_NAME } from "./constants";
import { PortalsFS } from "./fileSystemProvider";

export function createFileSystem(portalsFS: PortalsFS, portalFolderName: string) {
    portalsFS.createDirectory(vscode.Uri.parse(`${PORTALS_URI_SCHEME}:/${PORTALS_WORKSPACE_NAME}/${portalFolderName}/`, true));
}
