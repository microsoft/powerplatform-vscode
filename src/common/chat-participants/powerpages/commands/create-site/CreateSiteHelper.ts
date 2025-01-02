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
import { VSCODE_EXTENSION_NL2PAGE_REQUEST, VSCODE_EXTENSION_NL2SITE_REQUEST, VSCODE_EXTENSION_POPULATE_SITE_RECORDS_ERROR, VSCODE_EXTENSION_POPULATE_SITE_RECORDS_START, VSCODE_EXTENSION_POPULATE_SITE_RECORDS_SUCCESS, VSCODE_EXTENSION_PREVIEW_SITE_PAGES, VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR } from '../../PowerPagesChatParticipantTelemetryConstants';
import { EditableFileSystemProvider } from '../../../../utilities/EditableFileSystemProvider';
import { HTML_FILE_EXTENSION, IEnvInfo, UTF8_ENCODING } from '../../../../constants';
import { BLANK_TEMPLATE_NAME, CREATE_SITE_BTN_CMD, CREATE_SITE_BTN_TITLE, CREATE_SITE_BTN_TOOLTIP, EDITABLE_SCHEME, ENGLISH, ENVIRONMENT_FOR_SITE_CREATION, INVALIDE_PAGE_CONTENT, SITE_CREATE_INPUTS, SITE_NAME, SITE_NAME_REQUIRED } from './CreateSiteConstants';
import { MultiStepInput } from '../../../../utilities/MultiStepInput';
import { getEnvList, showProgressWithNotification } from '../../../../utilities/Utils';
import { PowerPagesSiteManager } from './CreateSiteManager';
import { ICreateSiteCommandArgs, ICreateSiteOptions, IPreviewSitePagesContentOptions, ISiteInputState } from './CreateSiteModel';

