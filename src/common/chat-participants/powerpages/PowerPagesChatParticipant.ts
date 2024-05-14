/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { ITelemetry } from '../../../client/telemetry/ITelemetry';
import TelemetryReporter from '@vscode/extension-telemetry';
import { getIntelligenceEndpoint } from '../../ArtemisService';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { PAC_SUCCESS } from '../../copilot/constants';
import { createAuthProfileExp } from '../../Utils';
import { intelligenceAPIAuthentication } from '../../AuthenticationProvider';
import { ActiveOrgOutput } from '../../../client/pac/PacTypes';
import { orgChangeErrorEvent, orgChangeEvent } from '../../OrgChangeNotifier';

export interface OrgDetails {
    orgID: string;
    orgUrl: string;
}

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

        this.chatParticipant = createChatParticipant('powerpages', this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

        this.telemetry = telemetry;

        this.extensionContext = context;

        this._pacWrapper = pacWrapper;

        this._disposables.push(orgChangeEvent(async (orgDetails: ActiveOrgOutput) => {
            await this.handleOrgChangeSuccess(orgDetails);
        }));

        this._disposables.push(orgChangeErrorEvent(async () => {
            await createAuthProfileExp(this._pacWrapper);
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

        //TODO: Move strings to constant once finalized
        stream.progress('Working on it...')

        await this.intializeOrgDetails();

        if (!this.orgID) {
            // TODO: Auth Create Experience
            await createAuthProfileExp(this._pacWrapper);
            return {
                metadata: {
                    command: ''
                }
            };
        }

        const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.telemetry, '', this.orgID, true);

        if (!intelligenceApiAuthResponse) {

            stream.markdown('Authentication failed. Please try again.');

            return {
                metadata: {
                    command: '',
                }
            };
        }

        const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;

        const { intelligenceEndpoint, geoName } = await this.getEndpoint(this.orgID, this.telemetry);

        if (!intelligenceEndpoint || !geoName) {

            stream.markdown('Copilot is not available. Please contact your administrator.')

            return {
                metadata: {
                    command: ''
                }
            };
        }

        const userPrompt = request.prompt;

        //TODO: Handle form and list scenarios

        if (!userPrompt) {

            //TODO: Show start message

            return {
                metadata: {
                    command: ''
                }
            };
        }

        // export async function sendApiRequest(userPrompt: UserPrompt[], activeFileParams: IActiveFileParams, orgID: string, apiToken: string, sessionID: string, entityName: string, entityColumns: string[], telemetry: ITelemetry, aibEndpoint: string | null, geoName: string | null) {}
        const llmResponse = await sendApiRequest([{ displayText: userPrompt, code: '' }], { dataverseEntity: '', entityField: '', fieldType: '' }, this.orgID, intelligenceApiToken, '', '', [], this.telemetry, intelligenceEndpoint, geoName);

        stream.markdown(llmResponse[0].displayText);

        stream.markdown('\n```typescript\n' + llmResponse[0].code + '\n```');
        // TODO: Handle authentication and org change

        return {
            metadata: {
                command: ''
            }
        };

    };

    private async intializeOrgDetails(): Promise<void> {

        if (this.isOrgDetailsInitialized) {
            return;
        }

        this.isOrgDetailsInitialized = true;

        const orgDetails: OrgDetails | undefined = this.extensionContext.globalState.get('orgDetails');

        if (orgDetails) {
            this.orgID = orgDetails.orgID;
            this.orgUrl = orgDetails.orgUrl;
        } else {
            if (this._pacWrapper) {
                const pacActiveOrg = await this._pacWrapper.activeOrg();
                if (pacActiveOrg && pacActiveOrg.Status === PAC_SUCCESS) {
                    this.handleOrgChangeSuccess(pacActiveOrg.Results);
                } else {
                    await createAuthProfileExp(this._pacWrapper);
                }
            }
        }
    }

    private async handleOrgChangeSuccess(orgDetails: ActiveOrgOutput) {
        this.orgID = orgDetails.OrgId;
        this.orgUrl = orgDetails.OrgUrl

        this.extensionContext.globalState.update('orgDetails', { orgID: this.orgID, orgUrl: this.orgUrl });

        //TODO: Handle AIB GEOs
    }

    async getEndpoint(orgID: string, telemetry: ITelemetry) {
        if (!this.cachedEndpoint) {
            this.cachedEndpoint = await getIntelligenceEndpoint(orgID, telemetry, '') as { intelligenceEndpoint: string; geoName: string };
        }
        return this.cachedEndpoint;
    }
}
