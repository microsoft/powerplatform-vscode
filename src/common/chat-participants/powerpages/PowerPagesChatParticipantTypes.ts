/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';

export interface IPowerPagesChatResult extends vscode.ChatResult {
    metadata: {
        command: string;
        scenario: string;
        orgId?: string;
    }
}
export interface IOrgDetails {
    orgID: string;
    orgUrl: string;
    environmentID: string;
}

export interface IComponentInfo {
    componentInfo: string[];
    entityName: string;
}
