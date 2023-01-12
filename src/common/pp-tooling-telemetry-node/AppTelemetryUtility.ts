/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { IAppTelemetryEnvironment } from "./interfaces";
import * as TelemetryConstants from './TelemetryConstants';

const MaxAutomationAgentLength = 64;

// This is a limited char set than is supported with HTTP User-Agent for now, as in practice, most symbols aren't used for user agents.
// However, we do want to allow for using package names (nuget, npm, etc), .net assembly names, etc.
const ProductNameRegex = /^[a-zA-Z0-9.+_-]+$/;
const SystemVersionRegex = /^\d+(\.\d+){1,3}$/;

export function composeAutomationAgentString(productName: string, productVersion: string): string {
    if (!productName) throw new Error("productName must be specified.");
    if (!productVersion) throw new Error("productVersion must be specified.");

    if (!ProductNameRegex.test(productName)) {
        throw new Error(`productName '${productName}' is invalid; only the following characters are allowed: letters, numbers, and the symbols '.', '+', '_', '-'.`);
    }
    if (!isSupportedAgentProductVersion(productVersion)) {
        throw new Error(`productVersion '${productVersion}' is invalid; it should be a valid System.Version or SemVer (v2).`);
    }

    return `${productName}/${productVersion}`;
}

export function isSupportedAgentProductVersion(productVersion: string): boolean {
    if (productVersion) {
        // For simplicity, we ignore all content after the SemVer pre-release tag (-) or build metadata (+)
        const idxPreRelease = productVersion.indexOf('-');
        const idxMetadata = productVersion.indexOf('+');
        const idxPreReleaseOrMetadata = idxPreRelease < 0 ? idxMetadata
            : idxMetadata < 0 ? idxPreRelease
                : Math.min(idxPreRelease, idxMetadata);

        const versionSubStr = idxPreReleaseOrMetadata === -1 ? productVersion : productVersion.substring(0, idxPreReleaseOrMetadata);
        return versionSubStr.length >= 1 && SystemVersionRegex.test(versionSubStr);
    }

    return false;
}

export function tryParseAutomationAgentStringProductNameVersion(agent: string): {
    success: true,
    firstProductName: string,
    firstProductVersion: string
} | {
    success: false,
    invalidReason: string
} {
    if (!agent) throw new Error("agent must be specified.");

    const firstProduct = agent.split(' ', 2)[0];
    if (firstProduct.length > MaxAutomationAgentLength) {
        return {
            success: false,
            invalidReason: `The first product (name and version) has a length of ${firstProduct.length} which is longer than allowed length of ${MaxAutomationAgentLength}.`,
        };
    }

    const parts = firstProduct.split('/');
    if (parts.length !== 2) { // both parts are required
        return {
            success: false,
            invalidReason: "Missing '/' character.",
        };
    }

    const productName = parts[0];
    if (!productName
        || !ProductNameRegex.test(productName)) {
        return {
            success: false,
            invalidReason: "Product name is empty or contains characters other than alpha-numeric and '.', '+', '_', '-'.",
        };
    }

    const productVersion = parts[1];
    if (!isSupportedAgentProductVersion(productVersion)) {
        return {
            success: false,
            invalidReason: "Product version is empty or is not a valid System.Version or SemVer (v2).",
        };
    }

    return {
        success: true,
        firstProductName: productName,
        firstProductVersion: productVersion,
    };
}

function validateAndSanitizeAutomationAgent(environment: IAppTelemetryEnvironment): string | undefined {
    if (!environment.automationAgent) {
        return undefined;
    }

    const result = tryParseAutomationAgentStringProductNameVersion(environment.automationAgent);
    if (result.success !== true) {
        // We throw here because otherwise this corrupts our ability to have accurate telemetry based on automationAgent
        throw new Error(`[AppTelemetryConfigurationException] The automationAgent '${environment.automationAgent}' is invalid. ${result.invalidReason} This exception should be considered a developer bug of the calling agent.`);
    }

    let agent = environment.automationAgent;
    // We want to limit open-ended values which could come outside our system.
    // Try shortening it to just the first product/version if it's original text is too long
    if (agent.length > MaxAutomationAgentLength) {
        // we add a comment to indicate in telemetry that it's truncated. This is per the HTTP spec
        agent = composeAutomationAgentString(result.firstProductName, result.firstProductVersion) + " --truncated--";
    }

    return agent;
}

export function parseBooleanEnvironmentVariable(value: string | null | undefined): boolean | undefined {
    if (value) {
        if (value === "1" || value.toUpperCase() === "TRUE") {
            return true;
        }
        if (value === "0" || value.toUpperCase() === "FALSE") {
            return false;
        }
    }

    return undefined;
}

export function createCommonAppStartProperties(environment: IAppTelemetryEnvironment): Record<string, string> {
    const properties: Record<string, string> = {};

    const agent = validateAndSanitizeAutomationAgent(environment);
    if (agent) {
        properties[TelemetryConstants.PropertyNames.automationAgent] = agent;
    }

    return properties;
}
