/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as nls from 'vscode-nls';
import { getCurrentWorkspaceURI, getDeletePathUris, getFileProperties, isValidDocument } from "./commonUtility";
import { PowerPagesEntityType } from "./constants";
import { validateTextDocument } from "./validationDiagnostics";
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function handleFileSystemCallbacks(context: vscode.ExtensionContext) {
    // Add file system callback flows here - for rename and delete file actions
    await processOnDidDeleteFiles(context);
}

async function processOnDidDeleteFiles(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.workspace.onDidDeleteFiles(async (e) => {
            let deleteInfoMessage = localize("powerPages.deleteFileConfirmation", `Are you sure you want to delete these files?`);
            const deleteInfoMessageDetail = localize("powerPages.deleteFileWarningMessage", "Places where this file has been used might be affected.");
            const FileReferencedByNameMessage = localize("powerPages.searchByNameReferenceMessage", "Deleted file might be referenced by name here.");
            const messageOptions = { detail: deleteInfoMessageDetail, modal: true };
            const edit: vscode.MessageItem = {
                title: "Delete"
            };

            if (e.files.length === 1) {
                const fileProperties = getFileProperties(e.files[0].fsPath);
                if (fileProperties.fileName) {
                    deleteInfoMessage = `Are you sure you want to delete "${fileProperties.fileName}"?`;
                }
            }

            await vscode.window.showInformationMessage(deleteInfoMessage, messageOptions, edit).then(selection => {
                if (selection) {
                    e.files.forEach(async f => {
                        const fileEntityType = isValidDocument(f.fsPath)
                        if (fileEntityType !== PowerPagesEntityType.UNKNOWN) {
                            const fileProperties = getFileProperties(f.fsPath);

                            if (fileProperties.fileCompleteName) {
                                const pathUris = getDeletePathUris(f.fsPath, fileEntityType, fileProperties);
                                pathUris.forEach(pathUri => {
                                    vscode.workspace.fs.delete(pathUri, { recursive: true, useTrash: true });
                                });

                                // TODO - Add search validation for entity guid
                                const currentWorkspaceURI = getCurrentWorkspaceURI();
                                if (currentWorkspaceURI) {
                                    const allDocumentsUriInWorkspace = await vscode.workspace.findFiles(`**/*.*`, `**/.*/**`, 1000);
                                    await allDocumentsUriInWorkspace.forEach(uri =>
                                        validateTextDocument(uri, [RegExp(`${fileProperties.fileName}`, "g")], FileReferencedByNameMessage));
                                }
                            }
                        }
                    });
                }
            });
        })
    );
}
