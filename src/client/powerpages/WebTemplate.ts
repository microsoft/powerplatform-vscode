/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { isNullOrEmpty } from "./utils/CommonUtils";
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export const webTemplate = (context: vscode.ExtensionContext) => {
    vscode.window
        .showInputBox({ placeHolder: localize("microsoft-powerapps-portals.webExtension.webtemplate.name","Enter the name of the web template") })
        .then((value) => {
            let webTemplateName = value;
            if (!isNullOrEmpty(webTemplateName)) {
                webTemplateName = webTemplateName?.split(' ').join('-');
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
                        title: localize("microsoft-powerapps-portals.webExtension.webtemplate.create.message","Creating Web Template"),
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
