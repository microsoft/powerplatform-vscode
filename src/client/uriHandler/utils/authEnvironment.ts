/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { PacWrapper } from "../../pac/PacWrapper";
import { AuthProfileListing } from "../../pac/PacTypes";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { uriHandlerTelemetryEventNames } from "../telemetry/uriHandlerTelemetryEvents";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import { CreateFlowCancellationError, describePacFailure, isCreateFlowCancellation } from "./createFlowErrors";

/**
 * Compares two environment identifiers.
 *
 * PAC and the deep link can report the same GUID with different casing, so a case-sensitive
 * comparison would report a spurious mismatch and send the user through an environment switch
 * that can never succeed.
 */
const isSameEnvironment = (left: string | undefined | null, right: string): boolean =>
    (left ?? '').trim().toLowerCase() === right.trim().toLowerCase();

/**
 * Compares two organization URLs, ignoring casing and a trailing slash.
 *
 * PAC and the deep link report the same organization with and without the trailing slash,
 * so a plain string comparison would miss an otherwise usable auth profile.
 */
const isSameOrgUrl = (left: string | undefined | null, right: string): boolean => {
    const normalize = (value: string) => value.trim().toLowerCase().replace(/\/+$/, '');
    return normalize(left ?? '') === normalize(right) && normalize(right).length > 0;
};

/**
 * Minimal target required for PAC CLI authentication and environment selection.
 */
export interface AuthEnvironmentTarget {
    environmentId: string | null;
    orgUrl: string | null;
}

interface ValidatedAuthEnvironmentTarget {
    environmentId: string;
    orgUrl: string;
}

/**
 * Outcome of a single attempt to point PAC at the requested environment.
 *
 * Failures are returned rather than thrown so the caller can offer a recovery step
 * (signing in to the target org) before giving up. `recoverable` marks the failures a new
 * auth profile could plausibly fix; a link whose parameters disagree is not one of them.
 */
