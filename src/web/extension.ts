/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {
    console.log("Activated web extension!"); // sample code for testing the webExtension

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.webExtension.init",
            () => {
                // sample code for testing the webExtension
                vscode.window.showInformationMessage(
                    "Initializing web extension!"
                );
            }
        )
    );
}
