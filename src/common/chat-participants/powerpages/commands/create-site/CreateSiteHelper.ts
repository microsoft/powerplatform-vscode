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
import { VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_COMPLETED, VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_FAILED, VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_TIMEOUT, VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_UNKNOWN_STATUS, VSCODE_EXTENSION_NL2PAGE_REQUEST, VSCODE_EXTENSION_NL2SITE_REQUEST, VSCODE_EXTENSION_POPULATE_SITE_RECORDS_ERROR, VSCODE_EXTENSION_POPULATE_SITE_RECORDS_START, VSCODE_EXTENSION_POPULATE_SITE_RECORDS_SUCCESS, VSCODE_EXTENSION_PREVIEW_SITE_PAGES, VSCODE_EXTENSION_PREVIEW_SITE_PAGES_ERROR } from '../../PowerPagesChatParticipantTelemetryConstants';
import { EditableFileSystemProvider } from '../../../../utilities/EditableFileSystemProvider';
import { HTML_FILE_EXTENSION, IEnvInfo, UTF8_ENCODING } from '../../../../constants';
import { BLANK_TEMPLATE_NAME, BUTTON_DOWNLOAD_EDIT, BUTTON_PREVIEW_SITE, CREATE_SITE_BTN_CMD, CREATE_SITE_BTN_TITLE, CREATE_SITE_BTN_TOOLTIP, CREATE_SITE_OPERATION_COMPLETE, CREATE_SITE_OPERATION_FAILED, CREATE_SITE_OPERATION_IN_PROGRESS, CREATE_SITE_OPERATION_NOT_STARTED, CREATE_SITE_PROGRESS_MESSAGES, EDITABLE_SCHEME, ENGLISH, ENGLISH_LCID, ENVIRONMENT_FOR_SITE_CREATION, INVALIDE_PAGE_CONTENT, MAX_POLLING_TIME_MS, MESSAGE_SITE_CREATED, POLLING_INTERVAL_MS, SITE_CREATE_INPUTS, SITE_CREATION_CONFIRMATION_CHAT_MSG, SITE_NAME, SITE_NAME_REQUIRED, WEBSITE_PROVISIONING_FAILED, WEBSITE_PROVISIONING_TIMEOUT, WEBSITE_PROVISIONING_UNKNOWN_STATUS } from './CreateSiteConstants';
import { MultiStepInput } from '../../../../utilities/MultiStepInput';
import { getEnvList } from '../../../../utilities/Utils';
import { PowerPagesSiteManager } from './CreateSiteManager';
import { ICreateSiteCommandArgs, ICreateSiteOptions, IPreviewSitePagesContentOptions, ISiteInputState } from './CreateSiteModel';
import { PPAPIService } from '../../../../services/PPAPIService';
import { ServiceEndpointCategory } from '../../../../services/Constants';
import { IWebsiteDetails } from '../../../../services/Interfaces';

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    previewSitePagesContent({ sitePages, stream, extensionContext, telemetry, sessionId, orgId, envId, userId, contentProvider });

    const endPointStamp = intelligenceAPIEndpointInfo.endpointStamp as ServiceEndpointCategory;

    const envList = await getEnvList(telemetry, endPointStamp)

    const args: ICreateSiteCommandArgs = {
        siteName,
        sitePages,
        sitePagesList,
        envList,
        contentProvider,
        telemetry,
        isCreateSiteInputsReceived: false,
        endPointStamp,
        envId,
        orgId,
        userId
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
        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_PREVIEW_SITE_PAGES, { sessionId, orgId, envId, userId });

        stream.markdown(SITE_CREATION_CONFIRMATION_CHAT_MSG);

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


export async function populateSiteRecords(siteName: string, sitePagesList: string[], sitePages: any, orgUrl: string, telemetry: ITelemetry) {
    try {
        telemetry.sendTelemetryEvent(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_START, { siteName, orgUrl });
        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_START, { siteName, orgUrl });

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
        await actions.save(orgUrl);

        telemetry.sendTelemetryEvent(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_SUCCESS, { siteName, orgUrl });
        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_SUCCESS, { siteName, orgUrl });

        return siteManager;
    } catch (error) {
        telemetry.sendTelemetryEvent(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_ERROR, { siteName, orgUrl, error: (error as Error).message });
        oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_POPULATE_SITE_RECORDS_ERROR, (error as Error).message, error as Error, { siteName, orgUrl }, {});
        throw error;
    }
}


function createSitePagesMap(sitePagesList: string[], sitePages: any): Record<string, any> {
    return sitePagesList.reduce((acc: Record<string, any>, pageName: string, index: number) => {
        acc[pageName] = sitePages[index];
        return acc;
    }, {});
}


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

