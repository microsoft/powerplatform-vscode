/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface IEntityRequestUrl {
    requestUrl: string;
    entityName: string;
}

export interface IAttributePath {
    source: string;
    relativePath: string;
}

export interface IEntityInfo {
    entityId: string;
    entityName: string;
}

export interface IFileInfo {
    entityId: string;
    entityName: string;
    fileName?: string;
}

export interface IContainerData {
    containerId: string;
}
