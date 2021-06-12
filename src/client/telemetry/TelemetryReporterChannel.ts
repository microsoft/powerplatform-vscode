// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import TelemetryReporter from 'vscode-extension-telemetry';
import { ITelemetryEvent, ITelemetryErrorEvent, ITelemetryExceptionData } from '../../common/telemetry/DataInterfaces';
import { ITelemetryChannel } from '../../common/telemetry/ITelemetryChannel';

/**
 * An ITelemetryChannel implementation based on an implementation of a vscode-extension-telemetry's TelemetryReporter.
 */
export default class TelemetryReporterChannel implements ITelemetryChannel {
    constructor(private readonly _reporter: TelemetryReporter){}

    trackEvent(event: ITelemetryEvent): void {
        this._reporter.sendTelemetryEvent(event.name, event.properties, event.measurements);
    }

    trackErrorEvent(event: ITelemetryErrorEvent): void {
        this._reporter.sendTelemetryErrorEvent(event.name, event.properties, event.measurements, event.errorProps);
    }

    trackException(exceptionData: ITelemetryExceptionData): void {
        this._reporter.sendTelemetryException(exceptionData.error, exceptionData.properties, exceptionData.measurements);
    }
}
