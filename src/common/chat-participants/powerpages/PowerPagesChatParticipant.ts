/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IComponentInfo, IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { ITelemetry } from "../../OneDSLoggerTelemetry/telemetry/ITelemetry";
import TelemetryReporter from '@vscode/extension-telemetry';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { intelligenceAPIAuthentication } from '../../services/AuthenticationProvider';
import { ActiveOrgOutput } from '../../../client/pac/PacTypes';
import { AUTHENTICATION_FAILED_MSG, COPILOT_NOT_AVAILABLE_MSG, COPILOT_NOT_RELEASED_MSG, DISCLAIMER_MESSAGE, INVALID_RESPONSE, NO_PROMPT_MESSAGE, PAC_AUTH_INPUT, PAC_AUTH_NOT_FOUND, POWERPAGES_CHAT_PARTICIPANT_ID, RESPONSE_AWAITED_MSG, RESPONSE_SCENARIOS, SKIP_CODES, STATER_PROMPTS, WELCOME_MESSAGE, WELCOME_PROMPT } from './PowerPagesChatParticipantConstants';
import { ORG_DETAILS_KEY, handleOrgChangeSuccess, initializeOrgDetails } from '../../utilities/OrgHandlerUtils';
import { createAndReferenceLocation, getComponentInfo, getEndpoint, provideChatParticipantFollowups, handleChatParticipantFeedback, createErrorResult, createSuccessResult, removeChatVariables } from './PowerPagesChatParticipantUtils';
import { checkCopilotAvailability, fetchRelatedFiles, getActiveEditorContent } from '../../utilities/Utils';
import { IIntelligenceAPIEndpointInformation } from '../../services/Interfaces';
import { v4 as uuidv4 } from 'uuid';
import { orgChangeErrorEvent, orgChangeEvent } from '../../../client/OrgChangeNotifier';
import { isPowerPagesGitHubCopilotEnabled } from '../../copilot/utils/copilotUtil';
import { ADX_WEBPAGE, IApiRequestParams, IRelatedFiles } from '../../constants';
import { oneDSLoggerWrapper } from '../../OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { CommandRegistry } from '../CommandRegistry';
import { VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NOT_AVAILABLE_ECS, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SUCCESSFUL_PROMPT, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WELCOME_PROMPT, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NO_PROMPT, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LOCATION_REFERENCED, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WEBPAGE_RELATED_FILES, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ERROR, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_COMMAND_TRIGGERED } from './PowerPagesChatParticipantTelemetryConstants';

