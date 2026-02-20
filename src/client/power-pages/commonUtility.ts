/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import path from "path";
import * as vscode from "vscode";
import { removeTrailingSlash } from "../../debugger/utils";
import * as Constants from "./constants";
import { AUTH_KEYS } from "../../common/OneDSLoggerTelemetry/telemetryConstants";
import { ActiveAuthOutput, ActiveOrgOutput, AuthInfo, CloudInstance, EnvironmentType, OrgInfo } from "../pac/PacTypes";

export interface IFileProperties {
    fileCompleteName?: string,
    fileNameIndex?: number,
    fileName?: string,
    fileExtension: string,
    fileFolderPath: string
}

export interface IFileNameProperties {
    fileName?: string,
    formattedFileName?: string
}

export function getFileProperties(uriPath: string): IFileProperties {
    const filePathTokens = uriPath.split("/");
    const fileCompleteName = filePathTokens.pop();
    let fileNameIndex, fileName, fileExtension = '';

    if (fileCompleteName) {
        fileNameIndex = uriPath.indexOf(fileCompleteName);
        const fileNameTokens = fileCompleteName?.split('.');
        fileName = fileNameTokens.shift();
        fileExtension = fileNameTokens.join('.');
    }

    return {
        fileCompleteName: fileCompleteName,
        fileName: fileName,
        fileExtension: fileExtension,
        fileNameIndex: fileNameIndex,
        fileFolderPath: filePathTokens.join('/') + '/'
    }
}

export function getPowerPageEntityType(uriPath: string): Constants.PowerPagesEntityType {
    let pagesEntityType = Constants.PowerPagesEntityType.UNKNOWN;

    Constants.EntityFolderName.forEach(folderName => {
        folderName = folderName.toLowerCase();

        if (uriPath.includes(`/${folderName}/`)) {
            pagesEntityType = Constants.EntityFolderMap.get(folderName) ?? Constants.PowerPagesEntityType.UNKNOWN;
        }
    });

    return pagesEntityType;
}

export function getDeletePathUris(uriPath: string,
    fileEntityType: Constants.PowerPagesEntityType,
    fileProperties: IFileProperties
): vscode.Uri[] {
    const pathUris: vscode.Uri[] = [];
    const entityFolderName = getEntityFolderName(uriPath);
    if (isValidUri(uriPath) && fileProperties.fileName) {
        if (fileEntityType === Constants.PowerPagesEntityType.WEBFILES) {
            const ymlExtensionIndex = uriPath.indexOf(Constants.WebFileYmlExtension);
            ymlExtensionIndex === -1 ? pathUris.push(vscode.Uri.file(uriPath.concat(Constants.WebFileYmlExtension))) :
                pathUris.push(vscode.Uri.file(uriPath.substring(0, ymlExtensionIndex)));
        } else if (!isSingleFileEntity(fileEntityType)) {
            const folderPathNameIndex = getEntityFolderPathIndex(uriPath, fileProperties.fileName, fileEntityType, entityFolderName);

            pathUris.push(vscode.Uri.file(uriPath.substring(0, folderPathNameIndex)));
        }
    }

    return pathUris;
}

export function isValidUri(uriPath: string): boolean {
    let validUri = true;

    Constants.EntityFolderName.forEach(folderName => {
        if (uriPath.toLowerCase().endsWith(`/${folderName}/`)) {
            validUri = false;
        }
    });

    return validUri;
}

export function getEntityFolderName(uriPath: string): string {
    let entityFolderPath = '';

    if (uriPath.includes(`/${Constants.AdvancedFormsStep}/`)) {
        entityFolderPath = Constants.AdvancedFormsStep;
    } else {
        Constants.EntityFolderName.forEach(folderName => {
            if (uriPath.includes(`/${folderName}/`)) {
                entityFolderPath = folderName;
            }
        });
    }

    return entityFolderPath;
}

