/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Constants for URI handler functionality
 */
export const URI_CONSTANTS = {
    EXTENSION_ID: 'microsoft-IsvExpTools.powerplatform-vscode',
    PATHS: {
        PCF_INIT: '/pcfInit',
        OPEN: '/open'
    },
    PARAMETERS: {
        WEBSITE_ID: 'websiteid',
        ENV_ID: 'envid',
        ORG_URL: 'orgurl',
        SCHEMA: 'schema',
        SITE_NAME: 'sitename',
        WEBSITE_NAME: 'websitename',
        SITE_URL: 'siteurl',
        WEBSITE_PREVIEW_URL: 'websitepreviewurl'
    },
    SCHEMA_VALUES: {
        PORTAL_SCHEMA_V2: 'portalschemav2'
    },
    MODEL_VERSIONS: {
        VERSION_1: 1,
        VERSION_2: 2
    },
    TIMEOUTS: {
        COMPLETION_DIALOG: 30000 // 30 seconds
    }
} as const;

/**
 * Enum for URI paths
 */
export const enum UriPath {
    PcfInit = '/pcfInit',
    Open = '/open',
}
