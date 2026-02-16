/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Structured error details extracted from an HTTP Response.
 */
export interface IHttpResponseErrorDetails {
    /** HTTP status code (e.g., 404, 500) */
    statusCode: number;
    /** HTTP status text (e.g., "Not Found", "Internal Server Error") */
    statusText: string;
    /** Response body content, if available */
    responseBody?: string;
    /** Original request URL */
    url?: string;
}

/**
 * Extended Error type with HTTP response details attached.
 */
export interface HttpResponseError extends Error {
    httpDetails?: IHttpResponseErrorDetails;
}

/**
 * Minimal interface for HTTP Response objects.
 * Works with both browser's native Response and node-fetch's Response.
 */
interface IHttpResponse {
    status: number;
    statusText: string;
    url: string;
    clone(): IHttpResponse;
    text(): Promise<string>;
}

/**
 * Creates an Error object with meaningful message from an HTTP Response.
 *
 * Use this instead of: throw new Error(JSON.stringify(response))
 *
 * The Response object from fetch has non-enumerable properties, which means
 * JSON.stringify(response) produces "{}". This function properly extracts
 * the status code, status text, and response body for meaningful error messages.
 *
 * @param response - The fetch Response object (works with node-fetch and native fetch)
 * @returns Promise resolving to an Error with descriptive message and httpDetails
 */
export async function createHttpResponseError(response: IHttpResponse): Promise<HttpResponseError> {
    let responseBody: string | undefined;

    try {
        // Clone the response to avoid consuming the body
        // (in case caller needs to read it again)
        const clonedResponse = response.clone();
        responseBody = await clonedResponse.text();
    } catch {
        // Body may already be consumed or unavailable
        responseBody = undefined;
    }

    const details: IHttpResponseErrorDetails = {
        statusCode: response.status,
        statusText: response.statusText,
        responseBody: responseBody,
        url: response.url
    };

    const error = new Error(formatHttpErrorMessage(details)) as HttpResponseError;
    // Attach the structured details for telemetry use
    error.httpDetails = details;
    return error;
}

/**
 * Formats HTTP error details into a human-readable message.
 *
 * @param details - The structured HTTP error details
 * @returns Formatted error message string
 */
export function formatHttpErrorMessage(details: IHttpResponseErrorDetails): string {
    let message = `HTTP ${details.statusCode}`;

    if (details.statusText) {
        message += ` ${details.statusText}`;
    }

    if (details.responseBody) {
        // Truncate response body if too long (Dataverse can return large error responses)
        const maxBodyLength = 500;
        const truncatedBody = details.responseBody.length > maxBodyLength
            ? details.responseBody.substring(0, maxBodyLength) + '...'
            : details.responseBody;
        message += ` - ${truncatedBody}`;
    }

    return message;
}

/**
 * Type guard to check if an error is an HttpResponseError.
 *
 * @param error - The error to check
 * @returns True if the error is an HttpResponseError with httpDetails
 */
export function isHttpResponseError(error: unknown): error is HttpResponseError {
    return error instanceof Error && 'httpDetails' in error;
}
