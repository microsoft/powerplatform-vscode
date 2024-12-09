/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../../OneDSLoggerTelemetry/telemetry/ITelemetry";
import * as vscode from 'vscode';

export interface ICreateSiteOptions {
    intelligenceEndpoint: string;
    intelligenceApiToken: string;
    userPrompt: string;
    sessionId: string;
    stream: vscode.ChatResponseStream;
    telemetry: ITelemetry;
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
    telemetry: ITelemetry;
    sessionId: string;
    orgId: string;
    envId: string;
    userId: string;
}
