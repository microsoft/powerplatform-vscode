/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { intelligenceAPIAuthentication } from '../../../web/client/common/authenticationProvider';
import { ITelemetry } from '../../../client/telemetry/ITelemetry';
import TelemetryReporter from '@vscode/extension-telemetry';


export class PowerPagesChatParticipant {
    private chatParticipant: vscode.ChatParticipant;
    private telemetry: ITelemetry;

    constructor(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter,) {
        console.log("PowerPagesChatParticipant constructor");

        this.chatParticipant = createChatParticipant('powerpages', this.handler);

        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

        this.telemetry = telemetry;

    }

    private handler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest,
        context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<IPowerPagesChatResult> => {
        // Handle chat requests here

        const aibAuth = await intelligenceAPIAuthentication(this.telemetry, 'sessionID', '9ba620dc-4b37-430e-b779-2f9a7e7a52a6', true)

        if(aibAuth.accessToken) {
            
        console.log(request.command);
        console.log(context);
        stream.markdown('Hello from PowerPagesChatParticipant');
        console.log(token);

        console.log("PowerPagesChatParticipant handler");

        } else {
            // User is not signed in
            stream.markdown("Please sign in to use Power Pages")
        }

        return {
            metadata: {
                command: 'powerpages'
            }
        };

    };

}
