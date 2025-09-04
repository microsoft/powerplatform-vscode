/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

// PowerPages Navigation Provider Constants

export const PowerPagesNavigationConstants = {
    commands: {
        RUNTIME_PREVIEW: 'powerpages.powerPagesFileExplorer.powerPagesRuntimePreview',
        BACK_TO_STUDIO: 'powerpages.powerPagesFileExplorer.backToStudio',
        OPEN_IN_DESKTOP: 'powerpages.powerPagesFileExplorer.openInDesktop'
    },
    icons: {
        PREVIEW_SITE: 'previewSite.svg',
        POWER_PAGES: 'powerPages.svg',
        DESKTOP: 'desktop.svg',
        THEME_VARIANTS: ['desktop', 'powerPages', 'previewSite']
    },
    paths: {
        ASSETS: 'src/web/client/assets',
        LIGHT_ICONS: 'light',
        DARK_ICONS: 'dark'
    },
    endpoints: {
        CACHE_CONFIG: '_services/cache/config'
    },
    urls: {
        VS_CODE_MARKETPLACE: 'https://marketplace.visualstudio.com/items?itemName=microsoft-IsvExpTools.powerplatform-vscode',
        VS_CODE_DOWNLOAD: 'https://code.visualstudio.com/download',
        DESKTOP_URI_SCHEME: 'vscode://microsoft-IsvExpTools.powerplatform-vscode/open'
    },
    headers: {
        AUTHORIZATION: 'authorization',
        BEARER_PREFIX: 'Bearer ',
        ACCEPT: 'Accept',
        CONTENT_TYPE: 'Content-Type',
        ACCEPT_ALL: '*/*',
        TEXT_PLAIN: 'text/plain'
    },
    urlParams: {
        WEBSITE_ID: 'websiteid',
        ENV_ID: 'envid',
        ORG_URL: 'orgurl',
        REGION: 'region',
        SCHEMA: 'schema',
        TENANT_ID: 'tenantid',
        PORTAL_ID: 'websitepreviewid',
        SITE_NAME: 'websitename',
        SITE_URL: 'websitepreviewurl'
    },
    values: {
        TRUE: 'true',
        FALSE: 'false'
    },
    messages: {
        PREVIEW_SITE: "Preview site",
        OPEN_IN_POWER_PAGES_STUDIO: "Open in Power Pages studio",
        OPEN_IN_VS_CODE_DESKTOP: "Open in VS Code Desktop",
        PREVIEW_SITE_URL_INVALID: "Preview site URL is not valid",
        OPENING_PREVIEW_SITE: "Opening preview site...",
        POWER_PAGES_STUDIO_URL_NOT_AVAILABLE: "Power Pages studio URL is not available",
        WEBSITE_ID_NOT_AVAILABLE: "Website ID is not available",
        ENVIRONMENT_ID_NOT_AVAILABLE: "Environment ID is not available",
        UNABLE_TO_GENERATE_DESKTOP_URL: "Unable to generate VS Code Desktop URL",
        OPENING_IN_VS_CODE_DESKTOP: "Opening in VS Code Desktop. If it doesn't open or shows an error, you may need to install VS Code or update the Power Platform extension.",
        DOWNLOAD_VS_CODE: "Download VS Code",
        UPDATE_EXTENSION: "Update Extension",
        FAILED_TO_GENERATE_DESKTOP_URL: "Failed to generate VS Code Desktop URL: {0}",
        FAILED_TO_OPEN_IN_DESKTOP: "Failed to open in VS Code Desktop: {0}"
    }
};
