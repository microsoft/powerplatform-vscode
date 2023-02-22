/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

import { getCurrentWorkspaceURI, getDeletePathUris, getFileProperties, getPowerPageEntityType } from "./commonUtility";
import { PowerPagesEntityType } from "./constants";
import { fileRenameValidation, updateEntityPathNames } from "./fileSystemUpdatesUtility";
import { validateTextDocument } from "./validationDiagnostics";
//const localize: nls.LocalizeFunc = nls.loadMessageBundle();

// const activeEditor = vscode.window.activeTextEditor;

export async function handleFileSystemCallbacks(context: vscode.ExtensionContext) {
    // Add file system callback flows here - for rename and delete file actions
    await processOnDidDeleteFiles(context);

    // await registerCreateCommands(context);
    await processOnDidRenameFiles(context);
}

async function processOnDidDeleteFiles(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onDidDeleteFiles(async (e) => {
            // localize("powerPages.deleteFileConfirmation", `Are you sure you want to delete these files?`)
            let deleteInfoMessage = ``;
            const edit: vscode.MessageItem = {
                title: "Delete"
            };
            let currentWorkspaceURI: vscode.Uri | undefined;

            if (e.files.length > 0) {
                const singleFileUriPath = e.files[0].path;
                let fileProperties = getFileProperties(singleFileUriPath);

                currentWorkspaceURI = getCurrentWorkspaceURI(singleFileUriPath);
                // localize("powerPages.deleteFileConfirmation", `Are you sure you want to delete {0}?`, `"${fileProperties.fileName}")
                deleteInfoMessage = fileProperties.fileName ? `Are you sure you want to delete "${fileProperties.fileName}"?` :
                    `Are you sure you want to delete these files?`;

                await vscode.window.showInformationMessage(deleteInfoMessage,
                    {
                        //localize("powerPages.deleteFileWarningMessage", `Places where this file has been used might be affected.`)
                        detail: `Places where this file has been used might be affected.`,
                        modal: true
                    }, edit)
                    .then(async selection => {
                        if (selection) {
                            try {
                                let patterns: RegExp[] = [];
                                patterns = await Promise.all(e.files.map(async f => {
                                    const fileEntityType = getPowerPageEntityType(f.path)
                                    if (fileEntityType !== PowerPagesEntityType.UNKNOWN) {
                                        fileProperties = getFileProperties(f.path);

                                        if (fileProperties.fileCompleteName) {
                                            const pathUris = getDeletePathUris(f.path, fileEntityType, fileProperties);
                                            pathUris.forEach(async pathUri => {
                                                await vscode.workspace.fs.delete(pathUri, { recursive: true, useTrash: true });
                                            });

                                            // TODO - Add search validation for entity guid
                                            return RegExp(`${fileProperties.fileName}`, "g");
                                        }
                                    }
                                })) as RegExp[];

                                if (currentWorkspaceURI && patterns.length > 0) {
                                    const allDocumentsUriInWorkspace = await vscode.workspace.findFiles(`**/*.*`, `**/*.{png,jpg,jpeg,gif,mp4}`, 1000);
                                    allDocumentsUriInWorkspace.forEach(async uri =>
                                        await validateTextDocument(uri, patterns, true));

                                }
                            } catch (error) {
                                // Log telemetry
                            }
                        }
                    });
            }
        })
    );
}

async function processOnDidRenameFiles(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onDidRenameFiles(async (e) => {
            if (e.files.length > 0) {
                try {
                    let patterns: RegExp[] = [];
                    const currentWorkspaceURI = getCurrentWorkspaceURI(e.files[0].oldUri.fsPath);

                    patterns = await Promise.all(e.files.map(async f => {
                        const fileEntityType = getPowerPageEntityType(f.oldUri.path);
                        if (fileEntityType !== PowerPagesEntityType.UNKNOWN) {
                            const fileProperties = getFileProperties(f.oldUri.path);

                            if (fileProperties.fileCompleteName) {
                                const isValidationSuccess = await fileRenameValidation(f.oldUri, f.newUri, fileProperties);
                                if (isValidationSuccess) {
                                    await updateEntityPathNames(f.oldUri, f.newUri, fileProperties, fileEntityType);
                                }

                                // TODO - Add search validation for entity guid
                                return RegExp(`${fileProperties.fileName}`, "g");
                            }
                        }
                    })) as RegExp[];

                    if (currentWorkspaceURI && patterns.length > 0) {
                        const allDocumentsUriInWorkspace = await vscode.workspace.findFiles(`**/*.*`, `**/*.{png,jpg,jpeg,gif,mp4}`, 1000);
                        allDocumentsUriInWorkspace.forEach(async uri =>
                            await validateTextDocument(uri, patterns, true)
                        );
                    }
                } catch (error) {
                    // Log telemetry
                }
            }
        })
    );
}

// async function registerCreateCommands(_context: vscode.ExtensionContext) {
//     _context.subscriptions.push(
//         vscode.commands.registerCommand(
//             "microsoft-powerapps-portals.pagetemplate",
//             async (uri) => {
//                 const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(uri, activeEditor)
//                 if(selectedWorkspaceFolder){createPageTemplate(_context, selectedWorkspaceFolder);}
//             }
//         )
//     )
// }

