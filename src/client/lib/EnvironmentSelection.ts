/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ActiveOrgOutput, OrgListOutput, PacOrgWhoOutput } from '../pac/PacTypes';

function normalizeIdentifier(identifier: string | undefined): string | undefined {
    const normalizedIdentifier = identifier?.trim().replace(/^\{/, '').replace(/\}$/, '').toLowerCase();
    return normalizedIdentifier || undefined;
}

function normalizeUrl(url: string | undefined): string | undefined {
    const trimmedUrl = url?.trim();
    if (!trimmedUrl) {
        return undefined;
    }

    try {
        const parsedUrl = new URL(trimmedUrl);
        const path = parsedUrl.pathname.replace(/\/+$/, '');
        return `${parsedUrl.protocol}//${parsedUrl.host}${path}`.toLowerCase();
    } catch {
        return trimmedUrl.replace(/\/+$/, '').toLowerCase();
    }
}

export function isActiveEnvironment(environment: OrgListOutput, activeOrg?: ActiveOrgOutput): boolean {
    if (environment.IsActive) {
        return true;
    }

    if (!activeOrg) {
        return false;
    }

    const environmentId = normalizeIdentifier(environment.EnvironmentIdentifier?.Id);
    const activeEnvironmentId = normalizeIdentifier(activeOrg.EnvironmentId);
    if (environmentId && activeEnvironmentId && environmentId === activeEnvironmentId) {
        return true;
    }

    if (environmentId && activeEnvironmentId) {
        return false;
    }

    const environmentUrl = normalizeUrl(environment.EnvironmentUrl);
    const activeOrgUrl = normalizeUrl(activeOrg.OrgUrl);
    return !!environmentUrl && !!activeOrgUrl && environmentUrl === activeOrgUrl;
}

export function getActiveOrgFromOutput(activeOrgOutput?: PacOrgWhoOutput): ActiveOrgOutput | undefined {
    return activeOrgOutput?.Status === "Success"
        ? activeOrgOutput.Results
        : undefined;
}
