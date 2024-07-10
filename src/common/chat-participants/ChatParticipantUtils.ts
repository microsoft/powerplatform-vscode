/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export function createChatParticipant(participantId: string, handler: vscode.ChatRequestHandler): vscode.ChatParticipant {
    return vscode.chat.createChatParticipant(participantId, handler);
}