export function getEntityFolderPathIndex(uriPath: string, fileName: string, fileEntityType: Constants.PowerPagesEntityType, entityFolderName: string) {
    return isSingleFileEntity(fileEntityType) ? uriPath.indexOf(`/${entityFolderName}/`) + entityFolderName.length + 2 :
        uriPath.indexOf(`/${fileName?.toLowerCase()}/`) + fileName?.length + 2; // offset for path separator
}

export function getValidatedEntityPath(folderPath: string, fileName: string, fileExtension: string): vscode.Uri {
    return vscode.Uri.file(path.join(folderPath, [fileName, fileExtension].join('.')));
}

export function isValidRenamedFile(uriPath: string, entityFolderName: string, fileName: string, fileEntityType: Constants.PowerPagesEntityType): boolean {
    return isSingleFileEntity(fileEntityType) ? uriPath.includes(`/${entityFolderName}/${fileName}`) :
        uriPath.includes(`/${entityFolderName}/${fileName.toLowerCase()}/`);
}

export function getUpdatedFolderPath(uriPath: string, oldFileName: string, newFileName: string): vscode.Uri {
    return vscode.Uri.file(removeTrailingSlash(uriPath.replace(`/${oldFileName.toLowerCase()}/`, `/${newFileName.toLowerCase()}/`)));
}

export function getCurrentWorkspaceURI(fsPath: string): vscode.Uri | undefined {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(fsPath));
    return workspaceFolder ? workspaceFolder.uri : undefined;
}

export function isSingleFileEntity(fileEntityType: Constants.PowerPagesEntityType) {
    return fileEntityType === Constants.PowerPagesEntityType.WEBFILES
        || fileEntityType === Constants.PowerPagesEntityType.TABLE_PERMISSIONS
        || fileEntityType === Constants.PowerPagesEntityType.POLL_PLACEMENTS
        || fileEntityType === Constants.PowerPagesEntityType.PAGE_TEMPLATES
        || fileEntityType === Constants.PowerPagesEntityType.LISTS;
}

export function getFileNameProperties(uriPath: string, fileEntityType: Constants.PowerPagesEntityType): IFileNameProperties {
    const fileProperties = getFileProperties(uriPath);
    let formattedName = fileProperties.fileName?.replace('-', ' ');

    if (fileProperties.fileName) {
        const ymlExtensionIndex = fileProperties.fileCompleteName?.indexOf(Constants.WebFileYmlExtension) ?? -1;

        if (fileEntityType === Constants.PowerPagesEntityType.WEBFILES && ymlExtensionIndex > 0) {
            formattedName = fileProperties.fileCompleteName?.substring(0, ymlExtensionIndex);
        }
    }

    return {
        fileName: fileProperties.fileName,
        formattedFileName: formattedName
    };
}

export function getFieldsToUpdate(fileEntityType: Constants.PowerPagesEntityType): string[] {
    const fieldsToUpdate: string[] = [];

    if (fileEntityType === Constants.PowerPagesEntityType.WEBPAGES) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxTitle);
        fieldsToUpdate.push(Constants.DataverseFieldAdxPartialUrl);
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
    } else if (fileEntityType === Constants.PowerPagesEntityType.WEBFILES) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
        fieldsToUpdate.push(Constants.DataverseFieldFilename);
        fieldsToUpdate.push(Constants.DataverseFieldAdxPartialUrl);
    } else if (fileEntityType === Constants.PowerPagesEntityType.TABLE_PERMISSIONS) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxEntityName);
        fieldsToUpdate.push(Constants.DataverseFieldAdxEntityLogicalName);
    } else if (fileEntityType === Constants.PowerPagesEntityType.CONTENT_SNIPPETS) {
        fieldsToUpdate.push(Constants.DataverseFieldAdxDisplayName);
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
    } else {
        fieldsToUpdate.push(Constants.DataverseFieldAdxName);
    }

    return fieldsToUpdate;
}

