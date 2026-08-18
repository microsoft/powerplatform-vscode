/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from '../constants/uriConstants';

/**
 * Localized messages surfaced while validating a hand-entered agentic-create deep link.
 */
export interface AgenticCreateLinkStrings {
    required: string;
    invalid: string;
    unsupportedScheme: string;
    /** Contains a `{0}` placeholder replaced with the expected deep-link path. */
    unsupportedPath: string;
    placeholdersRemaining: string;
}

/**
 * URI schemes accepted by the local trigger. The running window's scheme is added by the caller
 * so an Insiders or Exploration build can replay its own links.
 */
export const DEFAULT_ALLOWED_SCHEMES: readonly string[] = ['vscode', 'vscode-insiders'];

/**
 * Builds a readable, editable sample `/agenticCreate` deep link for local testing.
 *
 * Values are intentionally left unencoded so the prefilled input box stays legible; the
 * create-flow parser reads them with `URLSearchParams`, which tolerates raw URLs because the
 * sample carries no `&` characters inside a value.
 *
 * @param scheme URI scheme of the running VS Code window, for example `vscode-insiders`.
 * @returns A deep link whose angle-bracket placeholders the developer replaces before running.
 */
export function buildSampleAgenticCreateLink(scheme: string = DEFAULT_ALLOWED_SCHEMES[0]): string {
    const { PARAMETERS, LOCAL_TRIGGER, SOURCE_VALUES, AGENT_HOST_VALUES, CONTRACT_VERSION } = URI_CONSTANTS;
    const query = [
        [PARAMETERS.ENV_ID, LOCAL_TRIGGER.SAMPLE.ENVIRONMENT_ID],
        [PARAMETERS.ORG_URL, LOCAL_TRIGGER.SAMPLE.ORG_URL],
        [PARAMETERS.WEBSITE_ID, LOCAL_TRIGGER.SAMPLE.WEBSITE_ID],
        [PARAMETERS.REGION, LOCAL_TRIGGER.SAMPLE.REGION],
        [PARAMETERS.SOURCE, SOURCE_VALUES.POWER_PAGES_HOME],
        [PARAMETERS.AGENT_HOST, AGENT_HOST_VALUES.AUTO],
        [PARAMETERS.VERSION, CONTRACT_VERSION.CURRENT]
    ]
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    return `${scheme}://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.AGENTIC_CREATE}?${query}`;
}

/**
 * Validates a hand-entered agentic-create deep link before it is dispatched.
 *
 * @param value Raw input-box text.
 * @param strings Localized validation messages.
 * @param allowedSchemes URI schemes treated as valid.
 * @returns An error message when the link is unusable, otherwise undefined.
 */
export function validateAgenticCreateLink(
    value: string,
    strings: AgenticCreateLinkStrings,
    allowedSchemes: readonly string[] = DEFAULT_ALLOWED_SCHEMES
): string | undefined {
    const trimmed = value.trim();
    if (!trimmed) {
        return strings.required;
    }

    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        return strings.invalid;
    }

    // URL keeps the trailing colon on the protocol; compare against bare scheme names.
    const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();
    if (!allowedSchemes.some((allowed) => allowed.toLowerCase() === scheme)) {
        return strings.unsupportedScheme;
    }

    if (parsed.pathname !== URI_CONSTANTS.PATHS.AGENTIC_CREATE) {
        return strings.unsupportedPath.replace('{0}', URI_CONSTANTS.PATHS.AGENTIC_CREATE);
    }

    if (URI_CONSTANTS.LOCAL_TRIGGER.PLACEHOLDER_PATTERN.test(trimmed)) {
        return strings.placeholdersRemaining;
    }

    return undefined;
}
