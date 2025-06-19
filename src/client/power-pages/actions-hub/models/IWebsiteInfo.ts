/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SiteVisibility } from "./SiteVisibility";
import { WebsiteStatus } from "./WebsiteStatus";

export interface IWebsiteInfo {
    name: string;
    websiteId: string;
    dataModelVersion: 1 | 2;
    websiteUrl: string;
    status: WebsiteStatus | undefined;
    isCurrent: boolean;
    siteVisibility: SiteVisibility | undefined;
    siteManagementUrl: string;
    folderPath?: string;
    creator: string;
    createdOn: string;
    languageCode?: string;
    isCodeSite: boolean;
}
