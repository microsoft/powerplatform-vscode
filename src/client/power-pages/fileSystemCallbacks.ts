/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { getCurrentWorkspaceURI, getExcludedFileGlobPattern, getFileProperties, getPowerPageEntityType, getRegExPattern } from "./commonUtility";
import { PowerPagesEntityType } from "./constants";
import { cleanupRelatedFiles, fileRenameValidation, updateEntityPathNames } from "./fileSystemUpdatesUtility";
import { FileDeleteEvent, FileRenameEvent, sendTelemetryEvent, UserFileDeleteEvent, UserFileRenameEvent } from "../../common/OneDSLoggerTelemetry/telemetry/telemetry";
import { showDiagnosticMessage, validateTextDocument } from "./validationDiagnostics";

export async function handleFileSystemCallbacks(
    context: vscode.ExtensionContext
) {
    // Add file system callback flows here - for rename and delete file actions
    await processOnDidDeleteFiles(context);
    await processOnDidRenameFiles(context);
}

async function processOnDidDeleteFiles(
    context: vscode.ExtensionContext
) {
    context.subscriptions.push(
        vscode.workspace.onDidDeleteFiles(async (e) => {
            let currentWorkspaceURI: vscode.Uri | undefined;

            if (e.files.length > 0) {

                const startTime = performance.now();
                try {
                    const allFileNames: string[] = [];
                    currentWorkspaceURI = getCurrentWorkspaceURI(e.files[0].path);
                    await Promise.all(e.files.map(async f => {
                        const fileEntityType = getPowerPageEntityType(f.path);

                        // Usage of FileDeleteEvent per file
                        sendTelemetryEvent({ eventName: FileDeleteEvent, fileEntityType: PowerPagesEntityType[fileEntityType], methodName: processOnDidDeleteFiles.name });

                        if (fileEntityType === PowerPagesEntityType.UNKNOWN) {
                            return;
                        }

                        const fileProperties = getFileProperties(f.path);
                        if (fileProperties.fileName && fileProperties.fileCompleteName) {
                            await cleanupRelatedFiles(f.path, fileEntityType, fileProperties);

                            // TODO - Add search validation for entity guid
                            allFileNames.push(fileProperties.fileName);
                        }
                    }));

                    if (currentWorkspaceURI && allFileNames.length > 0) {
                        const patterns = getRegExPattern(allFileNames);
                        const allDocumentsUriInWorkspace = await vscode.workspace.findFiles(`**/*.*`, getExcludedFileGlobPattern(allFileNames), 1000);
                        allDocumentsUriInWorkspace.forEach(async uri =>
                            await validateTextDocument(uri, patterns, true)
                        );

                        // Show notification to check for diagnostics
                        showDiagnosticMessage();
                    }
                } catch (error) {
                    sendTelemetryEvent({ methodName: processOnDidDeleteFiles.name, eventName: UserFileDeleteEvent, numberOfFiles: e.files.length.toString(), durationInMills: (performance.now() - startTime), exception: error as Error });
                }

                // Performance of UserFileDeleteEvent
                sendTelemetryEvent({ methodName: processOnDidDeleteFiles.name, eventName: UserFileDeleteEvent, numberOfFiles: e.files.length.toString(), durationInMills: (performance.now() - startTime) });
            }
        })
    );
}

async function processOnDidRenameFiles(
    context: vscode.ExtensionContext
) {
    context.subscriptions.push(
        vscode.workspace.onDidRenameFiles(async (e) => {
            if (e.files.length > 0) {

                const startTime = performance.now();
                try {
                    const allFileNames: string[] = [];
                    const currentWorkspaceURI = getCurrentWorkspaceURI(e.files[0].oldUri.fsPath);

                    await Promise.all(e.files.map(async f => {
                        const fileEntityType = getPowerPageEntityType(f.oldUri.path);

                        // Usage of FileRenameEvent per file
                        sendTelemetryEvent({ methodName: processOnDidRenameFiles.name, eventName: FileRenameEvent, fileEntityType: PowerPagesEntityType[fileEntityType] });

                        if (fileEntityType === PowerPagesEntityType.UNKNOWN) {
                            return;
                        }

                        const fileProperties = getFileProperties(f.oldUri.path);

                        if (fileProperties.fileName && fileProperties.fileCompleteName) {
                            const isValidationSuccess = await fileRenameValidation(f.oldUri, f.newUri, fileProperties);
                            if (isValidationSuccess) {
                                await updateEntityPathNames(f.oldUri, f.newUri, fileProperties, fileEntityType);
                            }

                            allFileNames.push(fileProperties.fileName);
                        }
                    }));

                    if (currentWorkspaceURI && allFileNames.length > 0) {
                        const patterns = getRegExPattern(allFileNames);
                        const allDocumentsUriInWorkspace = await vscode.workspace.findFiles(`**/*.*`, getExcludedFileGlobPattern(allFileNames), 1000);
                        allDocumentsUriInWorkspace.forEach(async uri =>
                            await validateTextDocument(uri, patterns, true)
                        );

                        // Show notification to check for diagnostics
                        showDiagnosticMessage();
                    }
                } catch (error) {
                    sendTelemetryEvent({ methodName: processOnDidRenameFiles.name, eventName: UserFileRenameEvent, numberOfFiles: e.files.length.toString(), durationInMills: (performance.now() - startTime), exception: error as Error });
                }

                // Performance of UserFileRenameEvent
                sendTelemetryEvent({ methodName: processOnDidRenameFiles.name, eventName: UserFileRenameEvent, numberOfFiles: e.files.length.toString(), durationInMills: (performance.now() - startTime) });
            }
        })
    );
}
