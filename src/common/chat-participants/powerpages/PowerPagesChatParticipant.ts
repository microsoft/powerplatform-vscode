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
import { intelligenceAPIAuthentication } from '../../../web/client/common/authenticationProvider';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';


export class PowerPagesChatParticipant {
    private chatParticipant: vscode.ChatParticipant;
    private telemetry: ITelemetry;
    private extensionContext: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter,) {

        this.chatParticipant = createChatParticipant('powerpages', this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

        this.telemetry = telemetry;

        this.extensionContext = context;
    }

    private handler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest,
        _context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        _token: vscode.CancellationToken
    ): Promise<IPowerPagesChatResult> => {
        // Handle chat requests here

        stream.progress('Working on it...')

        let orgID = this.extensionContext.globalState.get('orgID', '');

        orgID = 'eff535da-5f08-ef11-9f88-00224820c64c';

        if (!orgID) {
            // TODO: Auth Create Experience


            return {
                metadata: {
                    command: ''
                }
            };
        }

        const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.telemetry, '', orgID, true);

        if (!intelligenceApiAuthResponse) {

            //TODO: Handle auth error and provide a way to re-authenticate

            return {
                metadata: {
                    command: ''
                }
            };
        }

        const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;

        const { intelligenceEndpoint, geoName }  = await getIntelligenceEndpoint(orgID, this.telemetry, ''); //TODO: Optimize to avoid multiple calls to get intelligence endpoint

        if (!intelligenceEndpoint || !geoName) {
            //TODO: Handle error

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
        const llmResponse = await sendApiRequest([{displayText: userPrompt, code: ''}], {dataverseEntity:'', entityField: '', fieldType: ''}, orgID, intelligenceApiToken, '', '', [], this.telemetry, intelligenceEndpoint, geoName);

        stream.markdown(llmResponse[0].displayText);

        stream.markdown('\n```typescript\n' + llmResponse[0].code + '\n```');
        // TODO: Handle authentication and org change

        console.log(_token)

        return {
            metadata: {
                command: ''
            }
        };

    };

}
