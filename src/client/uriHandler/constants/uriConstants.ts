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
        OPEN: '/open',
        METADATA_DIFF_IMPORT: '/metadataDiffImport',
        AGENTIC_CREATE: '/agenticCreate',
        PAC_CREATE: '/pacCreate'
    },
    PARAMETERS: {
        WEBSITE_ID: 'websiteid',
        ENV_ID: 'envid',
        ORG_URL: 'orgurl',
        SCHEMA: 'schema',
        SITE_NAME: 'sitename',
        WEBSITE_NAME: 'websitename',
        SITE_URL: 'siteurl',
        WEBSITE_PREVIEW_URL: 'websitepreviewurl',
        FILE_PATH: 'filePath',
        REGION: 'region',
        TENANT_ID: 'tenantid',
        SOURCE: 'source',
        AGENT_HOST: 'agenthost',
        REFERRER_SESSION_ID: 'referrersessionid',
        VERSION: 'v'
    },
    SCHEMA_VALUES: {
        PORTAL_SCHEMA_V2: 'portalschemav2'
    },
    SOURCE_VALUES: {
        POWER_PAGES_HOME: 'powerPagesHome'
    },
    AGENT_HOST_VALUES: {
        COPILOT: 'copilot',
        CLAUDE: 'claude',
        AUTO: 'auto'
    },
    CONTRACT_VERSION: {
        CURRENT: '1',
        SUPPORTED: ['1'] as const
    },
    MODEL_VERSIONS: {
        VERSION_1: 1,
        VERSION_2: 2
    },
    TIMEOUTS: {
        COMPLETION_DIALOG: 30000 // 30 seconds
    },
    // TODO: confirm final install-guide URLs with design
    AGENT_HOST_INSTALL_GUIDE_URLS: {
        copilot: 'https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/install-copilot-cli',
        claude: 'https://code.claude.com/docs/en/setup'
    },
    // Resume markers remain fresh for 10 minutes.
    RESUME_MARKER: {
        KEY: 'powerPages.agenticCreate.resumeMarker',
        TTL_MS: 600000
    }
} as const;

/**
 * Enum for URI paths
 */
export const enum UriPath {
    PcfInit = '/pcfInit',
    Open = '/open',
    MetadataDiffImport = '/metadataDiffImport',
    AgenticCreate = '/agenticCreate',
    PacCreate = '/pacCreate',
}
