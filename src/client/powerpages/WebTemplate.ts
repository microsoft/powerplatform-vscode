/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export const webTemplate = (context: vscode.ExtensionContext) => {
    let webTemplateName: string | undefined;
    vscode.window
        .showInputBox({ placeHolder: "Enter the name of the web template" })
        .then((value) => {
            webTemplateName = value;
            if (webTemplateName !== undefined && webTemplateName !== "") {
                const terminal = vscode.window.createTerminal("Powerpages", "");
                terminal.sendText(
                    `cd data\n ../node_modules/.bin/yo @microsoft/powerpages:webtemplate ${webTemplateName}`
                );

                const watcher: vscode.FileSystemWatcher =
                    vscode.workspace.createFileSystemWatcher(
                        new vscode.RelativePattern(
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            vscode.workspace.workspaceFolders![0],
                            `**/web-templates/${webTemplateName}/${webTemplateName}.webtemplate.source.html`
                        ),
                        false,
                        true,
                        true
                    );

                context.subscriptions.push(watcher);
                vscode.window.withProgress(
                    {
                        location: vscode.ProgressLocation.Notification,
                        cancellable: true,
                        title: "Creating Web Template",
                    },
                    async () => {
                        watcher.onDidCreate(async (uri) => {
                            await vscode.window.showTextDocument(uri);
                            terminal.dispose();
                        });
                    }
                );
            }
        });
};
