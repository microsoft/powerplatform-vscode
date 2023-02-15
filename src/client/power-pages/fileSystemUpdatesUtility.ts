/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from 'fs';
import * as YAML from 'yaml';
import {
    getEntityFolderName,
    getEntityFolderPathIndex,
    getFieldsToUpdate,
    getFileProperties,
    getFileNameProperties,
    getUpdatedFolderPath,
    getValidatedEntityPath,
    IFileProperties,
    isSingleFileEntity,
    isValidRenamedFile,
    isValidUri
} from "./commonUtility";
import { DataverseFieldAdxPartialUrl, PowerPagesEntityType } from "./constants";

export async function updateEntityPathNames(oldUri: vscode.Uri,
    newUri: vscode.Uri,
    oldFileProperties: IFileProperties,
    fileEntityType: PowerPagesEntityType
) {
    const entityFolderName = getEntityFolderName(oldUri.fsPath);
    if (isValidUri(oldUri.fsPath) &&
        oldFileProperties.fileName &&
        isValidRenamedFile(oldUri.fsPath, entityFolderName, oldFileProperties.fileName, fileEntityType)
    ) {
        const newFileProperties = getFileProperties(newUri.fsPath);
        console.log("newFileProperties",newFileProperties)
        const entityFolderIndex = getEntityFolderPathIndex(newUri.fsPath, oldFileProperties.fileName, fileEntityType, entityFolderName);
        const fileEntityFolderPath = oldFileProperties.fileFolderPath.substring(0, entityFolderIndex);
        const allFilesInFolder = await vscode.workspace.findFiles(fileEntityType === PowerPagesEntityType.WEBFILES ?
            `**/${entityFolderName}/${oldFileProperties.fileName}.*` : `**/${entityFolderName}/${oldFileProperties.fileName.toLowerCase()}/**/*`);

        if (newFileProperties.fileName) {
            if (fileEntityType !== PowerPagesEntityType.ADVANCED_FORMS) {
                await Promise.all(allFilesInFolder.map(async file => {

                    const fileProperties = getFileProperties(file.fsPath);
                    
                    if (fileProperties.fileCompleteName) {
                        const newFilePath = file.fsPath.replace(fileProperties.fileCompleteName, [newFileProperties.fileName, fileProperties.fileExtension].join('.'));
                        if (newFilePath !== file.fsPath) {
                            await vscode.workspace.fs.rename(file, vscode.Uri.file(newFilePath), { overwrite: true });
                        }
                    }
                }));
            }
            
            const isUpdateNeeded = isSingleFileEntity(fileEntityType);
            // FolderName update
            if (!isUpdateNeeded) {
                await vscode.workspace.fs.rename(vscode.Uri.file(fileEntityFolderPath),
                    getUpdatedFolderPath(fileEntityFolderPath, oldFileProperties.fileName, newFileProperties.fileName),
                    { overwrite: true });

            }

            // File Name update in yml file
            const ymlFileInFolder = await vscode.workspace.findFiles(isUpdateNeeded ?
                `**/${entityFolderName}/${newFileProperties.fileName}.*.yml` : `**/${entityFolderName}/${newFileProperties.fileName.toLowerCase()}/**/*.yml`);
            ymlFileInFolder.forEach(file => {
                updateEntityNameInYml(file.fsPath, fileEntityType);

            });
        }
    }
}

export async function fileRenameValidation(oldUri: vscode.Uri,
    newUri: vscode.Uri,
    oldFileProperties: IFileProperties
) {
    let success = true;
    if (isValidUri(oldUri.fsPath) && oldFileProperties.fileName) {
        const newFileProperties = getFileProperties(newUri.fsPath);

        if (oldFileProperties.fileExtension !== newFileProperties.fileExtension && newFileProperties.fileName && oldFileProperties.fileExtension) {
            await vscode.workspace.fs.rename(newUri, getValidatedEntityPath(newFileProperties.fileFolderPath, newFileProperties.fileName, oldFileProperties.fileExtension), { overwrite: true });
        } else if (oldFileProperties.fileExtension === '') { // revert name changes - entity folder re-naming is not a valid scenario
            await vscode.workspace.fs.rename(newUri, oldUri, { overwrite: true });
            success = false;
        }
    }
    return success;
}

export function updateEntityNameInYml(fsPath: string, fileEntityType: PowerPagesEntityType) {
    try {

        const fileNameProperties = getFileNameProperties(fsPath, fileEntityType);
        const fileContents = fs.readFileSync(fsPath, 'utf8');
        
        
        
        const parsedFileContents = YAML.parse(fileContents);
        // update data object
        const fieldsToUpdate = getFieldsToUpdate(fileEntityType);

        fieldsToUpdate.forEach(field => {
            if (field === DataverseFieldAdxPartialUrl) {
console.log("fileNameProperties",parsedFileContents[field])

                parsedFileContents[field] = fileNameProperties.fileName;
            } else {
                parsedFileContents[field] = fileNameProperties.formattedFileName;
            }
        });

        const newFileContents = YAML.stringify(parsedFileContents);
        fs.writeFileSync(fsPath, newFileContents);

    } catch (e) {
        console.log("err",e)
        // TODO - update for telemetry
    }
}
