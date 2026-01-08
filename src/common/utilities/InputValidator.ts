/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

const MAX_USER_INPUT_LENGTH = 2000;

/**
 * Validates and sanitizes user input text before processing or API submission.
 * @param text - The raw input text from the user
 * @param maxLength - Optional maximum length (defaults to 2000)
 * @returns Sanitized text or null if invalid
 */
export function validateAndSanitizeUserInput(text: string | undefined | null, maxLength: number = MAX_USER_INPUT_LENGTH): string | null {
    if (text === undefined || text === null) {
        return null;
    }

    // Trim whitespace
    let sanitized = text.trim();

    // Check if empty after trimming
    if (sanitized.length === 0) {
        return null;
    }

    // Truncate to maximum length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    // Remove control characters except newlines and tabs
    // eslint-disable-next-line no-control-regex
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Normalize line endings
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    return sanitized;
}
