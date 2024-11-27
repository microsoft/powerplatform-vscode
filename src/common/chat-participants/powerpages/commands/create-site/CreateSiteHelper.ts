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
import { VSCODE_EXTENSION_NL2PAGE_REQUEST, VSCODE_EXTENSION_NL2SITE_REQUEST, VSCODE_EXTENSION_PREVIEW_SITE_PAGES, VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR } from '../../PowerPagesChatParticipantTelemetryConstants';
import { EditableFileSystemProvider } from '../../../../utilities/EditableFileSystemProvider';
import { HTML_FILE_EXTENSION, UTF8_ENCODING } from '../../../../constants';
import { EDITABLE_SCHEME } from './CreateSiteConstants';
import { ICreateSiteOptions, IPreviewSitePagesContentOptions } from './CreateSiteTypes';

export const createSite = async (createSiteOptions: ICreateSiteOptions) => {
    const {
        intelligenceEndpoint,
        intelligenceApiToken,
        userPrompt,
        sessionId,
        stream,
        telemetry,
        orgId,
        envId,
        userId,
        extensionContext
    } = createSiteOptions;

    const { siteName, siteDescription, sitePages } = await fetchSiteAndPageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry, stream, orgId, envId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const contentProvider = previewSitePagesContent({sitePages, stream, extensionContext, telemetry, sessionId, orgId, envId, userId});

    // TODO: Implement the create site button click handler

    return {
        siteName,
        //websiteId,
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


function previewSitePagesContent(
    options: IPreviewSitePagesContentOptions
): EditableFileSystemProvider {
    const {
        sitePages,
        stream,
        extensionContext,
        telemetry,
        sessionId,
        orgId,
        envId,
        userId
    } = options;

    try {
        const sitePagesContent: { name: string; content: string }[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sitePages.forEach((page: any) => {
            sitePagesContent.push({ name: page.metadata.pageTitle, content: page.code });
        });

        const sitePagesFolder: vscode.ChatResponseFileTree[] = [];
        const contentProvider = new EditableFileSystemProvider();
        // Register the content provider
        extensionContext.subscriptions.push(
            vscode.workspace.registerFileSystemProvider(EDITABLE_SCHEME, contentProvider, { isCaseSensitive: true })
        );

        const baseUri = vscode.Uri.parse(`${EDITABLE_SCHEME}:/`);

        sitePagesContent.forEach((page: { name: string; content: string; }) => {
            sitePagesFolder.push({ name: page.name + HTML_FILE_EXTENSION });
            const pageUri = vscode.Uri.joinPath(baseUri, page.name + HTML_FILE_EXTENSION);
            contentProvider.writeFile(pageUri, Buffer.from(page.content, UTF8_ENCODING));
        });

        telemetry.sendTelemetryEvent(VSCODE_EXTENSION_PREVIEW_SITE_PAGES, { sessionId, orgId, environmentId: envId, userId });

        stream.filetree(sitePagesFolder, baseUri);

        return contentProvider;
    } catch (error) {
        telemetry.sendTelemetryEvent(VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR, { sessionId, orgId, environmentId: envId, userId, error: (error as Error).message });
        oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR, (error as Error).message, error as Error, { sessionId, orgId, environmentId: envId, userId }, {});
        throw error;
    }
}

