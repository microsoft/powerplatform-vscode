/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SiteVisibility } from "./SiteVisibility";
import { FileComparisonStatusType } from "./IFileComparisonResult";

/**
 * Export format version for metadata diff exports
 */
export const METADATA_DIFF_EXPORT_VERSION = "1.0";

/**
 * Represents the exported metadata diff data structure
 */
export interface IMetadataDiffExport {
    /** Version of the export format */
    version: string;
    /** Version of the VS Code extension used to generate this export */
    extensionVersion: string;
    /** ISO 8601 timestamp when the export was created */
    exportedAt: string;
    /** ID of the website being compared */
    websiteId: string;
    /** Name of the website being compared */
    websiteName: string;
    /** ID of the environment */
    environmentId: string;
    /** Name of the environment */
    environmentName: string;
    /** Name of the local site */
    localSiteName: string;
    /** Data model version of the site (1 = Standard, 2 = Enhanced) */
    dataModelVersion?: 1 | 2;
    /** The website URL */
    websiteUrl?: string;
    /** The site visibility (public, private, etc.) */
    siteVisibility?: SiteVisibility;
    /** The creator of the site */
    creator?: string;
    /** ISO 8601 timestamp when the site was created */
    createdOn?: string;
    /** Array of file comparison results with content */
    files: IExportableFileComparisonResult[];
}

/**
 * Represents a file comparison result with content for export
 */
export interface IExportableFileComparisonResult {
    /** Relative path of the file within the site */
    relativePath: string;
    /** Status of the file comparison (modified, added, deleted) */
    status: FileComparisonStatusType;
    /** Base64-encoded content of the local file, null for binary files or deleted files */
    localContent: string | null;
    /** Base64-encoded content of the remote file, null for binary files or added files */
    remoteContent: string | null;
}
