/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { IIntelligenceAPIEndpointInformation } from "../../../../services/Interfaces";

export interface ICreateSiteOptions {
    intelligenceAPIEndpointInfo: IIntelligenceAPIEndpointInformation;
    intelligenceApiToken: string;
    userPrompt: string;
    sessionId: string;
    stream: vscode.ChatResponseStream;
    orgId: string;
    envId: string;
    userId: string;
    extensionContext: vscode.ExtensionContext;
}

export interface IPreviewSitePagesContentOptions {
    // siteName: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sitePages: any[];
    stream: vscode.ChatResponseStream;
    extensionContext: vscode.ExtensionContext;
    sessionId: string;
    orgId: string;
    envId: string;
    userId: string;
}

export interface ISiteInputState {
    siteName: string;
    envName: string;
    orgUrl: string;
    domainName: string;
    title: string;
    step: number;
    totalSteps: number;
}
