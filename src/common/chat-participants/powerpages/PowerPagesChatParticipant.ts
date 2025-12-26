/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant, registerCommands } from '../ChatParticipantUtils';
import { IComponentInfo, IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { intelligenceAPIAuthentication } from '../../services/AuthenticationProvider';
import { ActiveOrgOutput } from '../../../client/pac/PacTypes';
import { AUTHENTICATION_FAILED_MSG, COPILOT_NOT_AVAILABLE_MSG, COPILOT_NOT_RELEASED_MSG, DISCLAIMER_MESSAGE, INVALID_RESPONSE, LOGIN_BTN_CMD, LOGIN_BTN_TITLE, LOGIN_BTN_TOOLTIP, NO_PROMPT_MESSAGE, PAC_AUTH_INPUT, PAC_AUTH_NOT_FOUND, POWERPAGES_CHAT_PARTICIPANT_ID, POWERPAGES_COMMANDS, RESPONSE_AWAITED_MSG, RESPONSE_SCENARIOS, SKIP_CODES, STATER_PROMPTS, WELCOME_MESSAGE, WELCOME_PROMPT } from './PowerPagesChatParticipantConstants';
import { ORG_DETAILS_KEY, handleOrgChangeSuccess, initializeOrgDetails } from '../../utilities/OrgHandlerUtils';
import { createAndReferenceLocation, getComponentInfo, getEndpoint, provideChatParticipantFollowups, handleChatParticipantFeedback, createErrorResult, createSuccessResult, removeChatVariables, registerButtonCommands } from './PowerPagesChatParticipantUtils';
import { checkCopilotAvailability, fetchRelatedFiles, getActiveEditorContent } from '../../utilities/Utils';
import { validateAndSanitizeUserInput } from '../../utilities/InputValidator';
import { IIntelligenceAPIEndpointInformation } from '../../services/Interfaces';
import { v4 as uuidv4 } from 'uuid';
import { orgChangeErrorEvent, orgChangeEvent } from '../../../client/OrgChangeNotifier';
import { isPowerPagesGitHubCopilotEnabled } from '../../copilot/utils/copilotUtil';
import { ADX_WEBPAGE, IApiRequestParams, IRelatedFiles } from '../../constants';
import { oneDSLoggerWrapper } from '../../OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { CommandRegistry } from '../CommandRegistry';
import { VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NOT_AVAILABLE_ECS, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SUCCESSFUL_PROMPT, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WELCOME_PROMPT, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NO_PROMPT, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LOCATION_REFERENCED, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WEBPAGE_RELATED_FILES, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ERROR, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_COMMAND_TRIGGERED } from './PowerPagesChatParticipantTelemetryConstants';

export class PowerPagesChatParticipant {
    private static instance: PowerPagesChatParticipant | null = null;
    private chatParticipant: vscode.ChatParticipant;
    private extensionContext: vscode.ExtensionContext;
    private readonly _pacWrapper?: PacWrapper;
    private isOrgDetailsInitialized = false;
    private readonly _disposables: vscode.Disposable[] = [];
    private cachedEndpoint: IIntelligenceAPIEndpointInformation | null = null;
    private powerPagesAgentSessionId: string;
    private websiteId: string | undefined;
    private orgID: string | undefined;
    private orgUrl: string | undefined;
    private environmentID: string | undefined;

    private constructor(context: vscode.ExtensionContext, pacWrapper?: PacWrapper, websiteId?: string) {

        this.chatParticipant = createChatParticipant(POWERPAGES_CHAT_PARTICIPANT_ID, this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.svg');

        this.chatParticipant.onDidReceiveFeedback((feedback: vscode.ChatResultFeedback) => {
            handleChatParticipantFeedback(feedback, this.powerPagesAgentSessionId);
        }
        );
        this.chatParticipant.followupProvider = {
            provideFollowups: provideChatParticipantFollowups
        };

        this.powerPagesAgentSessionId = uuidv4();


        this.extensionContext = context;

        this._pacWrapper = pacWrapper;

        this.websiteId = websiteId;

        registerButtonCommands();

        this._disposables.push(orgChangeEvent(async (orgDetails: ActiveOrgOutput) => {
            await this.handleOrgChangeSuccess(orgDetails);
        }));

        this._disposables.push(orgChangeErrorEvent(async () => {
            this.extensionContext.globalState.update(ORG_DETAILS_KEY, { orgID: undefined, orgUrl: undefined });
        }));
    }

    public static getInstance(context: vscode.ExtensionContext, pacWrapper?: PacWrapper, websiteId?: string): PowerPagesChatParticipant {
        if (!PowerPagesChatParticipant.instance) {
            PowerPagesChatParticipant.instance = new PowerPagesChatParticipant(context, pacWrapper, websiteId);
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
        try {
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, { sessionId: this.powerPagesAgentSessionId });

            const commandRegistry = new CommandRegistry();

            registerCommands(commandRegistry, POWERPAGES_COMMANDS);

            if (!this.isOrgDetailsInitialized) {
                stream.progress(PAC_AUTH_INPUT);
                await this.initializeOrgDetails();
            }

            stream.progress(RESPONSE_AWAITED_MSG);

            if (!this.orgID || !this.environmentID) {
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, { sessionId: this.powerPagesAgentSessionId });
                return createErrorResult(PAC_AUTH_NOT_FOUND, RESPONSE_SCENARIOS.PAC_AUTH_NOT_FOUND, '');
            }

            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, { orgID: this.orgID, environmentID: this.environmentID, sessionId: this.powerPagesAgentSessionId });

            if (!isPowerPagesGitHubCopilotEnabled()) {
                stream.markdown(COPILOT_NOT_RELEASED_MSG);
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NOT_AVAILABLE_ECS, { sessionId: this.powerPagesAgentSessionId, orgID: this.orgID });
                return createSuccessResult('', RESPONSE_SCENARIOS.COPILOT_NOT_RELEASED, this.orgID);
            } const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.powerPagesAgentSessionId, this.orgID, true);

            if (!intelligenceApiAuthResponse || !intelligenceApiAuthResponse.accessToken || intelligenceApiAuthResponse.accessToken === '') {

                stream.button({
                    command: LOGIN_BTN_CMD,
                    title: LOGIN_BTN_TITLE,
                    tooltip: LOGIN_BTN_TOOLTIP
                });

                return createErrorResult(AUTHENTICATION_FAILED_MSG, RESPONSE_SCENARIOS.AUTHENTICATION_FAILED, this.orgID);
            }
            const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;
            const userId = intelligenceApiAuthResponse.userId;

            // Use cached endpoint info instead of calling getEndpoint on every request
            if (!this.cachedEndpoint || !this.cachedEndpoint.intelligenceEndpoint) {
                // If not yet initialized, initialize it now
                const endpointInitialized = await this.initializeEndpoint();
                if (!endpointInitialized) {
                    return createErrorResult(COPILOT_NOT_AVAILABLE_MSG, RESPONSE_SCENARIOS.COPILOT_NOT_AVAILABLE, this.orgID);
                }
            }
            // Using non-null assertion since we've already checked above
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const intelligenceAPIEndpointInfo = this.cachedEndpoint!;
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const copilotAvailabilityStatus = checkCopilotAvailability(intelligenceAPIEndpointInfo.intelligenceEndpoint!, this.orgID, this.powerPagesAgentSessionId);

            if (!copilotAvailabilityStatus) {
                return createErrorResult(COPILOT_NOT_AVAILABLE_MSG, RESPONSE_SCENARIOS.COPILOT_NOT_AVAILABLE, this.orgID);
            }

            let userPrompt = request.prompt;

            userPrompt = removeChatVariables(userPrompt);

            // Validate and sanitize user input
            const sanitizedPrompt = validateAndSanitizeUserInput(userPrompt);
            if (sanitizedPrompt !== null) {
                userPrompt = sanitizedPrompt;
            }

            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SUCCESSFUL_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });

            if (userPrompt === WELCOME_PROMPT) {
                stream.markdown(WELCOME_MESSAGE);
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WELCOME_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                return createSuccessResult(STATER_PROMPTS, RESPONSE_SCENARIOS.WELCOME_PROMPT, this.orgID);
            } else if (!userPrompt) {
                stream.markdown(NO_PROMPT_MESSAGE);
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NO_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                return createSuccessResult('', RESPONSE_SCENARIOS.NO_PROMPT, this.orgID);
            }

            const { activeFileContent, activeFileUri, startLine, endLine, activeFileParams } = getActiveEditorContent();
            const location = activeFileUri ? createAndReferenceLocation(activeFileUri, startLine, endLine) : undefined;

            if (request.command) {
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_COMMAND_TRIGGERED, { commandName: request.command, sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });

                const command = commandRegistry.get(request.command);

                const commandRequest = {
                    request,
                    stream,
                    intelligenceAPIEndpointInfo: this.cachedEndpoint,
                    intelligenceApiToken,
                    powerPagesAgentSessionId: this.powerPagesAgentSessionId,
                    orgID: this.orgID,
                    envID: this.environmentID,
                    userId: userId,
                    extensionContext: this.extensionContext
                };

                return await command.execute(commandRequest, stream);
            } else {
                if (location) {
                    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LOCATION_REFERENCED, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                    stream.reference(location);
                }

                const relatedFiles: IRelatedFiles[] = [];

                // Based on dataverse entity fetch required context for the active file
                switch (activeFileParams.dataverseEntity) {
                    case ADX_WEBPAGE:
                        if (activeFileUri) {
                            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WEBPAGE_RELATED_FILES, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                            const files = await fetchRelatedFiles(activeFileUri, activeFileParams.dataverseEntity, activeFileParams.fieldType, this.powerPagesAgentSessionId);
                            relatedFiles.push(...files);
                        }
                        break;
                    default:
                        break;
                }

                const { componentInfo, entityName }: IComponentInfo = await getComponentInfo(this.orgUrl, activeFileParams, this.powerPagesAgentSessionId);

                const apiRequestParams: IApiRequestParams = {
                    userPrompt: [{ displayText: userPrompt, code: activeFileContent }],
                    activeFileParams: activeFileParams,
                    orgID: this.orgID,
                    apiToken: intelligenceApiToken,
                    sessionID: this.powerPagesAgentSessionId,
                    entityName: entityName,
                    entityColumns: componentInfo,
                    aibEndpoint: this.cachedEndpoint?.intelligenceEndpoint || '',
                    geoName: this.cachedEndpoint?.geoName || '',
                    crossGeoDataMovementEnabledPPACFlag: this.cachedEndpoint?.crossGeoDataMovementEnabledPPACFlag || false,
                    relatedFiles: relatedFiles
                };

                const llmResponse = await sendApiRequest(apiRequestParams);

                const scenario = llmResponse.length > 1 ? llmResponse[llmResponse.length - 1] : llmResponse[0].displayText;

                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO, { scenario: scenario, sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });

                llmResponse.forEach((response: { displayText: string | vscode.MarkdownString; code: string; }) => {
                    if (response.displayText) {
                        stream.markdown(response.displayText);
                        stream.markdown('\n');
                    }
                    if (response.code && !SKIP_CODES.includes(response.code)) {
                        stream.markdown('\n```javascript\n' + response.code + '\n```');
                    }
                    stream.markdown('\n');
                });

                stream.markdown(DISCLAIMER_MESSAGE);
                return createSuccessResult('', scenario.toString(), this.orgID);
            }

        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ERROR, error as string, error as Error, { sessionId: this.powerPagesAgentSessionId }, {});
            return createErrorResult(INVALID_RESPONSE, RESPONSE_SCENARIOS.INVALID_RESPONSE, this.orgID ? this.orgID : '');
        }
    };

    private async initializeOrgDetails(): Promise<void> {
        try {
            const { orgID, orgUrl, environmentID } = await initializeOrgDetails(this.isOrgDetailsInitialized, this._pacWrapper);

            if (!orgID) {
                return;
            }
            this.orgID = orgID;
            this.orgUrl = orgUrl;
            this.environmentID = environmentID;
            this.isOrgDetailsInitialized = true;

            // Initialize endpoint information after org details are set
            await this.initializeEndpoint();
        } catch (error) {
            return;
        }
    }

    private async handleOrgChangeSuccess(orgDetails: ActiveOrgOutput): Promise<void> {
        const { orgID, orgUrl, environmentID } = handleOrgChangeSuccess(orgDetails);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
        this.environmentID = environmentID;

        // Re-initialize endpoint information after org change
        await this.initializeEndpoint();
    }

    private async initializeEndpoint(): Promise<boolean> {
        try {
            if (!this.orgID || !this.environmentID) {
                return false;
            }

            this.cachedEndpoint = await getEndpoint(this.orgID, this.environmentID, this.powerPagesAgentSessionId, this.websiteId);

            if (!this.cachedEndpoint.intelligenceEndpoint) {
                return false;
            }

            return true;
        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ERROR, 'Failed to initialize endpoint', error as Error, { sessionId: this.powerPagesAgentSessionId }, {});
            return false;
        }
    }
}
