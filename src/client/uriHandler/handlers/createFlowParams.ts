/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_CONSTANTS } from "../constants/uriConstants";

/**
 * Parameters carried by the Power Pages "create" deep links (`/agenticCreate` and
 * `/pacCreate`). The link is treated as a versioned, secret-free contract; see
 * {@link URI_CONSTANTS.PARAMETERS} for the canonical query-parameter names.
 */
export interface CreateFlowParameters {
    environmentId: string | null;
    orgUrl: string | null;
    region: string | null;
    tenantId: string | null;
    websiteId: string | null;
    source: string | null;
    agentHost: string | null;
    version: string | null;
}

/**
 * Parses the shared create-flow query parameters from a deep-link URI.
 */
export function parseCreateFlowParameters(uri: vscode.Uri): CreateFlowParameters {
    const urlParams = new URLSearchParams(uri.query);

    return {
        environmentId: urlParams.get(URI_CONSTANTS.PARAMETERS.ENV_ID),
        orgUrl: urlParams.get(URI_CONSTANTS.PARAMETERS.ORG_URL),
        region: urlParams.get(URI_CONSTANTS.PARAMETERS.REGION),
        tenantId: urlParams.get(URI_CONSTANTS.PARAMETERS.TENANT_ID),
        websiteId: urlParams.get(URI_CONSTANTS.PARAMETERS.WEBSITE_ID),
        source: urlParams.get(URI_CONSTANTS.PARAMETERS.SOURCE),
        agentHost: urlParams.get(URI_CONSTANTS.PARAMETERS.AGENT_HOST),
        version: urlParams.get(URI_CONSTANTS.PARAMETERS.VERSION)
    };
}

/**
 * Builds a non-sensitive telemetry payload describing a create-flow deep link.
 * Only low-cardinality, non-secret values (source, agent host, contract version, region)
 * and presence flags for identifiers are recorded — never raw org URLs or tenant IDs.
 */
export function buildCreateFlowTelemetry(params: CreateFlowParameters): Record<string, string> {
    return {
        source: params.source || 'unknown',
        agentHost: params.agentHost || 'unspecified',
        version: params.version || 'unspecified',
        region: params.region || 'unspecified',
        hasEnvironmentId: params.environmentId ? 'true' : 'false',
        hasOrgUrl: params.orgUrl ? 'true' : 'false',
        hasWebsiteId: params.websiteId ? 'true' : 'false',
        hasTenantId: params.tenantId ? 'true' : 'false'
    };
}
