/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from 'fs';
import * as YAML from 'yaml';
import {
    getEntityFolderName,
    getFieldsToUpdate,
    getFileProperties,
    getFileNameProperties,
    getUpdatedFolderPath,
    getValidatedEntityPath,
    IFileProperties,
    isSingleFileEntity,
    isValidRenamedFile,
    isValidUri,
    getEntityFolderPathIndex,
    getDeletePathUris
} from "./commonUtility";
import { DataverseFieldAdxPartialUrl, PowerPagesEntityType } from "./constants";
import { removeTrailingSlash } from "../../debugger/utils";
import { CleanupRelatedFilesEvent, FileRenameValidationEvent, sendTelemetryEvent, UpdateEntityNameInYmlEvent, UpdateEntityPathNamesEvent } from "../../common/OneDSLoggerTelemetry/telemetry/telemetry";

export async function fileRenameValidation(oldUri: vscode.Uri,
    newUri: vscode.Uri,
    oldFileProperties: IFileProperties
) {
    let success = true;
    try {
        if (isValidUri(oldUri.path) && oldFileProperties.fileName) {
            const newFileProperties = getFileProperties(newUri.path);

            if (oldFileProperties.fileExtension !== newFileProperties.fileExtension && newFileProperties.fileName && oldFileProperties.fileExtension) {
                await vscode.workspace.fs.rename(newUri, getValidatedEntityPath(newFileProperties.fileFolderPath, newFileProperties.fileName, oldFileProperties.fileExtension), { overwrite: true });
            } else if (oldFileProperties.fileExtension === '') { // revert name changes - entity folder re-naming is not a valid scenario
                await vscode.workspace.fs.rename(newUri, oldUri, { overwrite: true });
                success = false;
            }
        }
    } catch (e) {
        sendTelemetryEvent({ methodName: fileRenameValidation.name, eventName: FileRenameValidationEvent, exception: e as Error });
    }
    return success;
}

export async function updateEntityPathNames(oldUri: vscode.Uri,
    newUri: vscode.Uri,
    oldFileProperties: IFileProperties,
    fileEntityType: PowerPagesEntityType
) {
    try {
        const entityFolderName = getEntityFolderName(oldUri.path);
        if (isValidUri(oldUri.path) &&
            oldFileProperties.fileName &&
            isValidRenamedFile(oldUri.path, entityFolderName, oldFileProperties.fileName, fileEntityType)
        ) {
            const newFileProperties = getFileProperties(newUri.path);
            const entityFolderIndex = getEntityFolderPathIndex(newUri.path, oldFileProperties.fileName, fileEntityType, entityFolderName);
            const fileEntityFolderPath = oldFileProperties.fileFolderPath.substring(0, entityFolderIndex);
            const allFilesInFolder = await vscode.workspace.findFiles(fileEntityType === PowerPagesEntityType.WEBFILES ?
                `**/${entityFolderName}/${oldFileProperties.fileName}.*` : `**/${entityFolderName}/${oldFileProperties.fileName.toLowerCase()}/**/*`);

            if (newFileProperties.fileName) {
                if (fileEntityType !== PowerPagesEntityType.ADVANCED_FORMS) {
                    for (const file of allFilesInFolder) {
                        const fileProperties = getFileProperties(file.path);
                        if (fileProperties.fileCompleteName) {
                            const newFilePath = file.fsPath.replace(fileProperties.fileCompleteName, [newFileProperties.fileName, fileProperties.fileExtension].join('.'));
                            if (newFilePath !== file.fsPath) {
                                await vscode.workspace.fs.rename(file, vscode.Uri.file(newFilePath), { overwrite: true });
                            }
                        }
                    }
                }

                const isUpdateNeeded = isSingleFileEntity(fileEntityType);
                // File Name update in yml file
                const ymlFileInFolder = await vscode.workspace.findFiles(isUpdateNeeded ?
                    `**/${entityFolderName}/${newFileProperties.fileName}.*.yml` : `**/${entityFolderName}/${oldFileProperties.fileName.toLowerCase()}/**/*.yml`);
                ymlFileInFolder.forEach(file => {
                    updateEntityNameInYml(file.path, fileEntityType);
                });

                // FolderName update
                if (!isUpdateNeeded) {
                    await vscode.workspace.fs.rename(vscode.Uri.file(removeTrailingSlash(fileEntityFolderPath)),
                        getUpdatedFolderPath(fileEntityFolderPath, oldFileProperties.fileName, newFileProperties.fileName),
                        { overwrite: true });
                }
            }
        }
    } catch (e) {
        sendTelemetryEvent({ methodName: updateEntityPathNames.name, eventName: UpdateEntityPathNamesEvent, exception: e as Error });
    }
}

export async function cleanupRelatedFiles(uriPath: string,
    fileEntityType: PowerPagesEntityType,
    fileProperties: IFileProperties
) {
    try {
        const pathUris = getDeletePathUris(uriPath, fileEntityType, fileProperties);
        pathUris.forEach(async pathUri => {
            await vscode.workspace.fs.delete(pathUri, { recursive: true, useTrash: true });
        });
    } catch (e) {
        sendTelemetryEvent({ methodName: cleanupRelatedFiles.name, eventName: CleanupRelatedFilesEvent, exception: e as Error });
    }
}

function updateEntityNameInYml(uriPath: string,
    fileEntityType: PowerPagesEntityType
) {
    try {
        const uri = vscode.Uri.file(uriPath);
        const fileNameProperties = getFileNameProperties(uriPath, fileEntityType);
        const fileContents = fs.readFileSync(uri.fsPath, 'utf8');
        const parsedFileContents = YAML.parse(fileContents);

        // update data object
        const fieldsToUpdate = getFieldsToUpdate(fileEntityType);
        fieldsToUpdate.forEach(field => {
            if (field === DataverseFieldAdxPartialUrl) {
                parsedFileContents[field] = fileNameProperties.fileName;
            } else {
                parsedFileContents[field] = fileNameProperties.formattedFileName;
            }
        });

        const newFileContents = YAML.stringify(parsedFileContents);
        fs.writeFileSync(uri.fsPath, newFileContents);
    } catch (e) {
        sendTelemetryEvent({ methodName: updateEntityNameInYml.name, eventName: UpdateEntityNameInYmlEvent, exception: e as Error });
    }
}
