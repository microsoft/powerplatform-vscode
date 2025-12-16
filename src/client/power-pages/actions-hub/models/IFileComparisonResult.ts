/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Constants for file comparison status values
 */
export const FileComparisonStatus = {
    MODIFIED: "modified",
    ADDED: "added",
    DELETED: "deleted"
} as const;

export type FileComparisonStatusType = typeof FileComparisonStatus[keyof typeof FileComparisonStatus];

export interface IFileComparisonResult {
    localPath: string;
    remotePath: string;
    relativePath: string;
    status: FileComparisonStatusType;
}
