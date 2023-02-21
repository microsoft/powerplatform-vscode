/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from "vscode";
import {
    createFileWatcher,
    createRecord,
    formatFileName,
    formatFolderName,
    isNullOrEmpty,
} from "./utils/CommonUtils";
import * as nls from "vscode-nls";
import path from "path";
import { statSync } from "fs";
import { webTemplate, YoSubGenerator } from "./constants";
nls.config({
    messageFormat: nls.MessageFormat.bundle,
    bundleFormat: nls.BundleFormat.standalone,
})();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export const createWebTemplate = (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string | undefined,
    yoPath: string | null
) => {
    try {
        if (selectedWorkspaceFolder) {
            const portalDir = selectedWorkspaceFolder;

            vscode.window
                .showInputBox({
                    placeHolder: localize(
                        "microsoft-powerapps-portals.webExtension.webtemplate.name",
                        "Enter the name of the web template"
                    ),
                    validateInput: (name) => {
                        const file = formatFileName(name);
                        const folder = formatFolderName(name);
                        if (selectedWorkspaceFolder) {
                            const filePath = path.join(
                                portalDir,
                                "web-templates",
                                folder,
                                `${file}.webtemplate.source.html`
                            );
                            try {
                                const stat = statSync(filePath);
                                if (stat) {
                                    return "A webtemplate with the same name already exists. Please enter a different name.";
                                }
                            } catch (error: any) {
                                if (error.code === "ENOENT") {
                                    return undefined;
                                }
                            }
                        }
                    },
                })
                .then(async (value) => {
                    if (!isNullOrEmpty(value)) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const webTemplateFile = formatFileName(value!);
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const webTemplateFolder = formatFolderName(value!);

                        const watcherPattern = path.join(
                            "web-templates",
                            webTemplateFolder,
                            `${webTemplateFile}.webtemplate.source.html`
                        );
                        const watcher = createFileWatcher(
                            context,
                            portalDir,
                            watcherPattern
                        );

                        // const watcher: vscode.FileSystemWatcher =
                        //     vscode.workspace.createFileSystemWatcher(
                        //         new vscode.RelativePattern(
                        //             // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        //             selectedWorkspaceFolder!,
                        //             path.join(
                        //                 "web-templates",
                        //                 webTemplateFolder,
                        //                 `${webTemplateFile}.webtemplate.source.html`
                        //             )
                        //         ),
                        //         false,
                        //         true,
                        //         true
                        //     );
                        // const yoWebTemplateGenerator =
                        //     "@microsoft/powerpages:webtemplate";
                        const command = `"${yoPath}" ${YoSubGenerator.WEBTEMPLATE} "${value}"`;
                        await createRecord(
                            webTemplate,
                            command,
                            portalDir,
                            watcher
                        );
                        // vscode.window
                        //     .withProgress(
                        //         {
                        //             location: vscode.ProgressLocation.Notification,
                        //             title: "Creating web template...",
                        //         },
                        //         () => {
                        //             return new Promise((resolve, reject) => {
                        //                 exec(
                        //                     command,
                        //                     { cwd: portalDir },
                        //                     (error, stderr) => {
                        //                         if (error) {
                        //                             vscode.window.showErrorMessage(
                        //                                 error.message
                        //                             );
                        //                             reject(error);
                        //                         } else {
                        //                             resolve(stderr);
                        //                         }
                        //                     }
                        //                 );
                        //             });
                        //         }
                        //     )
                        //     .then(() => {
                        //         vscode.window.showInformationMessage(
                        //             "Web template Created!"
                        //         );
                        //     });

                        // watcher.onDidCreate(async (uri) => {
                        //     await vscode.window.showTextDocument(uri);
                        // });
                    }
                });
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
};
