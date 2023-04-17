/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { createWebpage } from "../create/Webpage";
import * as vscode from "vscode";
import path from "path";
let _context: vscode.ExtensionContext;

export function createAiWebpage(_prompt: string):void {
    const yoGenPackagePath = path.join("node_modules", ".bin", "yo");
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    createWebpage(
        _context,
        workspaceFolder,
        yoGenPackagePath,
        _prompt
    )
}