type EnvironmentSwitchResult =
    | { success: true; environmentId: string | undefined }
    | { success: false; errorMessage: string; recoverable: boolean };

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
    public async prepareAuthenticationAndEnvironment(uriParams: AuthEnvironmentTarget, telemetryData: Record<string, string>): Promise<void> {
        const target = this.validateTarget(uriParams);

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
                await this.ensureAuthentication(target, telemetryData, progress);

                progress.report({
                    message: URI_HANDLER_STRINGS.PROGRESS.CHECKING_ENV,
                    increment: 20
                });

                // Check and handle environment switching
                await this.ensureCorrectEnvironment(target, telemetryData, progress);

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
    private async ensureAuthentication(uriParams: ValidatedAuthEnvironmentTarget, telemetryData: Record<string, string>, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
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

                    await this.pacWrapper.authCreateNewAuthProfileForOrg(uriParams.orgUrl);

                    const newAuthInfo = await this.pacWrapper.activeOrg();
                    if (!newAuthInfo || newAuthInfo.Status !== "Success") {
                        throw new Error(describePacFailure(
                            URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED,
                            newAuthInfo?.Errors
                        ));
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
                throw new CreateFlowCancellationError(URI_HANDLER_STRINGS.ERRORS.USER_CANCELLED_AUTH);
            }
        }
    }

    /**
     * Ensure we're connected to the correct environment
     */
    private async ensureCorrectEnvironment(uriParams: ValidatedAuthEnvironmentTarget, telemetryData: Record<string, string>, progress: vscode.Progress<{ message?: string; increment?: number }>): Promise<void> {
        let currentAuthInfo;
        try {
            currentAuthInfo = await this.pacWrapper.activeOrg();
        } catch (error) {
            await this.resetPacProcessAndThrow(error, telemetryData, 'Failed to check current environment', 'env_check_failed');
        }

        if (currentAuthInfo?.Status === "Success" && !isSameEnvironment(currentAuthInfo.Results?.EnvironmentId, uriParams.environmentId)) {
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

                    let switchResult = await this.trySwitchEnvironment(uriParams);

                    if (!switchResult.success && switchResult.recoverable) {
                        // The user may already have signed in to the target org under a different
                        // profile. Reusing it avoids sending them through a browser sign-in for
                        // an account they have already added.
                        const profileResult = await this.trySwitchWithExistingAuthProfile(uriParams, telemetryData);
                        if (profileResult) {
                            switchResult = profileResult;
                        }
                    }

                    if (!switchResult.success && switchResult.recoverable) {
                        // PAC can only select orgs the signed-in profile can see, so a target in
                        // another tenant or cloud fails here no matter how many times we retry the
                        // switch. Offer to sign in to that org instead of dead-ending the flow.
                        switchResult = await this.retrySwitchWithNewAuthProfile(
                            uriParams,
                            telemetryData,
                            progress,
                            switchResult.errorMessage
                        );
                    }

                    if (!switchResult.success) {
                        throw new Error(switchResult.errorMessage);
                    }

                    oneDSLoggerWrapper.getLogger().traceInfo(
                        uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_COMPLETED,
                        { ...telemetryData, switchedToEnvId: switchResult.environmentId }
                    );
                } catch (error) {
                    if (isCreateFlowCancellation(error)) {
                        throw error;
                    }

                    await this.resetPacProcessAndThrow(error, telemetryData, 'Error switching environment', 'env_switch_error');
                }
            } else {
                vscode.window.showInformationMessage(URI_HANDLER_STRINGS.INFO.DOWNLOAD_CANCELLED_ENV);
                oneDSLoggerWrapper.getLogger().traceInfo(
                    uriHandlerTelemetryEventNames.URI_HANDLER_OPEN_POWER_PAGES_FAILED,
                    { ...telemetryData, reason: 'user_cancelled_env_switch' }
                );
                throw new CreateFlowCancellationError(URI_HANDLER_STRINGS.ERRORS.USER_CANCELLED_ENV_SWITCH);
            }
        }
    }

    /**
     * Point PAC at the requested environment and confirm the switch actually took effect.
     *
     * `pac org select` can report success while leaving the active org unchanged, so the
     * result is always verified against `pac org who`.
     */
    private async trySwitchEnvironment(uriParams: ValidatedAuthEnvironmentTarget): Promise<EnvironmentSwitchResult> {
        const selectResult = await this.pacWrapper.orgSelect(uriParams.orgUrl);
        if (selectResult && selectResult.Status !== "Success") {
            // PAC explains exactly why the switch failed (wrong cloud, org not found, no
            // matching auth profile). Without this the user only ever sees the generic
            // guidance and cannot tell which of those applies.
            return {
                success: false,
                recoverable: true,
                errorMessage: describePacFailure(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED, selectResult.Errors)
            };
        }

        const verifyAuthInfo = await this.pacWrapper.activeOrg();
        if (verifyAuthInfo?.Status !== "Success") {
            return {
                success: false,
                recoverable: true,
                errorMessage: describePacFailure(URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_FAILED, verifyAuthInfo?.Errors)
            };
        }

        const connectedEnvironmentId = verifyAuthInfo.Results?.EnvironmentId;
        if (!isSameEnvironment(connectedEnvironmentId, uriParams.environmentId)) {
            // The org URL resolved, but to a different environment than the link claims. The two
            // link parameters disagree, so a new sign-in cannot reconcile them - report the
            // inconsistency instead of sending the user through a pointless auth prompt.
            return {
                success: false,
                recoverable: false,
                errorMessage: URI_HANDLER_STRINGS.ERRORS.ENV_SWITCH_MISMATCH
                    .replace('{0}', connectedEnvironmentId ?? 'unknown')
                    .replace('{1}', uriParams.environmentId)
            };
        }

        return { success: true, environmentId: connectedEnvironmentId };
    }

    /**
     * Reuse an existing auth profile that already points at the target organization.
     *
     * `pac org select` only resolves organizations visible to the *active* profile, so the switch
     * fails whenever the target belongs to a different account — even when the user already added
     * that account. Selecting the stored profile fixes this without a browser sign-in.
     *
     * @returns The retried switch outcome, or `undefined` when no stored profile matches and the
     * caller should fall back to creating one.
     */
    private async trySwitchWithExistingAuthProfile(
        uriParams: ValidatedAuthEnvironmentTarget,
        telemetryData: Record<string, string>
    ): Promise<EnvironmentSwitchResult | undefined> {
        let authList;
        try {
            authList = await this.pacWrapper.authList();
        } catch {
            // Reusing a profile is only an optimization: fall back to creating one.
            return undefined;
        }

        if (authList?.Status !== "Success" || !Array.isArray(authList.Results)) {
            return undefined;
        }

        const candidate = authList.Results.find(profile => this.matchesTarget(profile, uriParams));
        if (!candidate) {
            return undefined;
        }

        const selectResult = await this.pacWrapper.authSelectByIndex(candidate.Index);
        if (selectResult && selectResult.Status !== "Success") {
            return undefined;
        }

        oneDSLoggerWrapper.getLogger().traceInfo(
            uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_PROFILE_SELECTED,
            { ...telemetryData, requestedEnvId: uriParams.environmentId }
        );

        return this.trySwitchEnvironment(uriParams);
    }

    /**
     * Whether a stored auth profile is already pointed at the requested organization.
     *
     * The environment ID and the organization URL are both checked because a link may carry
     * either one in a form PAC recorded differently.
     */
    private matchesTarget(profile: AuthProfileListing, uriParams: ValidatedAuthEnvironmentTarget): boolean {
        if (profile.IsActive) {
            // The active profile is the one that just failed to select the target.
            return false;
        }

        const organization = profile.ActiveOrganization;
        if (!organization) {
            return false;
        }

        return isSameEnvironment(organization.Item3, uriParams.environmentId)
            || isSameOrgUrl(organization.Item2, uriParams.orgUrl);
    }

    /**
     * Offer to sign in to the target organization, then retry the environment switch.
     *
     * The initial switch fails whenever no existing auth profile can see the target org, which
     * the user cannot resolve from inside the flow. Creating a profile for the org is the one
     * recovery available, so it is offered here instead of asking the user to run PAC by hand.
     */
    private async retrySwitchWithNewAuthProfile(
        uriParams: ValidatedAuthEnvironmentTarget,
        telemetryData: Record<string, string>,
        progress: vscode.Progress<{ message?: string; increment?: number }>,
        previousErrorMessage: string
    ): Promise<EnvironmentSwitchResult> {
        oneDSLoggerWrapper.getLogger().traceInfo(
            uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_AUTH_REQUIRED,
            { ...telemetryData, requestedEnvId: uriParams.environmentId }
        );

        const signIn = await vscode.window.showWarningMessage(
            URI_HANDLER_STRINGS.PROMPTS.ENV_SWITCH_AUTH_REQUIRED,
            { modal: true },
            URI_HANDLER_STRINGS.BUTTONS.YES,
            URI_HANDLER_STRINGS.BUTTONS.NO
        );

        if (signIn !== URI_HANDLER_STRINGS.BUTTONS.YES) {
            // Report the original PAC diagnosis: it is the only thing that explains why the
            // switch failed, and the user declined the one recovery we can offer.
            return { success: false, recoverable: false, errorMessage: previousErrorMessage };
        }

        progress.report({
            message: URI_HANDLER_STRINGS.PROGRESS.AUTHENTICATING,
            increment: 10
        });

        const authResult = await this.pacWrapper.authCreateNewAuthProfileForOrg(uriParams.orgUrl);
        if (authResult && authResult.Status !== "Success") {
            return {
                success: false,
                recoverable: false,
                errorMessage: describePacFailure(URI_HANDLER_STRINGS.ERRORS.AUTH_FAILED, authResult.Errors)
            };
        }

        oneDSLoggerWrapper.getLogger().traceInfo(
            uriHandlerTelemetryEventNames.URI_HANDLER_ENV_SWITCH_AUTH_COMPLETED,
            { ...telemetryData, requestedEnvId: uriParams.environmentId }
        );

        return this.trySwitchEnvironment(uriParams);
    }

    /**
     * Validate the authentication and environment target before invoking PAC CLI.
     */
    private validateTarget(uriParams: AuthEnvironmentTarget): ValidatedAuthEnvironmentTarget {
        if (!uriParams.environmentId) {
            throw new Error(URI_HANDLER_STRINGS.ERRORS.ENVIRONMENT_ID_REQUIRED);
        }

        if (!uriParams.orgUrl) {
            throw new Error(URI_HANDLER_STRINGS.ERRORS.ORG_URL_REQUIRED);
        }

        return {
            environmentId: uriParams.environmentId,
            orgUrl: uriParams.orgUrl
        };
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
