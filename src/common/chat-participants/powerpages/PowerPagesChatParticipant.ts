/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IComponentInfo, IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import TelemetryReporter from '@vscode/extension-telemetry';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { intelligenceAPIAuthentication } from '../../services/AuthenticationProvider';
import { ActiveOrgOutput } from '../../../client/pac/PacTypes';
import { AUTHENTICATION_FAILED_MSG, COPILOT_NOT_AVAILABLE_MSG, CREATE_SITE_INPUTS, ENV_NOT_FOUND, NO_PROMPT_MESSAGE, PAC_AUTH_NOT_FOUND, POWERPAGES_CHAT_PARTICIPANT_ID, RESPONSE_AWAITED_MSG, SKIP_CODES, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO } from './PowerPagesChatParticipantConstants';
import { ORG_DETAILS_KEY, handleOrgChangeSuccess, initializeOrgDetails } from '../../utilities/OrgHandlerUtils';
import { getComponentInfo, getEndpointInfo, getSiteCreationInputs } from './PowerPagesChatParticipantUtils';
import { checkCopilotAvailability, getActiveEditorContent, getEnvList } from '../../utilities/Utils';
import { IIntelligenceAPIEndpointInformation } from '../../services/Interfaces';
import { v4 as uuidv4 } from 'uuid';
import { ITelemetry } from '../../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { orgChangeErrorEvent, orgChangeEvent } from '../../../client/OrgChangeNotifier';
import { getNL2PageData } from './NL2PageService';
import { getNL2SiteData } from './NL2SiteService';
import { DynamicContentProvider } from './FileSystemProvider';

export class PowerPagesChatParticipant {
    private static instance: PowerPagesChatParticipant | null = null;
    private chatParticipant: vscode.ChatParticipant;
    private telemetry: ITelemetry;
    private extensionContext: vscode.ExtensionContext;
    private readonly _pacWrapper?: PacWrapper;
    private isOrgDetailsInitialized = false;
    private readonly _disposables: vscode.Disposable[] = [];
    private cachedEndpoint: IIntelligenceAPIEndpointInformation | null = null;
    private powerPagesAgentSessionId: string;

    private orgID: string | undefined;
    private orgUrl: string | undefined;
    private environmentID: string | undefined;

    private constructor(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter, pacWrapper?: PacWrapper) {

        this.chatParticipant = createChatParticipant(POWERPAGES_CHAT_PARTICIPANT_ID, this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

        this.powerPagesAgentSessionId = uuidv4();

        this.telemetry = telemetry;

        this.extensionContext = context;

        this._pacWrapper = pacWrapper;

        this._disposables.push(orgChangeEvent(async (orgDetails: ActiveOrgOutput) => {
            await this.handleOrgChangeSuccess(orgDetails);
        }));

        this._disposables.push(orgChangeErrorEvent(async () => {
            this.extensionContext.globalState.update(ORG_DETAILS_KEY, { orgID: undefined, orgUrl: undefined });
        }));

        vscode.commands.registerCommand(CREATE_SITE_INPUTS, async (siteName: string, envInfo: { envId: string; envDisplayName: string; }[], isCreateSiteInputsReceived) => {
            if (!isCreateSiteInputsReceived) {
                if (envInfo.length === 0) {
                    vscode.window.showErrorMessage(ENV_NOT_FOUND);
                    return;
                }
                const siteCreateInputs = await getSiteCreationInputs(siteName, envInfo);
                if (siteCreateInputs) {
                    isCreateSiteInputsReceived = true;
                }
            }
        });

    }

    public static getInstance(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter, pacWrapper?: PacWrapper) {
        if (!PowerPagesChatParticipant.instance) {
            PowerPagesChatParticipant.instance = new PowerPagesChatParticipant(context, telemetry, pacWrapper);
        }

        return PowerPagesChatParticipant.instance;
    }

    public dispose() {
        this.chatParticipant.dispose();
    }

    private handler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest,
        _context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        //_token: vscode.CancellationToken
    ): Promise<IPowerPagesChatResult> => {
        // Handle chat requests here

        stream.progress(RESPONSE_AWAITED_MSG)

        this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, { sessionId: this.powerPagesAgentSessionId });

        await this.initializeOrgDetails();

