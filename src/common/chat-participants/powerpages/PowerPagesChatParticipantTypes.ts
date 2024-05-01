/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export interface IPowerPagesChatResult extends vscode.ChatResult {
    metadata: {
        command: string;
    }
}
