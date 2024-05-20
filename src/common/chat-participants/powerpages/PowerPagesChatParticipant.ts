/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { ITelemetry } from '../../../client/telemetry/ITelemetry';
import TelemetryReporter from '@vscode/extension-telemetry';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { ActiveOrgOutput } from '../../../client/pac/PacTypes';
import { orgChangeErrorEvent, orgChangeEvent } from '../../OrgChangeNotifier';
import { ORG_DETAILS_KEY, handleOrgChangeSuccess, initializeOrgDetails } from '../../utilities/OrgHandlerUtils';
import { getEndpoint } from './PowerPagesChatParticipantUtils';
import { AUTHENTICATION_FAILED_MSG, COPILOT_NOT_AVAILABLE_MSG, PAC_AUTH_NOT_FOUND, POWERPAGES_CHAT_PARTICIPANT_ID, RESPONSE_AWAITED_MSG } from './PowerPagesChatParticipantConstants';
import { intelligenceAPIAuthentication } from '../../services/AuthenticationProvider';

export class PowerPagesChatParticipant {
    private static instance: PowerPagesChatParticipant | null = null;
    private chatParticipant: vscode.ChatParticipant;
    private telemetry: ITelemetry;
    private extensionContext: vscode.ExtensionContext;
    private readonly _pacWrapper?: PacWrapper;
    private isOrgDetailsInitialized = false;
    private readonly _disposables: vscode.Disposable[] = [];
    private cachedEndpoint: { intelligenceEndpoint: string, geoName: string } | null = null;

    private orgID: string | undefined;
    private orgUrl: string | undefined;

    private constructor(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter, pacWrapper?: PacWrapper) {

        this.chatParticipant = createChatParticipant(POWERPAGES_CHAT_PARTICIPANT_ID, this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

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
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _token: vscode.CancellationToken
    ): Promise<IPowerPagesChatResult> => {
        // Handle chat requests here

        stream.progress(RESPONSE_AWAITED_MSG)

        await this.initializeOrgDetails();

        if (!this.orgID) {
            stream.markdown(PAC_AUTH_NOT_FOUND);
            return {
                metadata: {
                    command: ''
                }
            };
        }

        const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.telemetry, '', this.orgID, true);

        if (!intelligenceApiAuthResponse) {
            stream.markdown(AUTHENTICATION_FAILED_MSG);

            return {
                metadata: {
                    command: '',
                }
            };
        }

        const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;

        const { intelligenceEndpoint, geoName } = await getEndpoint(this.orgID, this.telemetry, this.cachedEndpoint);

        if (!intelligenceEndpoint || !geoName) {
            stream.markdown(COPILOT_NOT_AVAILABLE_MSG)

            return {
                metadata: {
                    command: ''
                }
            };
        }

        const userPrompt = request.prompt;

        if (!userPrompt) {

            //TODO: Show start message

            return {
                metadata: {
                    command: ''
                }
            };
        }

        //TODO: Handle form and list scenarios
        const llmResponse = await sendApiRequest([{ displayText: userPrompt, code: '' }], { dataverseEntity: '', entityField: '', fieldType: '' }, this.orgID, intelligenceApiToken, '', '', [], this.telemetry, intelligenceEndpoint, geoName);

        stream.markdown(llmResponse[0].displayText);

        stream.markdown('\n```typescript\n' + llmResponse[0].code + '\n```');

        return {
            metadata: {
                command: ''
            }
        };

    };

    private async initializeOrgDetails(): Promise<void> {
        const { orgID, orgUrl } = await initializeOrgDetails(this.isOrgDetailsInitialized, this.extensionContext, this._pacWrapper);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
    }

    private async handleOrgChangeSuccess(orgDetails: ActiveOrgOutput): Promise<void> {
        const { orgID, orgUrl } = handleOrgChangeSuccess(orgDetails, this.extensionContext);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
    }
}