export async function provisionWebsite(
    siteManager: PowerPagesSiteManager,
    siteName: string,
    serviceEndpointStamp: ServiceEndpointCategory,
    envId: string,
    orgId: string,
    userId: string,
    telemetry: ITelemetry
): Promise<any> {
    const websiteId = siteManager.getSiteDataAndActions().ppSiteData.powerpagesite[0].powerpagesiteid ?? '';

    // Start website creation
    await PPAPIService.createWebsite(
        serviceEndpointStamp,
        envId,
        orgId,
        siteName,
        ENGLISH_LCID,
        websiteId,
        telemetry
    );

    // Poll for website status with progress reporting
    const websiteResponse = await pollWebsiteStatus(
            serviceEndpointStamp,
            orgId,
            userId,
            envId,
            websiteId,
            telemetry,
        );


    return websiteResponse;
}

async function pollWebsiteStatus(
    serviceEndpointStamp: ServiceEndpointCategory,
    orgId: string,
    userId: string,
    envId: string,
    websiteId: string,
    telemetry: ITelemetry,
): Promise<IWebsiteDetails | null> {
    const startTime = Date.now();

    while (Date.now() - startTime < MAX_POLLING_TIME_MS) {
        // Get website details
        const websiteResponse = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(
            serviceEndpointStamp,
            envId,
            websiteId,
            telemetry
        );

        const status = websiteResponse?.status;

        // Handle possible statuses
        if (status === CREATE_SITE_OPERATION_COMPLETE) {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_COMPLETED, { websiteId });
            return websiteResponse;
        } else if (status === CREATE_SITE_OPERATION_FAILED) {
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_FAILED, 'Provisioning failed', new Error('Provisioning failed'), { websiteId, userId, orgId, envId }, {});
            throw new Error(WEBSITE_PROVISIONING_FAILED);
        } else if (status === CREATE_SITE_OPERATION_IN_PROGRESS || status === CREATE_SITE_OPERATION_NOT_STARTED) {
            // Provisioning still in progress
            // Continue polling
        } else {
            // Unknown status
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_UNKNOWN_STATUS, `Unknown status: ${status}`, new Error(`Unknown status: ${status}`), { websiteId, userId, orgId, envId }, {});
            throw new Error(`${WEBSITE_PROVISIONING_UNKNOWN_STATUS} ${status}`);
        }

        // Wait before the next polling attempt
        await delay(POLLING_INTERVAL_MS);
    }

    // If timeout is reached
    oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_CREATE_SITE_PROVISIONING_TIMEOUT, 'Provisioning timed out', new Error('Provisioning timed out'), { websiteId, userId, orgId, envId }, {});
    throw new Error(WEBSITE_PROVISIONING_TIMEOUT);
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function handleSiteCreation(args: ICreateSiteCommandArgs, progress: vscode.Progress<{ message?: string }>) {
    const {
        siteName,
        sitePages,
        sitePagesList,
        envList,
        contentProvider,
        telemetry,
        isCreateSiteInputsReceived,
        endPointStamp,
        envId,
        orgId,
        userId
    } = args;

    if (!isCreateSiteInputsReceived) {
        progress.report({ message: CREATE_SITE_PROGRESS_MESSAGES.updatingPageContent });
        const updatedPages = updatePageContent(sitePages, contentProvider);

        progress.report({ message: CREATE_SITE_PROGRESS_MESSAGES.collectingSiteCreationInputs });
        const siteCreateInputs = await collectSiteCreationInputs(siteName, envList);

        progress.report({ message: CREATE_SITE_PROGRESS_MESSAGES.populatingSiteRecords });
        const siteManager = await populateSiteRecords(
            siteName,
            sitePagesList,
            updatedPages,
            siteCreateInputs.OrgUrl,
            telemetry
        );

        progress.report({ message: CREATE_SITE_PROGRESS_MESSAGES.provisioningWebsite });
        const websiteResponse = await provisionWebsite(
            siteManager,
            siteName,
            endPointStamp,
            envId,
            orgId,
            userId,
            telemetry
        );
        if (websiteResponse) {
            handleWebsiteResponse(websiteResponse.websiteUrl);
        }

        if (siteCreateInputs) {
            args.isCreateSiteInputsReceived = true;
        }
    }
}

function updatePageContent(sitePages: any[], contentProvider: EditableFileSystemProvider) {
    return sitePages.map((page: any) => ({
        ...page,
        code: getUpdatedPageContent(contentProvider, page.metadata.pageTitle),
    }));
}

function handleWebsiteResponse(websiteUrl: string) {
    const message = `${MESSAGE_SITE_CREATED} [${websiteUrl}](${websiteUrl})`;

    vscode.window.showInformationMessage(message, BUTTON_DOWNLOAD_EDIT, BUTTON_PREVIEW_SITE).then(selection => {
        if (selection === BUTTON_DOWNLOAD_EDIT) {
            // TODO: Implement the download logic here
        } else if (selection === BUTTON_PREVIEW_SITE) {
            vscode.env.openExternal(vscode.Uri.parse(websiteUrl));
        }
    });
}
