/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import fs from 'fs';

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
    rootWebPageId?: string;
}

export interface IFileInfo {
    entityId: string;
    entityName: string;
    fileName?: string;
}

export interface ISearchQueryMatch {
    uri: vscode.Uri;
    ranges: vscode.Range[];
    preview: string;
    matches: vscode.Range[];
}

export interface ISearchQueryResults {
    matches: ISearchQueryMatch[];
    limitHit: boolean;
}

export interface IApiRequestParams {
    aibEndPoint: string;
    apiToken: string;
    data: unknown;
}

export interface ITestLogParams {
    testName: string,
    testStartTime: Date,
    testEndTime: Date,
    actualResponse: string,
    status: string,
    logStream: fs.WriteStream
}
