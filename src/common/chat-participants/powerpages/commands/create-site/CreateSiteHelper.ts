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
//import { ReadonlyFileSystemProvider } from '../../../../utilities/ReadonlyFileSystemProvider';
import { EditableFileSystemProvider } from '../../../../utilities/EditableFileSystemProvider';

export const createSite = async (intelligenceEndpoint: string, intelligenceApiToken: string, userPrompt: string, sessionId: string, stream: vscode.ChatResponseStream, telemetry: ITelemetry, orgId: string, envID: string, userId: string, extensionContext: vscode.ExtensionContext) => {
    const { siteName, siteDescription, sitePages } = await fetchSiteAndPageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry, stream, orgId, envID, userId);

    const contentProvider = previewSitePagesContent(siteName, sitePages, stream, extensionContext);

    stream.button({
        //command: 'create-site-inputs', 
        title: 'Create Site',
        command: 'create-site-command',
        arguments: [contentProvider, sitePages.map(page => ({ name: page.metadata.pageTitle, content: page.code }))]
    });

    extensionContext.subscriptions.push(
        vscode.commands.registerCommand('create-site-command', async (contentProvider: EditableFileSystemProvider, sitePagesContent: { name: string; content: string }[]) => {
            const updatedPages = sitePagesContent.map(page => ({
                name: page.name,
                content: getUpdatedPageContent(contentProvider, page.name)
            }));

            // Process the updated pages as needed
            console.log('Updated Pages:', updatedPages);

            // You can add further logic here to handle the updated pages, such as sending them to a server or saving them.
        })
    );

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
    siteName: string,
    sitePages: any[],
    stream: vscode.ChatResponseStream,
    extensionContext: vscode.ExtensionContext
): EditableFileSystemProvider {
    const sitePagesContent: { name: string; content: string }[] = [];
    sitePages.forEach((page: any) => {
        sitePagesContent.push({ name: page.metadata.pageTitle, content: page.code });
    });

    stream.markdown('\nHere is the name of the site: ' + siteName);

    const sitePagesFolder: vscode.ChatResponseFileTree[] = [];
    const contentProvider = new EditableFileSystemProvider();
    const scheme = 'editable';
    // Register the content provider
    extensionContext.subscriptions.push(
        vscode.workspace.registerFileSystemProvider(scheme, contentProvider, { isCaseSensitive: true })
    );

    const baseUri = vscode.Uri.parse('editable:/');

    sitePagesContent.forEach((page: { name: string; content: string; }) => {
        sitePagesFolder.push({ name: page.name + '.html' });
        const pageUri = vscode.Uri.joinPath(baseUri, page.name + '.html');
        contentProvider.writeFile(pageUri, Buffer.from(page.content, 'utf8'));
    });

    // TODO: pass uri of current workspace as second parameter
    stream.filetree(sitePagesFolder, baseUri);

    return contentProvider;
}

// Function to get updated content
export function getUpdatedPageContent(contentProvider: EditableFileSystemProvider, pageName: string): string {
    const pageUri = vscode.Uri.parse(`editable:/${pageName}.html`);
    return contentProvider.getFileContent(pageUri);
}

