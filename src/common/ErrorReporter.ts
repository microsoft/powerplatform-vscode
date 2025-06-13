/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { oneDSLoggerWrapper } from "./OneDSLoggerTelemetry/oneDSLoggerWrapper";
import * as vscode from "vscode";
/**
 * Static helper class to report errors to telemetry and show them as error dialogs.
 */
export class ErrorReporter {
    /**
     * Reports an error to telemetry and optionally shows an error dialog to the user.
     * @param logger Logger used to send telemetry.
     * @param errorIdentifier Unique identifier for the error.
     * @param error The error to report. If error is a primitive or complex object (but not error) it will be stringified.
     * @param message Error message that explains the error.
     * @param showDialog [Default `true`] If `true`, an error dialog will be shown to the user.
     * @param properties [Optional] Additional properties to include in the telemetry event.
     */
    public static async report(
        errorIdentifier: string,
        error: unknown,
        message: string,
        showDialog = true,
        properties?: Record<string, string>
    ): Promise<void> {
        const errorObj = ErrorReporter.unknownToError(error);
        const errorObjMessage = errorObj
            ? ` - Inner Message: ${errorObj.message}`
            : "";
        const errorStack = errorObj ? ` - Stack: ${errorObj.stack}` : "";
        const errorMessage = `${message}${errorObjMessage}`;
        oneDSLoggerWrapper.getLogger().traceError(
            errorIdentifier,
            message,
            new Error(`${errorIdentifier}: ${errorMessage}${errorStack}`),
            properties
        );

        if (showDialog) {
            await vscode.window.showErrorMessage(errorMessage);
        }
    }

    /**
     *
     * @param error The error to report. If error is a primitive or complex object (but not error) it will be stringified.
     * @returns An error object or undefined if error was undefined.
     */
    private static unknownToError(error: unknown): Error | undefined {
        if (error instanceof Error) {
            return error;
        }

        if (!error) {
            return undefined;
        }

        try {
            return new Error(JSON.stringify(error));
        } catch (error) {
            return new Error("unknown error.");
        }
    }
}
