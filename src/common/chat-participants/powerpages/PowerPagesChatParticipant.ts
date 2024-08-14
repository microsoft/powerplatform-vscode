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
import { AUTHENTICATION_FAILED_MSG, COPILOT_NOT_AVAILABLE_MSG, DISCLAIMER_MESSAGE, NO_PROMPT_MESSAGE, PAC_AUTH_NOT_FOUND, POWERPAGES_CHAT_PARTICIPANT_ID, RESPONSE_AWAITED_MSG, SKIP_CODES, STATER_PROMPTS, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_INVOKED, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_ORG_DETAILS_NOT_FOUND, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO, WELCOME_MESSAGE, WELCOME_PROMPT } from './PowerPagesChatParticipantConstants';
import { ORG_DETAILS_KEY, handleOrgChangeSuccess, initializeOrgDetails } from '../../utilities/OrgHandlerUtils';
import { createAndReferenceLocation, getComponentInfo, getEndpoint, provideChatParticipantFollowups } from './PowerPagesChatParticipantUtils';
import { checkCopilotAvailability, getActiveEditorContent } from '../../utilities/Utils';
import { IIntelligenceAPIEndpointInformation } from '../../services/Interfaces';
import { v4 as uuidv4 } from 'uuid';
import { orgChangeErrorEvent, orgChangeEvent } from '../../../client/OrgChangeNotifier';

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

        const intelligenceAPIEndpointInfo = await getEndpoint(this.orgID, this.environmentID, this.telemetry, this.cachedEndpoint, this.powerPagesAgentSessionId);

        const copilotAvailabilityStatus = checkCopilotAvailability(intelligenceAPIEndpointInfo.intelligenceEndpoint, this.orgID, this.telemetry, this.powerPagesAgentSessionId);

        if (!copilotAvailabilityStatus) {
            stream.markdown(COPILOT_NOT_AVAILABLE_MSG)
            return {
                metadata: {
                    command: ''
                }
            };
        }

        const userPrompt = request.prompt;

        if (userPrompt === WELCOME_PROMPT) {
            stream.markdown(WELCOME_MESSAGE);
            return {
                metadata: {
                    command: STATER_PROMPTS
                }
            }
        }

        if (!userPrompt) {
            stream.markdown(NO_PROMPT_MESSAGE);
            return {
                metadata: {
                    command: STATER_PROMPTS
                }
            };
        }

        const { activeFileContent, activeFileUri, startLine, endLine, activeFileParams } = getActiveEditorContent();

        const location = activeFileUri ? createAndReferenceLocation(activeFileUri, startLine, endLine) : undefined;

        if (location) {
            stream.reference(location);
        }

        if (request.command) {
            //TODO: Handle command scenarios

        } else {
            const { componentInfo, entityName }: IComponentInfo = await getComponentInfo(this.telemetry, this.orgUrl, activeFileParams, this.powerPagesAgentSessionId);

            const llmResponse = await sendApiRequest([{ displayText: userPrompt, code: activeFileContent }], activeFileParams, this.orgID, intelligenceApiToken, this.powerPagesAgentSessionId, entityName, componentInfo, this.telemetry, intelligenceAPIEndpointInfo.intelligenceEndpoint, intelligenceAPIEndpointInfo.geoName, intelligenceAPIEndpointInfo.crossGeoDataMovementEnabledPPACFlag);

            const scenario = llmResponse.length > 1 ? llmResponse[llmResponse.length - 1] : llmResponse[0].displayText;

            this.telemetry.sendTelemetryEvent(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO, { scenario: scenario, sessionId: this.powerPagesAgentSessionId, orgId: this.orgID, environmentId: this.environmentID })

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
        }

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
