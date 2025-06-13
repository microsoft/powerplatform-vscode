/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { getNL2PageData } from './Nl2PageService';
import { getNL2SiteData } from './Nl2SiteService';
import { NL2SITE_REQUEST_FAILED, NL2PAGE_GENERATING_WEBPAGES, NL2PAGE_RESPONSE_FAILED } from '../../PowerPagesChatParticipantConstants';
import { oneDSLoggerWrapper } from '../../../../OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { VSCODE_EXTENSION_NL2PAGE_REQUEST, VSCODE_EXTENSION_NL2SITE_REQUEST, VSCODE_EXTENSION_PREVIEW_SITE_PAGES, VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR } from '../../PowerPagesChatParticipantTelemetryConstants';
import { EditableFileSystemProvider } from '../../../../utilities/EditableFileSystemProvider';
import { HTML_FILE_EXTENSION, IEnvInfo, UTF8_ENCODING } from '../../../../constants';
import { CREATE_SITE_BTN_CMD, CREATE_SITE_BTN_TITLE, CREATE_SITE_BTN_TOOLTIP, EDITABLE_SCHEME, ENVIRONMENT_FOR_SITE_CREATION, SITE_CREATE_INPUTS, SITE_NAME, SITE_NAME_REQUIRED } from './CreateSiteConstants';
import { ICreateSiteOptions, IPreviewSitePagesContentOptions, ISiteInputState } from './CreateSiteTypes';
import { MultiStepInput } from '../../../../utilities/MultiStepInput';
import { getEnvList } from '../../../../utilities/Utils';

export const createSite = async (createSiteOptions: ICreateSiteOptions) => {
    const {
        intelligenceAPIEndpointInfo,
        intelligenceApiToken,
        userPrompt,
        sessionId,
        stream,
        orgId,
        envId,
        userId,
        extensionContext
    } = createSiteOptions;

    if (!intelligenceAPIEndpointInfo.intelligenceEndpoint) {
        return;
    }
    const { siteName, siteDescription, sitePages } = await fetchSiteAndPageData(intelligenceAPIEndpointInfo.intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, stream, orgId, envId, userId);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const contentProvider = previewSitePagesContent({ sitePages, stream, extensionContext, sessionId, orgId, envId, userId });

    const envList = await getEnvList(intelligenceAPIEndpointInfo.endpointStamp);

    stream.button({
        command: CREATE_SITE_BTN_CMD,
        title: CREATE_SITE_BTN_TITLE,
        tooltip: CREATE_SITE_BTN_TOOLTIP,
        arguments: [siteName, envList, contentProvider, false],
    });

    return {
        siteName,
        //websiteId,
        siteDescription,
    };
};

async function fetchSiteAndPageData(intelligenceEndpoint: string, intelligenceApiToken: string, userPrompt: string, sessionId: string, stream: vscode.ChatResponseStream, orgId: string, envId: string, userId: string) {
    // Call NL2Site service to get initial site content
    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_NL2SITE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    const { siteName, pages, siteDescription } = await getNL2SiteData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, orgId, envId, userId);

    if (!siteName) {
        throw new Error(NL2SITE_REQUEST_FAILED);
    }

    const sitePagesList = pages.map((page: { pageName: string; }) => page.pageName);

    stream.progress(NL2PAGE_GENERATING_WEBPAGES);

    // Call NL2Page service to get page content
    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_NL2PAGE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    const sitePages = await getNL2PageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, siteName, sitePagesList, sessionId, orgId, envId, userId);

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

        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_PREVIEW_SITE_PAGES, { sessionId, orgId, environmentId: envId, userId });

        stream.filetree(sitePagesFolder, baseUri);

        return contentProvider;
    } catch (error) {
        oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR, (error as Error).message, error as Error, { sessionId, orgId, environmentId: envId, userId }, {});
        throw error;
    }
}
// Function to get updated content
export function getUpdatedPageContent(contentProvider: EditableFileSystemProvider, pageName: string): string {
    const pageUri = vscode.Uri.parse(`${EDITABLE_SCHEME}:/${pageName}${HTML_FILE_EXTENSION}`);
    return contentProvider.getFileContent(pageUri);
}

export async function collectSiteCreationInputs(siteName: string, envList: IEnvInfo[]) {
    const envNames: vscode.QuickPickItem[] = envList.map((env: IEnvInfo) => {
        return {
            label: env.envDisplayName,
            description: env.orgUrl,
        };
    });

    const title = vscode.l10n.t(SITE_CREATE_INPUTS);

    async function collectInputs() {
        const state = {} as Partial<ISiteInputState>;
        await MultiStepInput.run((input) => selectEnvName(input, state));
        return state as ISiteInputState;
    }

    async function selectEnvName(
        input: MultiStepInput,
        state: Partial<ISiteInputState>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 2,
            placeholder: vscode.l10n.t(ENVIRONMENT_FOR_SITE_CREATION),
            items: envNames,
            activeItem:
                typeof state.envName !== "string"
                    ? state.envName
                    : undefined,
        });
        state.envName = pick.label;
        state.orgUrl = pick.description;
        return (input: MultiStepInput) => inputSiteName(input, state);
    }

    async function inputSiteName(
        input: MultiStepInput,
        state: Partial<ISiteInputState>
    ) {
        state.siteName = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 2,
            value: state.siteName || siteName,
            placeholder: vscode.l10n.t(SITE_NAME),
            validate: async (value) => (value ? undefined : vscode.l10n.t(SITE_NAME_REQUIRED)),
        });
    }

    const siteInputState = await collectInputs();
    // Return the collected site creation inputs including site name, environment name, and domain name
    return siteInputState;
}
