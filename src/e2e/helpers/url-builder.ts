/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Builds the VS Code Web URL with Power Pages query parameters.
 * Parameters mirror the queryParameters enum in src/web/client/common/constants.ts.
 */

interface TestSiteConfig {
    orgUrl: string;
    websiteId: string;
    websitePreviewId: string;
    envId: string;
    organizationId: string;
    tenantId: string;
    websiteName?: string;
    websitePreviewUrl?: string;
    entityId?: string;
    geo?: string;
    orgGeo?: string;
    siteVisibility?: string;
    region?: string;
    sku?: string;
}

export function getTestSiteConfigFromEnv(): TestSiteConfig {
    const required = ['PP_TEST_ORG_URL', 'PP_TEST_WEBSITE_ID', 'PP_TEST_WEBSITE_PREVIEW_ID',
        'PP_TEST_ENV_ID', 'PP_TEST_ORG_ID', 'PP_TEST_TENANT_ID'];

    for (const envVar of required) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    }

    return {
        orgUrl: process.env.PP_TEST_ORG_URL!,
        websiteId: process.env.PP_TEST_WEBSITE_ID!,
        websitePreviewId: process.env.PP_TEST_WEBSITE_PREVIEW_ID!,
        envId: process.env.PP_TEST_ENV_ID!,
        organizationId: process.env.PP_TEST_ORG_ID!,
        tenantId: process.env.PP_TEST_TENANT_ID!,
        websiteName: process.env.PP_TEST_WEBSITE_NAME ?? 'Test Site',
        websitePreviewUrl: process.env.PP_TEST_WEBSITE_PREVIEW_URL ?? '',
        entityId: process.env.PP_TEST_ENTITY_ID,
        geo: process.env.PP_TEST_GEO ?? 'WUS',
        orgGeo: process.env.PP_TEST_ORG_GEO ?? 'US',
        siteVisibility: process.env.PP_TEST_SITE_VISIBILITY ?? 'public',
        region: process.env.PP_TEST_REGION ?? 'test',
        sku: process.env.PP_TEST_SKU ?? 'Production',
    };
}

export function buildVSCodeWebUrl(config: TestSiteConfig): string {
    const baseUrl = 'https://insiders.vscode.dev/power/portal/webpages';
    const entityPath = config.entityId ? `/${config.entityId}` : '';

    // Keys must be lowercase to match the queryParameters enum and the
    // extension's key-lowercasing parse logic (see extension.ts line 90).
    const params = new URLSearchParams({
        datasource: 'Dataverse',
        orgurl: config.orgUrl,
        schema: 'PortalSchemaV2',
        websiteid: config.websiteId,
        websitename: config.websiteName ?? 'Test Site',
        websitepreviewid: config.websitePreviewId,
        referrer: 'PowerPagesHome',
        organizationid: config.organizationId,
        tenantid: config.tenantId,
        sitevisibility: config.siteVisibility ?? 'public',
        region: config.region ?? 'test',
        envid: config.envId,
        geo: config.geo ?? 'WUS',
        enablemultifile: 'true',
        referrersource: 'SiteDetailCard',
        orggeo: config.orgGeo ?? 'US',
        sku: config.sku ?? 'Production',
    });

    if (config.websitePreviewUrl) {
        params.set('websitepreviewurl', config.websitePreviewUrl);
    }

    return `${baseUrl}${entityPath}?${params.toString()}`;
}