// Initialize Command Registry and Register Commands
const commandRegistry = new CommandRegistry();
//Register Commands

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
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.svg');

        this.chatParticipant.onDidReceiveFeedback((feedback: vscode.ChatResultFeedback) => {
            handleChatParticipantFeedback(feedback, this.powerPagesAgentSessionId, this.telemetry);
        }
        );
        this.chatParticipant.followupProvider = {
            provideFollowups: provideChatParticipantFollowups
        };

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
        try {
            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, { sessionId: this.powerPagesAgentSessionId });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, { sessionId: this.powerPagesAgentSessionId });

            if (!this.isOrgDetailsInitialized) {
                stream.progress(PAC_AUTH_INPUT);
                await this.initializeOrgDetails();
            }

            stream.progress(RESPONSE_AWAITED_MSG);

            if (!this.orgID || !this.environmentID) {
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, { sessionId: this.powerPagesAgentSessionId });
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, { sessionId: this.powerPagesAgentSessionId });
                return createErrorResult(PAC_AUTH_NOT_FOUND, RESPONSE_SCENARIOS.PAC_AUTH_NOT_FOUND, '');
            }

            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, { orgID: this.orgID, environmentID: this.environmentID, sessionId: this.powerPagesAgentSessionId });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, { orgID: this.orgID, environmentID: this.environmentID, sessionId: this.powerPagesAgentSessionId });

            if (!isPowerPagesGitHubCopilotEnabled()) {
                stream.markdown(COPILOT_NOT_RELEASED_MSG);
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NOT_AVAILABLE_ECS, { sessionId: this.powerPagesAgentSessionId, orgID: this.orgID });
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NOT_AVAILABLE_ECS, { sessionId: this.powerPagesAgentSessionId, orgID: this.orgID });
                return createSuccessResult('', RESPONSE_SCENARIOS.COPILOT_NOT_RELEASED, this.orgID);
            }

            const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.telemetry, this.powerPagesAgentSessionId, this.orgID, true);

            if (!intelligenceApiAuthResponse) {
                return createErrorResult(AUTHENTICATION_FAILED_MSG, RESPONSE_SCENARIOS.AUTHENTICATION_FAILED, this.orgID);
            }

            const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;
            const userId = intelligenceApiAuthResponse.userId;
            const intelligenceAPIEndpointInfo = await getEndpoint(this.orgID, this.environmentID, this.telemetry, this.cachedEndpoint, this.powerPagesAgentSessionId);

            const copilotAvailabilityStatus = checkCopilotAvailability(intelligenceAPIEndpointInfo.intelligenceEndpoint, this.orgID, this.telemetry, this.powerPagesAgentSessionId);

            if (!copilotAvailabilityStatus || !intelligenceAPIEndpointInfo.intelligenceEndpoint) {
                return createErrorResult(COPILOT_NOT_AVAILABLE_MSG, RESPONSE_SCENARIOS.COPILOT_NOT_AVAILABLE, this.orgID);
            }

            let userPrompt = request.prompt;

            userPrompt = removeChatVariables(userPrompt);

            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SUCCESSFUL_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SUCCESSFUL_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });

            if (userPrompt === WELCOME_PROMPT) {
                stream.markdown(WELCOME_MESSAGE);
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WELCOME_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WELCOME_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                return createSuccessResult(STATER_PROMPTS, RESPONSE_SCENARIOS.WELCOME_PROMPT, this.orgID);
            } else if (!userPrompt) {
                stream.markdown(NO_PROMPT_MESSAGE);
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NO_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_NO_PROMPT, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                return createSuccessResult('', RESPONSE_SCENARIOS.NO_PROMPT, this.orgID);
            }

            const { activeFileContent, activeFileUri, startLine, endLine, activeFileParams } = getActiveEditorContent();
            const location = activeFileUri ? createAndReferenceLocation(activeFileUri, startLine, endLine) : undefined;

            if (request.command) {
                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_COMMAND_TRIGGERED, { commandName: request.command, sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_COMMAND_TRIGGERED, {  commandName: request.command, sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });

                const command = commandRegistry.get(request.command);

                const commandRequest = {
                    request,
                    stream,
                    intelligenceAPIEndpointInfo,
                    intelligenceApiToken,
                    powerPagesAgentSessionId: this.powerPagesAgentSessionId,
                    telemetry: this.telemetry,
                    orgID: this.orgID,
                    envID: this.environmentID,
                    userId: userId
                };

                return await command.execute(commandRequest, stream);
            } else {
                if (location) {
                    this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LOCATION_REFERENCED, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LOCATION_REFERENCED, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                    stream.reference(location);
                }

                const relatedFiles: IRelatedFiles[] = [];

                // Based on dataverse entity fetch required context for the active file
                switch (activeFileParams.dataverseEntity) {
                    case ADX_WEBPAGE:
                        if (activeFileUri) {
                            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WEBPAGE_RELATED_FILES, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_WEBPAGE_RELATED_FILES, { sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
                            const files = await fetchRelatedFiles(activeFileUri, activeFileParams.dataverseEntity, activeFileParams.fieldType, this.telemetry, this.powerPagesAgentSessionId);
                            relatedFiles.push(...files);
                        }
                        break;
                    default:
                        break;
                }

                const { componentInfo, entityName }: IComponentInfo = await getComponentInfo(this.telemetry, this.orgUrl, activeFileParams, this.powerPagesAgentSessionId);

                const apiRequestParams: IApiRequestParams = {
                    userPrompt: [{ displayText: userPrompt, code: activeFileContent }],
                    activeFileParams: activeFileParams,
                    orgID: this.orgID,
                    apiToken: intelligenceApiToken,
                    sessionID: this.powerPagesAgentSessionId,
                    entityName: entityName,
                    entityColumns: componentInfo,
                    telemetry: this.telemetry,
                    aibEndpoint: intelligenceAPIEndpointInfo.intelligenceEndpoint,
                    geoName: intelligenceAPIEndpointInfo.geoName,
                    crossGeoDataMovementEnabledPPACFlag: intelligenceAPIEndpointInfo.crossGeoDataMovementEnabledPPACFlag,
                    relatedFiles: relatedFiles
                };

                const llmResponse = await sendApiRequest(apiRequestParams);

                const scenario = llmResponse.length > 1 ? llmResponse[llmResponse.length - 1] : llmResponse[0].displayText;

                this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO, { scenario: scenario, sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID, userId: userId });
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
            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ERROR, { sessionId: this.powerPagesAgentSessionId, error: error as string });
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
        } catch (error) {
            return;
        }
    }

    private async handleOrgChangeSuccess(orgDetails: ActiveOrgOutput): Promise<void> {
        const { orgID, orgUrl, environmentID } = handleOrgChangeSuccess(orgDetails);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
        this.environmentID = environmentID;
    }
}