const EXCLUDED_BINARY_EXTENSIONS = [
    // Images
    '*.png', '*.jpg', '*.jpeg', '*.gif', '*.ico', '*.bmp', '*.tiff', '*.webp', '*.svg',
    // Video
    '*.mp4',
    // Fonts
    '*.woff', '*.woff2', '*.ttf', '*.eot', '*.otf',
    // Compiled binaries
    '*.dll', '*.exe', '*.bin', '*.so', '*.obj', '*.pdb',
    // Archives
    '*.zip', '*.tar', '*.gz', '*.7z',
    // Documents
    '*.pdf',
    // Source maps
    '*.map',
];

export function getExcludedFileGlobPattern(fileNameArray: string[]): vscode.GlobPattern {
    const exclusions = [...EXCLUDED_BINARY_EXTENSIONS, '.portalconfig**'];

    if (fileNameArray.length > 0) {
        fileNameArray.forEach((name, index) => fileNameArray[index] = name.concat('.*'));
        exclusions.push(...fileNameArray);
    }

    return `**/{${exclusions.join(',')}}`;
}

export function getRegExPattern(fileNameArray: string[]): RegExp[] {
    const patterns: RegExp[] = [];

    if (fileNameArray.length > 0) {
        fileNameArray.forEach(name => patterns.push(RegExp(`${name}`, "ig")));
    }

    return patterns;
}

export function extractAuthInfo(results: ActiveAuthOutput[]): AuthInfo {
    return {
        UserType: findAuthValue(results, AUTH_KEYS.USER_TYPE),
        Cloud: CloudInstance[findAuthValue(results, AUTH_KEYS.CLOUD) as keyof typeof CloudInstance],
        TenantId: findAuthValue(results, AUTH_KEYS.TENANT_ID),
        TenantCountry: findAuthValue(results, AUTH_KEYS.TENANT_COUNTRY),
        User: findAuthValue(results, AUTH_KEYS.USER),
        EntraIdObjectId: findAuthValue(results, AUTH_KEYS.ENTRA_ID_OBJECT_ID),
        Puid: findAuthValue(results, AUTH_KEYS.PUID),
        UserCountryRegion: findAuthValue(results, AUTH_KEYS.USER_COUNTRY_REGION),
        TokenExpires: findAuthValue(results, AUTH_KEYS.TOKEN_EXPIRES),
        Authority: findAuthValue(results, AUTH_KEYS.AUTHORITY),
        EnvironmentGeo: findAuthValue(results, AUTH_KEYS.ENVIRONMENT_GEO),
        EnvironmentId: findAuthValue(results, AUTH_KEYS.ENVIRONMENT_ID),
        EnvironmentType: EnvironmentType[findAuthValue(results, AUTH_KEYS.ENVIRONMENT_TYPE) as keyof typeof EnvironmentType],
        OrganizationId: findAuthValue(results, AUTH_KEYS.ORGANIZATION_ID),
        OrganizationUniqueName: findAuthValue(results, AUTH_KEYS.ORGANIZATION_UNIQUE_NAME),
        OrganizationFriendlyName: findAuthValue(results, AUTH_KEYS.ORGANIZATION_FRIENDLY_NAME)
    };
}

export function extractOrgInfo(orgOutput: ActiveOrgOutput): OrgInfo {
    if (!orgOutput) {
        return {
            OrgId: '',
            UniqueName: '',
            FriendlyName: '',
            OrgUrl: '',
            UserEmail: '',
            UserId: '',
            EnvironmentId: ''
        };
    }

    return  {
        OrgId: orgOutput.OrgId,
        UniqueName: orgOutput.UniqueName,
        FriendlyName: orgOutput.FriendlyName,
        OrgUrl: orgOutput.OrgUrl,
        UserEmail: orgOutput.UserEmail,
        UserId: orgOutput.UserId,
        EnvironmentId: orgOutput.EnvironmentId
    };
}

export function findAuthValue(results: ActiveAuthOutput[], key: string): string {
    return results?.find(obj => obj.Key === key)?.Value ?? '';
}
