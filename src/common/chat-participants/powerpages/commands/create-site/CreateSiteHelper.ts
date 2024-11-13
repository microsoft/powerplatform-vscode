/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ITelemetry } from '../../../../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { getNL2PageData } from './Nl2PageService';
import { getNL2SiteData } from './Nl2SiteService';
import { NL2SITE_REQUEST_FAILED, NL2PAGE_GENERATING_WEBPAGES, NL2PAGE_RESPONSE_FAILED } from '../../PowerPagesChatParticipantConstants';

export const createSite = async (intelligenceEndpoint: string, intelligenceApiToken: string, userPrompt: string, sessionId: string, stream: vscode.ChatResponseStream, telemetry: ITelemetry) => {
    try {
        const { siteName, siteDescription } = await fetchSiteAndPageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry, stream);

        return {
            siteName,
            //websiteId,
            siteDescription,
        };

    } catch (error) {
        stream.markdown(`${(error as Error).message}`);
        throw error;
    }
};

async function fetchSiteAndPageData(intelligenceEndpoint: string, intelligenceApiToken: string, userPrompt: string, sessionId: string, telemetry: ITelemetry, stream: vscode.ChatResponseStream) {
    // Call NL2Site service to get initial site content
    const { siteName, pages, siteDescription } = await getNL2SiteData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry);

    if (!siteName) {
        stream.markdown(NL2SITE_REQUEST_FAILED);
        throw new Error(NL2SITE_REQUEST_FAILED);
    }

    const sitePagesList = pages.map((page: { pageName: string; }) => page.pageName);

    stream.progress(NL2PAGE_GENERATING_WEBPAGES);

    // Call NL2Page service to get page content
    const sitePages = await getNL2PageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, siteName, sitePagesList, sessionId, telemetry);

    if (!sitePages) {
        throw new Error(NL2PAGE_RESPONSE_FAILED);
    }

    return { siteName, sitePagesList, sitePages, siteDescription };
}
