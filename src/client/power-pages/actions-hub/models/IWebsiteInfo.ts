/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { WebsiteStatus } from "./WebsiteStatus";

export interface IWebsiteInfo {
    name: string;
    websiteId: string;
    dataModelVersion: 1 | 2;
    websiteUrl: string;
    status: WebsiteStatus | undefined;
    isCurrent: boolean;
    siteVisibility: string;
    siteManagementUrl: string;
}
