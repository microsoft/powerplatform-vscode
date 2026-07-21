/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../pac/PacWrapper";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { UriParameters } from "./uriHandlerUtils";

/**
 * Encapsulates the PAC CLI authentication and environment-selection steps shared by the
 * Power Pages deep-link flows. Extracted from `UriHandler` so that each deep-link handler
 * (`/open` today, `/pacCreate` and `/agenticCreate` in follow-ups) can reuse the exact same
 * auth/environment/reset behavior without duplicating it.
 */
export class AuthEnvironmentService {
    private readonly pacWrapper: PacWrapper;

    constructor(pacWrapper: PacWrapper) {
        this.pacWrapper = pacWrapper;
    }

    /**
     * Handle authentication and environment setup, reporting progress to the user.
     */
    public async prepareAuthenticationAndEnvironment(uriParams: UriParameters, telemetryData: Record<string, string>): Promise<void> {
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: URI_HANDLER_STRINGS.TITLES.POWER_PAGES,
                cancellable: false
            },
            async (progress) => {
                progress.report({
                    message: URI_HANDLER_STRINGS.PROGRESS.PREPARING,
                    increment: 10
                });

                progress.report({
                    message: URI_HANDLER_STRINGS.PROGRESS.VALIDATING_AUTH,
                    increment: 20
                });

                // Check and handle authentication
                await this.ensureAuthentication(uriParams, telemetryData, progress);

                progress.report({
                    message: URI_HANDLER_STRINGS.PROGRESS.CHECKING_ENV,
                    increment: 20
                });

                // Check and handle environment switching
                await this.ensureCorrectEnvironment(uriParams, telemetryData, progress);

                progress.report({
                    message: URI_HANDLER_STRINGS.PROGRESS.READY_TO_SELECT,
                    increment: 30
                });

                // Brief delay to let user see the final progress message
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        );
    }

    /**
     * Ensure user is authenticated with PAC CLI
     */
    private async ensureAuthentication(uriParams: UriParameters, telemetryData: Record<string, string>, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        let authInfo;
        try {
            authInfo = await this.pacWrapper.activeOrg();
        } catch (error) {
            await this.resetPacProcessAndThrow(error, telemetryData, 'Failed to check authentication status', 'auth_check_failed');
        }

        if (!authInfo || authInfo.Status !== "Success") {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_AUTH_REQUIRED,
                { ...telemetryData, authStatus: authInfo?.Status || 'none' }
            );

            progress.report({
                message: URI_HANDLER_STRINGS.PROGRESS.AUTH_REQUIRED,
                increment: 10
            });

            const authRequired = await vscode.window.showWarningMessage(
                URI_HANDLER_STRINGS.PROMPTS.AUTH_REQUIRED,
                { modal: true },
                URI_HANDLER_STRINGS.BUTTONS.YES,
                URI_HANDLER_STRINGS.BUTTONS.NO
            );

            if (authRequired === URI_HANDLER_STRINGS.BUTTONS.YES) {
                try {
                    progress.report({
                        message: URI_HANDLER_STRINGS.PROGRESS.AUTHENTICATING,
                        increment: 10
                    });

                    await this.pacWrapper.authCreateNewAuthProfileForOrg(uriParams.orgUrl!);

                    const newAuthInfo = await this.pacWrapper.activeOrg();
                    if (!newAuthInfo || newAuthInfo.Status !== "Success") {
                        throw new Error(URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED);
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_AUTH_COMPLETED,
                        { ...telemetryData, newAuthStatus: newAuthInfo.Status }
                    );
                } catch (authError) {
                    await this.resetPacProcessAndThrow(authError, telemetryData, 'Authentication operation failed', 'auth_operation_failed');
                }
            } else {
                vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_AUTH);
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    { ...telemetryData, reason: 'user_cancelled_auth' }
                );
                throw new Error(URI_HANDLER_STRINGS.ERRORS.USER_CANCELLED_AUTH);
            }
        }
    }

    /**
     * Ensure we're connected to the correct environment
     */
    private async ensureCorrectEnvironment(uriParams: UriParameters, telemetryData: Record<string, string>, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        let currentAuthInfo;
        try {
            currentAuthInfo = await this.pacWrapper.activeOrg();
        } catch (error) {
            await this.resetPacProcessAndThrow(error, telemetryData, 'Failed to check current environment', 'env_check_failed');
        }

        if (currentAuthInfo?.Status === "Success" && currentAuthInfo.Results?.EnvironmentId !== uriParams.environmentId) {
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_REQUIRED,
                {
                    ...telemetryData,
                    currentEnvId: currentAuthInfo.Results?.EnvironmentId || 'unknown',
                    requestedEnvId: uriParams.environmentId
                }
            );

            const switchEnv = await vscode.window.showWarningMessage(
                URI_HANDLER_STRINGS.PROMPTS.ENV_SWITCH_REQUIRED,
                { modal: true },
                URI_HANDLER_STRINGS.BUTTONS.YES,
                URI_HANDLER_STRINGS.BUTTONS.NO
            );

            if (switchEnv === URI_HANDLER_STRINGS.BUTTONS.YES) {
                try {
                    progress.report({
                        message: URI_HANDLER_STRINGS.PROGRESS.SWITCHING_ENV,
                        increment: 10
                    });

                    await this.pacWrapper.orgSelect(uriParams.orgUrl!);

                    const verifyAuthInfo = await this.pacWrapper.activeOrg();
                    if (verifyAuthInfo?.Status !== "Success" || verifyAuthInfo.Results?.EnvironmentId !== uriParams.environmentId) {
                        throw new Error(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED);
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_COMPLETED,
                        { ...telemetryData, switchedToEnvId: verifyAuthInfo.Results?.EnvironmentId }
                    );
                } catch (error) {
                    await this.resetPacProcessAndThrow(error, telemetryData, 'Error switching environment', 'env_switch_error');
                }
            } else {
                vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_ENV);
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    { ...telemetryData, reason: 'user_cancelled_env_switch' }
                );
                throw new Error(URI_HANDLER_STRINGS.ERRORS.USER_CANCELLED_ENV_SWITCH);
            }
        }
    }

    /**
     * Reset PAC process and throw error
     */
    public async resetPacProcessAndThrow(error: unknown, telemetryData: Record<string, string>, message: string, errorType: string): Promise<never> {
        oneDSLoggerWrapper.getLogger().traceError(
            uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
            message,
            error instanceof Error ? error : new Error(String(error)),
            { ...telemetryData, error: errorType }
        );

        await this.resetPacProcessSafely(telemetryData);
        throw error;
    }

    /**
     * Safely reset PAC process without throwing
     */
    public async resetPacProcessSafely(telemetryData: Record<string, string>): Promise<void> {
        try {
            await this.pacWrapper.resetPacProcess();
            oneDSLoggerWrapper.getLogger().traceInfo(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                { ...telemetryData, message: 'PAC process reset after failure' }
            );
        } catch (resetError) {
            oneDSLoggerWrapper.getLogger().traceError(
                uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                'Failed to reset PAC process after failure',
                resetError instanceof Error ? resetError : new Error(String(resetError)),
                { ...telemetryData, error: 'pac_reset_failed' }
            );
        }
    }
}
