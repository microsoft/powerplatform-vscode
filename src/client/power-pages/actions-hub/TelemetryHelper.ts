/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import PacContext from "../../pac/PacContext";
import CurrentSiteContext from "./CurrentSiteContext";
import ArtemisContext from '../../ArtemisContext';
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

export const getBaseEventInfo = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventInfo = {} as any;

    if (ArtemisContext.ServiceResponse) {
        eventInfo.stamp = ArtemisContext.ServiceResponse?.stamp ?? "";
        eventInfo.geo = ArtemisContext.ServiceResponse?.response?.geoName ?? "";
    }

    if (PacContext.OrgInfo?.OrgId) {
        eventInfo.orgId = PacContext.OrgInfo?.OrgId;
    }

    if (PacContext.OrgInfo?.OrgUrl) {
        eventInfo.orgUrl = PacContext.OrgInfo?.OrgUrl;
    }

    if (PacContext.AuthInfo?.TenantId) {
        eventInfo.tenantId = PacContext.AuthInfo?.TenantId;
    }

    if (CurrentSiteContext.currentSiteId) {
        eventInfo.currentSiteId = CurrentSiteContext.currentSiteId;
    }

    return eventInfo;
}

export const traceInfo = (eventName: string, eventInfo?: object) => {
    const baseEventInfo = getBaseEventInfo();
    const eventData = { ...baseEventInfo, ...eventInfo };
    oneDSLoggerWrapper.getLogger().traceInfo(eventName, eventData);
}

export const traceError = (eventName: string, error: Error, eventInfo?: object) => {
    const baseEventInfo = getBaseEventInfo();
    const eventData = { ...baseEventInfo, error: error.message, ...eventInfo };
    oneDSLoggerWrapper.getLogger().traceError(eventName, error.message, error, eventData);
}
