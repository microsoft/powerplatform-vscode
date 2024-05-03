/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { ITelemetry } from '../../../client/telemetry/ITelemetry';
import TelemetryReporter from '@vscode/extension-telemetry';


export class PowerPagesChatParticipant {
    private chatParticipant: vscode.ChatParticipant;
    private telemetry: ITelemetry;

    constructor(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter,) {

        this.chatParticipant = createChatParticipant('powerpages', this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

        this.telemetry = telemetry;

    }

    private handler: vscode.ChatRequestHandler = async (
        _request: vscode.ChatRequest,
        _context: vscode.ChatContext,
        _stream: vscode.ChatResponseStream,
        _token: vscode.CancellationToken
    ): Promise<IPowerPagesChatResult> => {
        // Handle chat requests here

        // TODO: Handle authentication and org change

        return {
            metadata: {
                command: ''
            }
        };

    };

}
