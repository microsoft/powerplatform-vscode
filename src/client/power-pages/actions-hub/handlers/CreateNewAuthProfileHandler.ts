/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SUCCESS } from "../../../../common/constants";
import { authenticateUserInVSCode } from "../../../../common/services/AuthenticationProvider";
import { createAuthProfileExp } from "../../../../common/utilities/PacAuthUtil";
import PacContext from "../../../pac/PacContext";
import { PacWrapper } from "../../../pac/PacWrapper";
import { extractAuthInfo, extractOrgInfo } from "../../commonUtility";
import { Constants } from "../Constants";
import { traceError, traceInfo } from "../TelemetryHelper";

export const createNewAuthProfile = async (pacWrapper: PacWrapper): Promise<void> => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_CREATE_AUTH_PROFILE_CALLED, { methodName: createNewAuthProfile.name });
    try {
        const orgUrl = PacContext.OrgInfo?.OrgUrl ?? '';

        // if orgUrl is present then directly authenticate in VS Code
        if (orgUrl) {
            await authenticateUserInVSCode();
            return;
        }

        // PacContext may not be populated yet - check PAC CLI directly for active auth
        if (await syncAuthFromPacCli(pacWrapper)) {
            await authenticateUserInVSCode();
            return;
        }

        const pacAuthCreateOutput = await createAuthProfileExp(pacWrapper);
        if (pacAuthCreateOutput && pacAuthCreateOutput.Status === SUCCESS) {
            const results = pacAuthCreateOutput.Results;
            if (Array.isArray(results) && results.length > 0) {
                const orgUrl = results[0].ActiveOrganization?.Item2;
                if (orgUrl) {
                    await authenticateUserInVSCode();
                } else {
                    traceError(
                        createNewAuthProfile.name,
                        new Error(Constants.Strings.ORGANIZATION_URL_MISSING),
                        { methodName: createNewAuthProfile.name }
                    );
                }
            } else {
                traceError(
                    createNewAuthProfile.name,
                    new Error(Constants.Strings.EMPTY_RESULTS_ARRAY),
                    { methodName: createNewAuthProfile.name }
                );
            }
        } else {
            traceError(
                createNewAuthProfile.name,
                new Error(Constants.Strings.PAC_AUTH_OUTPUT_FAILURE),
                { methodName: createNewAuthProfile.name }
            );
        }
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_CREATE_AUTH_PROFILE_FAILED,
            error as Error,
            { methodName: createNewAuthProfile.name }
        );
    }
};

/**
 * Checks PAC CLI for an active auth profile and syncs it to PacContext.
 * This handles the case where the user has already authenticated via PAC CLI
 * but PacContext has not yet been populated (e.g., file watcher hasn't fired).
 * @returns true if a valid PAC CLI auth profile was found and synced, false otherwise.
 */
export const syncAuthFromPacCli = async (pacWrapper: PacWrapper): Promise<boolean> => {
    try {
        const pacActiveAuth = await pacWrapper.activeAuth();
        if (pacActiveAuth && pacActiveAuth.Status === SUCCESS) {
            const authInfo = extractAuthInfo(pacActiveAuth.Results);
            if (authInfo.OrganizationFriendlyName) {
                let orgInfo = null;
                try {
                    const pacActiveOrg = await pacWrapper.activeOrg();
                    if (pacActiveOrg && pacActiveOrg.Status === SUCCESS) {
                        orgInfo = extractOrgInfo(pacActiveOrg.Results);
                    }
                } catch {
                    // Org info fetch failed, continue with auth info only
                }
                PacContext.setContext(authInfo, orgInfo);
                traceInfo(Constants.EventNames.ACTIONS_HUB_AUTH_SYNCED_FROM_PAC_CLI, { methodName: syncAuthFromPacCli.name });
                return true;
            }
        }
    } catch {
        // PAC CLI auth not available, continue with auth profile creation flow
    }
    return false;
};
