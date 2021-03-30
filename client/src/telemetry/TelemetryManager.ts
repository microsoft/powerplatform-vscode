// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TelemetryReporter from "vscode-extension-telemetry";
import { TelemetryEventName } from "./TelemetryEvents";

export class TelemetryManager {
    private static instance: TelemetryManager;
    private reporter : TelemetryReporter;

    private constructor(id: string, version: string, instrumentationKey: string) {
        this.reporter = new TelemetryReporter(id, version, instrumentationKey);
    }

    public static getInstance(
        id?: string,
        version?: string,
        key?: string
    ): TelemetryManager {
        if (!TelemetryManager.instance) {
            TelemetryManager.instance = new TelemetryManager(id, version, key);
        }

        return TelemetryManager.instance;
    }

    public getReporter(): TelemetryReporter {
        return this.reporter;
    }

    public report(event: TelemetryEventName): void {
        this.reporter.sendTelemetryEvent(event);
    }

    public reportErrorEvent(event: TelemetryEventName, error: Error): void {
        this.reporter.sendTelemetryErrorEvent(event, {
            error: error.message,
        });
    }
    public reportException(error: Error): void {
        this.reporter.sendTelemetryException(error);
    }
}

