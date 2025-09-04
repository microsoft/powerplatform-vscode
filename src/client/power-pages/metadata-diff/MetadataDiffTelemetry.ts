/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import PacContext from "../../pac/PacContext";
import CurrentSiteContext from "../actions-hub/CurrentSiteContext";
import ArtemisContext from "../../ArtemisContext";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

// Narrow helper (mirrors Actions Hub base enrichment) kept local to avoid coupling common layer.
export const getMetadataDiffBaseEventInfo = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventInfo: any = {};

    if (ArtemisContext.ServiceResponse) {
        eventInfo.stamp = ArtemisContext.ServiceResponse?.stamp ?? "";
        eventInfo.geo = ArtemisContext.ServiceResponse?.response?.geoName ?? "";
    }

    if (PacContext.OrgInfo?.OrgId) {
        eventInfo.orgId = PacContext.OrgInfo.OrgId;
    }
    if (PacContext.OrgInfo?.OrgUrl) {
        eventInfo.orgUrl = PacContext.OrgInfo.OrgUrl;
    }
    if (PacContext.AuthInfo?.TenantId) {
        eventInfo.tenantId = PacContext.AuthInfo.TenantId;
    }
    if (PacContext.AuthInfo?.EnvironmentId) {
        eventInfo.environmentId = PacContext.AuthInfo.EnvironmentId;
        eventInfo.environmentName = PacContext.AuthInfo.OrganizationFriendlyName;
    }
    if (CurrentSiteContext.currentSiteId) {
        eventInfo.currentSiteId = CurrentSiteContext.currentSiteId;
    }
    return eventInfo;
};

export const mdTraceInfo = (eventName: string, eventInfo?: object) => {
    const base = getMetadataDiffBaseEventInfo();
    oneDSLoggerWrapper.getLogger().traceInfo(eventName, { ...base, ...eventInfo });
};

export const mdTraceError = (eventName: string, error: Error | string, eventInfo?: object) => {
    const base = getMetadataDiffBaseEventInfo();
    if (typeof error === 'string') {
        oneDSLoggerWrapper.getLogger().traceError(eventName, error, new Error(error), { ...base, ...eventInfo });
    } else {
        oneDSLoggerWrapper.getLogger().traceError(eventName, error.message, error, { ...base, ...eventInfo });
    }
};
