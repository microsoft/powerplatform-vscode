/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Raised when the user explicitly declines an interactive create-flow prompt (for example the
 * authentication or environment-switch confirmation).
 *
 * Callers use this to tell an intentional opt-out apart from a genuine failure: the prompt sites
 * already show their own "cancelled" notification, so re-reporting the same thing as an error
 * would be noise. Every other error is a real failure and must be surfaced to the user.
 */
export class CreateFlowCancellationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CreateFlowCancellationError';

        // Required so `instanceof` keeps working when the class is transpiled to ES5.
        Object.setPrototypeOf(this, CreateFlowCancellationError.prototype);
    }
}

/**
 * Whether the supplied error represents a user-initiated cancellation.
 */
export const isCreateFlowCancellation = (error: unknown): boolean =>
    error instanceof CreateFlowCancellationError;

/**
 * Builds a human-readable message from a PAC CLI result, appending the CLI's own error output
 * when it is available.
 *
 * PAC reports actionable diagnostics (for example "No Dataverse organization was found matching
 * the specified criteria") that are otherwise discarded, leaving the user with a generic failure.
 * @param fallbackMessage Message used when the CLI supplied no error text.
 * @param pacErrors Raw `Errors` array from the PAC CLI output.
 * @returns The fallback message, suffixed with the CLI detail when present.
 */
export const describePacFailure = (fallbackMessage: string, pacErrors?: string[]): string => {
    const detail = (pacErrors ?? [])
        .map(entry => (entry ?? '').trim())
        .filter(entry => entry.length > 0)
        .join(' ');

    return detail.length > 0 ? `${fallbackMessage} ${detail}` : fallbackMessage;
};
