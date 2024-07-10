/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { buildAgentString } from "../telemetry/batchedTelemetryAgent";
import { ITelemetry } from "../../common/OneDSLoggerTelemetry/telemetry/ITelemetry";
import { IPacWrapperContext } from "./PacWrapper";

export class PacWrapperContext implements IPacWrapperContext {
    public constructor(
        private readonly _context: vscode.ExtensionContext,
        private readonly _telemetry: ITelemetry) {
    }
    public get globalStorageLocalPath(): string { return this._context.globalStorageUri.fsPath; }
    public get telemetry(): ITelemetry { return this._telemetry; }
    public get automationAgent(): string { return buildAgentString(this._context) }
    public IsTelemetryEnabled(): boolean {
        return vscode.env.isTelemetryEnabled;
    }
    public GetCloudSetting(): string {
        const config = vscode.workspace.getConfiguration('powerPlatform');
        const cloud = config.get<string>('auth.cloud');
        const override = config.get<string>('experimental.auth.testCloudOverride')?.trim();
        return override || cloud || 'Public';
    }
}
