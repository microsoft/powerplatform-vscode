/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ITelemetry } from '../../../../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { getNL2PageData } from './Nl2PageService';
import { getNL2SiteData } from './Nl2SiteService';
import { NL2SITE_REQUEST_FAILED, NL2PAGE_GENERATING_WEBPAGES, NL2PAGE_RESPONSE_FAILED } from '../../PowerPagesChatParticipantConstants';
import { oneDSLoggerWrapper } from '../../../../OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { VSCODE_EXTENSION_NL2PAGE_REQUEST, VSCODE_EXTENSION_NL2SITE_REQUEST } from '../../PowerPagesChatParticipantTelemetryConstants';

export const createSite = async (intelligenceEndpoint: string, intelligenceApiToken: string, userPrompt: string, sessionId: string, stream: vscode.ChatResponseStream, telemetry: ITelemetry, orgId: string, envID: string, userId: string) => {
    const { siteName, sitePagesList, sitePages, siteDescription } = await fetchSiteAndPageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry, stream, orgId, envID, userId);
    const siteManager = await populateRecords(siteName, sitePagesList, sitePages, telemetry);
    const websiteId = await provisionSite(siteManager);

    return {
        siteName,
        websiteId,
        siteDescription,
    };
};

async function fetchSiteAndPageData(intelligenceEndpoint: string, intelligenceApiToken: string, userPrompt: string, sessionId: string, telemetry: ITelemetry, stream: vscode.ChatResponseStream, orgId: string, envId: string, userId: string) {
    // Call NL2Site service to get initial site content
    telemetry.sendTelemetryEvent(VSCODE_EXTENSION_NL2SITE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_NL2SITE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    const { siteName, pages, siteDescription } = await getNL2SiteData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry, orgId, envId, userId);

    if (!siteName) {
        throw new Error(NL2SITE_REQUEST_FAILED);
    }

    const sitePagesList = pages.map((page: { pageName: string; }) => page.pageName);

    stream.progress(NL2PAGE_GENERATING_WEBPAGES);

    // Call NL2Page service to get page content
    telemetry.sendTelemetryEvent(VSCODE_EXTENSION_NL2PAGE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_NL2PAGE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    const sitePages = await getNL2PageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, siteName, sitePagesList, sessionId, telemetry, orgId, envId, userId);

    if (!sitePages) {
        throw new Error(NL2PAGE_RESPONSE_FAILED);
    }

    return { siteName, sitePagesList, sitePages, siteDescription };
}

async function populateRecords(siteName: string, sitePagesList: string[], sitePages: any, telemetry: ITelemetry) {
    // Create a map of sitePagesList and sitePages
    const sitePagesMap = sitePagesList.reduce((acc: any, pageName: string, index: number) => {
        acc[pageName] = sitePages[index];
        return acc;
    }, {});

    // Initialize PowerPagesSiteManager
    const siteManager = new PowerPagesSiteManager('BlankTemplate', 'English', telemetry);

    // Load the template
    await siteManager.loadTemplate();
    const { actions } = siteManager.getSiteDataAndActions();
    actions.updateSiteName(siteName);

    const promises = Object.entries(sitePagesMap).map(([pageName, pageContent]) => {
        if (typeof pageContent === 'object' && pageContent !== null && 'code' in pageContent) {
            return actions.addOrUpdatePage(pageName, (pageContent as { code: string }).code, pageName === 'Home');
        } else {
            throw new Error(`Invalid page content for page: ${pageName}`);
        }
    });

    await Promise.all(promises);

    // Save the site
    await actions.save();

    return siteManager;
}

async function provisionSite(siteManager: any) {
    // Provision the site
    const websiteId = siteManager.getSiteDataAndActions().ppSiteData.powerpagesite[0].powerpagesiteid ?? '';
    // const portal = await createPortal(siteName, siteUrl, websiteId);

    // GetPortalByIdCall

    return websiteId;
}
