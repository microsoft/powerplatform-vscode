/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { GeneratorAcquisition } from "../../lib/GeneratorAcquisition";
import { createContentSnippet } from "./Contentsnippet";
import { getSelectedWorkspaceFolder } from "./utils/CommonUtils";
const activeEditor = vscode.window.activeTextEditor;

export function initializeGenerator(
    context: vscode.ExtensionContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliContext: any
): void {
    const generator = new GeneratorAcquisition(cliContext);
    generator.ensureInstalled();
    context.subscriptions.push(generator);
    const yoCommandPath = generator.yoCommandPath;
    if (yoCommandPath) {
        registerCreateCommands(context, yoCommandPath);
    }
}

function registerCreateCommands(
    context: vscode.ExtensionContext,
    yoCommandPath: string
) {
    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.contentsnippet",
        async (uri) => {
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor
            );
            createContentSnippet(
                context,
                selectedWorkspaceFolder,
                yoCommandPath
            );
        }
    );
}
