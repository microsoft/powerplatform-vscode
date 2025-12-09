/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { SUCCESS } from "../../../../common/constants";
import { authenticateUserInVSCode } from "../../../../common/services/AuthenticationProvider";
import { createAuthProfileExp } from "../../../../common/utilities/PacAuthUtil";
import PacContext from "../../../pac/PacContext";
import { PacWrapper } from "../../../pac/PacWrapper";
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
