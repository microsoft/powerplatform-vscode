/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ExtensionContext } from 'vscode';
import { ActiveOrgOutput } from '../../client/pac/PacTypes';
import { PacWrapper } from '../../client/pac/PacWrapper';
import { IOrgDetails } from '../chat-participants/powerpages/PowerPagesChatParticipantTypes';
import { SUCCESS } from '../constants';
import { createAuthProfileExp } from '../copilot/utils/copilotUtil';
import { ERROR_CONSTANTS } from '../ErrorConstants';

export const ORG_DETAILS_KEY = 'orgDetails';

export function handleOrgChangeSuccess(
    orgDetails: ActiveOrgOutput,
    extensionContext: ExtensionContext
): IOrgDetails {
    const { OrgId: orgID, OrgUrl: orgUrl, EnvironmentId: environmentID } = orgDetails;

    extensionContext.globalState.update(ORG_DETAILS_KEY, { orgID, orgUrl, environmentID });

    return { orgID, orgUrl, environmentID };
}

async function fetchOrgDetailsFromPac(pacWrapper: PacWrapper, extensionContext: ExtensionContext): Promise<IOrgDetails> {
    const pacActiveOrg = await pacWrapper.activeOrg();
    if (pacActiveOrg && pacActiveOrg.Status === SUCCESS) {
        return handleOrgChangeSuccess(pacActiveOrg.Results, extensionContext);
    }
    throw new Error(ERROR_CONSTANTS.PAC_AUTH_FAILED);
}

export async function initializeOrgDetails(
    isOrgDetailsInitialized: boolean,
    extensionContext: ExtensionContext,
    pacWrapper?: PacWrapper
): Promise<IOrgDetails> {
    if (isOrgDetailsInitialized) {
        return { orgID: '', orgUrl: '', environmentID: '' };
    }

    const orgDetails: IOrgDetails | undefined = extensionContext.globalState.get(ORG_DETAILS_KEY);
    if (orgDetails && orgDetails.orgID && orgDetails.orgUrl && orgDetails.environmentID) {
        return orgDetails;
    }

    if (pacWrapper) {
        try {
            return await fetchOrgDetailsFromPac(pacWrapper, extensionContext);
        } catch (error) {
            await createAuthProfileExp(pacWrapper);
            return await fetchOrgDetailsFromPac(pacWrapper, extensionContext);
        }
    }

    return { orgID: '', orgUrl: '', environmentID: '' };
}