        if (!this.orgID || !this.environmentID) {
            stream.markdown(PAC_AUTH_NOT_FOUND);
            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, { sessionId: this.powerPagesAgentSessionId });
            return {
                metadata: {
                    command: ''
                }
            };
        }

        this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, { orgID: this.orgID, environmentID: this.environmentID, sessionId: this.powerPagesAgentSessionId });

        const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.telemetry, this.powerPagesAgentSessionId, this.orgID, true);

        if (!intelligenceApiAuthResponse) {
            stream.markdown(AUTHENTICATION_FAILED_MSG);
            return {
                metadata: {
                    command: '',
                }
            };
        }

        const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;

        const intelligenceAPIEndpointInfo = await getEndpointInfo(this.orgID, this.environmentID, this.telemetry, this.cachedEndpoint, this.powerPagesAgentSessionId);

        const copilotAvailabilityStatus = checkCopilotAvailability(intelligenceAPIEndpointInfo.intelligenceEndpoint, this.orgID, this.telemetry, this.powerPagesAgentSessionId);

        if (!copilotAvailabilityStatus || !intelligenceAPIEndpointInfo.intelligenceEndpoint) {
            stream.markdown(COPILOT_NOT_AVAILABLE_MSG)
            return {
                metadata: {
                    command: ''
                }
            };
        }

        const userPrompt = request.prompt;

        if (request.command) {
            //TODO: Handle command scenarios
            switch (request.command) {
                case 'create-site': {
                    //TODO: Update the strings
                    stream.progress('Generating a new Power Pages site...');

                    //TODO: Call NL2Site

                    // stream.markdown('Below is the markdown content for the new Power Pages site. You can copy this content and paste it in the markdown file to create a new Power Pages site.');

                    //Make call to intelligence API to get the site content
                    const siteContent = await getNL2SiteData(intelligenceAPIEndpointInfo.intelligenceEndpoint, intelligenceApiToken, userPrompt, this.powerPagesAgentSessionId);

                    if (!siteContent) {
                        stream.markdown('Failed to get the site content. Please try again later.');
                        return {
                            metadata: {
                                command: ''
                            }
                        };
                    }

                    const siteName = siteContent.siteName;

                    const sitePagesList = siteContent.pages.map((page: { pageName: string; }) => page.pageName);

                    stream.progress('Generating webpages...');

                    const sitePages = await getNL2PageData(intelligenceAPIEndpointInfo.intelligenceEndpoint, intelligenceApiToken, request.prompt, siteName, sitePagesList, this.powerPagesAgentSessionId);

                    if (!sitePages) {
                        stream.markdown('Failed to get the site pages. Please try again later.');
                        return {
                            metadata: {
                                command: ''
                            }
                        };
                    }

                    const sitePagesContent: { name: string; content: string }[] = [];
                    sitePages.forEach((page: any) => {
                        sitePagesContent.push({ name: page.metadata.pageTitle, content: page.code });
                    });

                    stream.markdown('\nHere is the name of the site: ' + siteName);


                    const sitePagesFolder: vscode.ChatResponseFileTree[] = [];
                    const contentProvider = new DynamicContentProvider();
                    const scheme = 'readonly';
                    // Register the content provider
                    this.extensionContext.subscriptions.push(
                        vscode.workspace.registerTextDocumentContentProvider(scheme, contentProvider)
                    );

                    const baseUri = vscode.Uri.parse('readonly:/');

                    sitePagesContent.forEach((page: { name: string; content: string; }) => {
                        sitePagesFolder.push({ name: page.name + '.html' });
                        const pageUri = vscode.Uri.joinPath(baseUri, page.name + '.html');
                        contentProvider.updateFileContent(pageUri.path, page.content);

                    });

                    //TODO: pass uri of current workspace as second parameter
                    stream.filetree(sitePagesFolder, baseUri);

                    //API call to get list of the environments
                    const envInfo = await getEnvList(this.telemetry, intelligenceAPIEndpointInfo.endpointStamp!);

                    const createSiteArgumentsArray = [siteName, envInfo, false];

                    stream.button({
                        command: CREATE_SITE_INPUTS,
                        title: vscode.l10n.t('Create Site'),
                        tooltip: vscode.l10n.t('Create a new Power Pages site'),
                        arguments: createSiteArgumentsArray
                    })

                    return {
                        metadata: {
                            command: request.command //TODO: Review the command
                        }
                    };
                }
                default:
                    break;
            }
        }
        if (!userPrompt) {

            //TODO: String approval is required
            stream.markdown(NO_PROMPT_MESSAGE);

            return {
                metadata: {
                    command: ''
                }
            };
        }

        const { activeFileParams } = getActiveEditorContent();

        const { componentInfo, entityName }: IComponentInfo = await getComponentInfo(this.telemetry, this.orgUrl, activeFileParams, this.powerPagesAgentSessionId);

        const llmResponse = await sendApiRequest([{ displayText: userPrompt, code: '' }], activeFileParams, this.orgID, intelligenceApiToken, this.powerPagesAgentSessionId, entityName, componentInfo, this.telemetry, intelligenceAPIEndpointInfo.intelligenceEndpoint, intelligenceAPIEndpointInfo.geoName, intelligenceAPIEndpointInfo.crossGeoDataMovementEnabledPPACFlag);

        const scenario = llmResponse.length > 1 ? llmResponse[llmResponse.length - 1] : llmResponse[0].displayText;

        this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO, { scenario: scenario, sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID })

        llmResponse.forEach((response: { displayText: string | vscode.MarkdownString; code: string; }) => {
            if (response.displayText) {
                stream.markdown(response.displayText);
            }
            if (response.code && !SKIP_CODES.includes(response.code)) {
                stream.markdown('\n```javascript\n' + response.code + '\n```');
            }
            stream.markdown('\n');
        });

        return {
            metadata: {
                command: ''
            }
        };

    };

    private async initializeOrgDetails(): Promise<void> {
        const { orgID, orgUrl, environmentID } = await initializeOrgDetails(this.isOrgDetailsInitialized, this.extensionContext, this._pacWrapper);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
        this.environmentID = environmentID;
    }

    private async handleOrgChangeSuccess(orgDetails: ActiveOrgOutput): Promise<void> {
        const { orgID, orgUrl, environmentID } = handleOrgChangeSuccess(orgDetails, this.extensionContext);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
        this.environmentID = environmentID;
    }
}



