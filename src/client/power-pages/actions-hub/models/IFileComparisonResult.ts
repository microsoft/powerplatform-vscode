/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SiteVisibility } from "./SiteVisibility";

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

/**
 * Interface for storing comparison results per site
 */
export interface ISiteComparisonResults {
    siteName: string;
    localSiteName: string;
    environmentName: string;
    websiteId: string;
    environmentId: string;
    comparisonResults: IFileComparisonResult[];
    /** Whether this comparison was imported from an export file */
    isImported?: boolean;
    /** ISO 8601 timestamp when the comparison was exported (only set for imported comparisons) */
    exportedAt?: string;
    /** The data model version of the site (1 = Standard, 2 = Enhanced) */
    dataModelVersion?: 1 | 2;
    /** The website URL */
    websiteUrl?: string;
    /** The site visibility (public, private, etc.) */
    siteVisibility?: SiteVisibility;
    /** The creator of the site */
    creator?: string;
    /** ISO 8601 timestamp when the site was created */
    createdOn?: string;
}
