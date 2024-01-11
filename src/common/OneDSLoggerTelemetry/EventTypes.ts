/*!
 * Copyright (C) Microsoft Corporation. All rights reserved.
 */

import {CustomEventModifier, CustomEventSubType, CustomType, EventType, SeverityLevel} from './EventContants';
import {IWebExtensionTelemetryData} from '../../web/client/telemetry/webExtensionTelemetryInterface';
import {IProDevCopilotTelemetryData} from '../copilot/telemetry/ITelemetry';
import {IPowerPagesTelemetryData, IPowerPagesMeasurementData} from '../../client/power-pages/telemetry';

export interface IUserInfo {
    oid: string;
    tid: string;
}

export interface IEvent {
    eventName: string;
    eventType: EventType | string;
    eventMessage?: object;
    customDimension?: IWebExtensionTelemetryData| IProDevCopilotTelemetryData| IPowerPagesTelemetryData | object;
    customMeasurements?: IWebExtensionTelemetryData| IPowerPagesMeasurementData | object;
    eventSeverity?: SeverityLevel;
    correlationId?: string;
}

export interface ICustomEvent {
    customEventType: CustomType;
    customEventId?: string;
    customEventSubType? : CustomEventSubType;
    customEventModifier? : CustomEventModifier;
}
  export interface IException {
    exceptionName?: string;
    exceptionStack?: string;
    exceptionSource?: string;
    exceptionCauseCode?: string | number;
    exceptionDetails?: string;
  }

  export interface IPlatformInfo {
    surface? :string;
    dataDomain?: string;
    cloudRoleInstance?: string;
    cloudRoleName? :string;
  }