/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ITelemetry } from "../telemetry/ITelemetry";
//import * as nls from 'vscode-nls';
import { getCurrentWorkspaceURI, getDeletePathUris, getFileProperties, getPowerPageEntityType } from "./commonUtility";
import { PowerPagesEntityType } from "./constants";
import { fileRenameValidation, updateEntityPathNames } from "./fileSystemUpdatesUtility";
import { showDiagnosticMessage, validateTextDocument } from "./validationDiagnostics";
//const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function handleFileSystemCallbacks(
    context: vscode.ExtensionContext,
    telemetry: ITelemetry
) {
    // Add file system callback flows here - for rename and delete file actions
    await processOnDidDeleteFiles(context, telemetry);
    await processOnDidRenameFiles(context, telemetry);
}

async function processOnDidDeleteFiles(
    context: vscode.ExtensionContext,
    telemetry: ITelemetry
) {
    context.subscriptions.push(
        vscode.workspace.onDidDeleteFiles(async (e) => {
            let currentWorkspaceURI: vscode.Uri | undefined;

            if (e.files.length > 0) {
                const singleFileUriPath = e.files[0].path;
                let fileProperties = getFileProperties(singleFileUriPath);

                currentWorkspaceURI = getCurrentWorkspaceURI(singleFileUriPath);

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
                        const allDocumentsUriInWorkspace = await vscode.workspace.findFiles(`**/*.*`, `**/*.{png,jpg,jpeg,gif,mp4,portalconfig**}`, 1000);
                        allDocumentsUriInWorkspace.forEach(async uri =>
                            await validateTextDocument(uri, patterns, true)
                        );

                        // Show notification to check for diagnostics
                        showDiagnosticMessage();
                    }
                } catch (error) {
                    const errorMsg = (error as Error)?.message;
                    telemetry.sendTelemetryErrorEvent("onDidDeleteFiles", {}, {}, [errorMsg]);
                    telemetry.sendTelemetryException(error as Error);
                }
            }
        })
    );
}

async function processOnDidRenameFiles(
    context: vscode.ExtensionContext,
    telemetry: ITelemetry
) {
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

                                return RegExp(`${fileProperties.fileName}`, "g");
                            }
                        }
                    })) as RegExp[];

                    if (currentWorkspaceURI && patterns.length > 0) {
                        const allDocumentsUriInWorkspace = await vscode.workspace.findFiles(`**/*.*`, `**/*.{png,jpg,jpeg,gif,mp4,portalconfig**}`, 1000);
                        allDocumentsUriInWorkspace.forEach(async uri =>
                            await validateTextDocument(uri, patterns, true)
                        );

                        // Show notification to check for diagnostics
                        showDiagnosticMessage();
                    }
                } catch (error) {
                    const errorMsg = (error as Error)?.message;
                    telemetry.sendTelemetryErrorEvent("onDidDeleteFiles", {}, {}, [errorMsg]);
                    telemetry.sendTelemetryException(error as Error);
                }
            }
        })
    );
}
