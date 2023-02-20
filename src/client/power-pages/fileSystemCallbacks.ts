/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { createPageTemplate } from "../powerpages/PageTemplate";
import { getSelectedWorkspaceFolder } from "../powerpages/utils/CommonUtils";
//import * as nls from 'vscode-nls';
import { getCurrentWorkspaceURI, getDeletePathUris, getFileProperties, getPowerPageEntityType } from "./commonUtility";
import { PowerPagesEntityType } from "./constants";
import { fileRenameValidation, updateEntityPathNames } from "./fileSystemUpdatesUtility";
import { validateTextDocument } from "./validationDiagnostics";
//const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const activeEditor = vscode.window.activeTextEditor;

export async function handleFileSystemCallbacks(context: vscode.ExtensionContext) {
    // Add file system callback flows here - for rename and delete file actions
    await processOnDidDeleteFiles(context);

    await registerCreateCommands(context);
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
                const singleFileFsPath = e.files[0].fsPath;
                let fileProperties = getFileProperties(singleFileFsPath);

                currentWorkspaceURI = getCurrentWorkspaceURI(singleFileFsPath);
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
                            let patterns: RegExp[] = [];
                            patterns = await Promise.all(e.files.map(async f => {
                                const fileEntityType = getPowerPageEntityType(f.fsPath)
                                if (fileEntityType !== PowerPagesEntityType.UNKNOWN) {
                                    fileProperties = getFileProperties(f.fsPath);

                                    if (fileProperties.fileCompleteName) {
                                        const pathUris = getDeletePathUris(f.fsPath, fileEntityType, fileProperties);
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
                let patterns: RegExp[] = [];
                const currentWorkspaceURI = getCurrentWorkspaceURI(e.files[0].oldUri.fsPath);

                patterns = await Promise.all(e.files.map(async f => {
                    const fileEntityType = getPowerPageEntityType(f.oldUri.fsPath);
                    if (fileEntityType !== PowerPagesEntityType.UNKNOWN) {
                        const fileProperties = getFileProperties(f.oldUri.fsPath);

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
            }
        })
    );
}

async function registerCreateCommands(_context: vscode.ExtensionContext) {
    _context.subscriptions.push(
        vscode.commands.registerCommand(
            "microsoft-powerapps-portals.pagetemplate",
            async (uri) => {
                const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(uri, activeEditor)
                if(selectedWorkspaceFolder){createPageTemplate(_context, selectedWorkspaceFolder);}
            }
        )
    )
}