export const createSite = async (createSiteOptions: ICreateSiteOptions) => {
    const {
        intelligenceAPIEndpointInfo,
        intelligenceApiToken,
        userPrompt,
        sessionId,
        stream,
        telemetry,
        orgId,
        envId,
        userId,
        extensionContext,
        contentProvider
    } = createSiteOptions;

    if (!intelligenceAPIEndpointInfo.intelligenceEndpoint) {
        throw new Error(NL2SITE_REQUEST_FAILED);
    }
    const { siteName, siteDescription, sitePages, sitePagesList } = await fetchSiteAndPageData(intelligenceAPIEndpointInfo.intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry, stream, orgId, envId, userId);

    previewSitePagesContent({ sitePages, stream, extensionContext, telemetry, sessionId, orgId, envId, userId, contentProvider });

    const envList = await getEnvList(telemetry, intelligenceAPIEndpointInfo.endpointStamp)

    const args: ICreateSiteCommandArgs = {
        siteName,
        sitePages,
        sitePagesList,
        envList,
        contentProvider,
        telemetry,
        isCreateSiteInputsReceived: false
    };

    stream.button({
        command: CREATE_SITE_BTN_CMD,
        title: CREATE_SITE_BTN_TITLE,
        tooltip: CREATE_SITE_BTN_TOOLTIP,
        arguments: [args],
    });

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
    const siteData = await getNL2SiteData(intelligenceEndpoint, intelligenceApiToken, userPrompt, sessionId, telemetry, orgId, envId, userId);
    if (!siteData) {
        throw new Error(NL2SITE_REQUEST_FAILED);
    }
    const { siteName, pages, siteDescription } = siteData;

    const sitePagesList = pages.map((page: { pageName: string; }) => page.pageName);

    stream.progress(NL2PAGE_GENERATING_WEBPAGES);

    // Call NL2Page service to get page content
    telemetry.sendTelemetryEvent(VSCODE_EXTENSION_NL2PAGE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_NL2PAGE_REQUEST, { sessionId: sessionId, orgId: orgId, environmentId: envId, userId: userId });
    const sitePages = await getNL2PageData(intelligenceEndpoint, intelligenceApiToken, userPrompt, siteName, pages, sessionId, telemetry, orgId, envId, userId);

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
        telemetry,
        sessionId,
        orgId,
        envId,
        userId,
        contentProvider
    } = options;

    try {
        const sitePagesContent: { name: string; content: string }[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sitePages.forEach((page: any) => {
            sitePagesContent.push({ name: page.metadata.pageTitle, content: page.code });
        });

        const sitePagesFolder: vscode.ChatResponseFileTree[] = [];

        const baseUri = vscode.Uri.parse(`${EDITABLE_SCHEME}:/`);

        sitePagesContent.forEach((page: { name: string; content: string; }) => {
            sitePagesFolder.push({ name: page.name + HTML_FILE_EXTENSION });
            const pageUri = vscode.Uri.joinPath(baseUri, page.name + HTML_FILE_EXTENSION);
            contentProvider.writeFile(pageUri, Buffer.from(page.content, UTF8_ENCODING));
        });

        telemetry.sendTelemetryEvent(VSCODE_EXTENSION_PREVIEW_SITE_PAGES, { sessionId, orgId, environmentId: envId, userId });
        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_PREVIEW_SITE_PAGES, { sessionId, orgId, environmentId: envId, userId });

        stream.filetree(sitePagesFolder, baseUri);

        return contentProvider;
    } catch (error) {
        telemetry.sendTelemetryEvent(VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR, { sessionId, orgId, environmentId: envId, userId, error: (error as Error).message });
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
        state.OrgUrl = pick.description;
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


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function populateSiteRecords(siteName: string, sitePagesList: string[], sitePages: any, orgUrl: string, telemetry: ITelemetry) {
    return await showProgressWithNotification( vscode.l10n.t('Creating Site Records') , async (progress) => {
        try {
            telemetry.sendTelemetryEvent(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_START , { siteName, orgUrl });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_START , { siteName, orgUrl });

            progress?.report({ message: vscode.l10n.t('Initializing site manager...') });

            // Create a map of sitePagesList and sitePages
            const sitePagesMap = createSitePagesMap(sitePagesList, sitePages);

            // Initialize PowerPagesSiteManager
            const siteManager = new PowerPagesSiteManager(BLANK_TEMPLATE_NAME, ENGLISH, telemetry);

            // Load the template
            await siteManager.loadTemplate();
            const { actions } = siteManager.getSiteDataAndActions();
            actions.updateSiteName(siteName);

            await processSitePages(sitePagesMap, siteManager);

            // Save the site
            progress?.report({ message: vscode.l10n.t('Saving site...') });
            await actions.save(orgUrl);

            telemetry.sendTelemetryEvent(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_SUCCESS, { siteName, orgUrl });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_SUCCESS, { siteName, orgUrl });

            return siteManager;
        } catch (error) {
            telemetry.sendTelemetryEvent(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_ERROR, { siteName, orgUrl, error: (error as Error).message });
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_ERROR, (error as Error).message, error as Error, { siteName, orgUrl }, {});
            throw error;
        }
    });
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createSitePagesMap(sitePagesList: string[], sitePages: any): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return sitePagesList.reduce((acc: Record<string, any>, pageName: string, index: number) => {
        acc[pageName] = sitePages[index];
        return acc;
    }, {});
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processSitePages(sitePagesMap: Record<string, any>, siteManager: PowerPagesSiteManager): Promise<void> {
    const { actions } = siteManager.getSiteDataAndActions();
    const promises = Object.entries(sitePagesMap).map(([pageName, pageContent]) => {
        if (typeof pageContent === 'object' && pageContent !== null && 'code' in pageContent) {
            return actions.addOrUpdatePage(pageName, (pageContent as { code: string }).code, pageName === 'Home');
        } else {
            throw new Error(`${INVALIDE_PAGE_CONTENT}: ${pageName}`);
        }
    });
    await Promise.all(promises);
}
