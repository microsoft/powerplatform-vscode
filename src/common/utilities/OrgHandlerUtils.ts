/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ActiveOrgOutput } from '../../client/pac/PacTypes';
import { PacWrapper } from '../../client/pac/PacWrapper';
import { IOrgDetails } from '../chat-participants/powerpages/PowerPagesChatParticipantTypes';
import { SUCCESS } from '../constants';
import { ERROR_CONSTANTS } from '../ErrorConstants';
import { createAuthProfileExp } from './PacAuthUtil';

export const ORG_DETAILS_KEY = 'orgDetails';

export function handleOrgChangeSuccess(
    orgDetails: ActiveOrgOutput,
): IOrgDetails {
    const { OrgId: orgID, OrgUrl: orgUrl, EnvironmentId: environmentID } = orgDetails;

    return { orgID, orgUrl, environmentID };
}

async function fetchOrgDetailsFromPac(pacWrapper: PacWrapper): Promise<IOrgDetails> {
    const pacActiveOrg = await pacWrapper.activeOrg();
    if (pacActiveOrg && pacActiveOrg.Status === SUCCESS) {
        return handleOrgChangeSuccess(pacActiveOrg.Results);
    }
    throw new Error(ERROR_CONSTANTS.PAC_AUTH_FAILED);
}

export async function initializeOrgDetails(
    isOrgDetailsInitialized: boolean,
    pacWrapper?: PacWrapper
): Promise<IOrgDetails> {
    const orgDetails: IOrgDetails = { orgID: '', orgUrl: '', environmentID: '' };

    if (isOrgDetailsInitialized) {
        return orgDetails;
    }

    if (pacWrapper) {
        try {
            const fetchedOrgDetails = await fetchOrgDetailsFromPac(pacWrapper);
            orgDetails.orgID = fetchedOrgDetails.orgID;
            orgDetails.orgUrl = fetchedOrgDetails.orgUrl;
            orgDetails.environmentID = fetchedOrgDetails.environmentID;
        } catch (error) {
            await createAuthProfileExp(pacWrapper);
            const fetchedOrgDetails = await fetchOrgDetailsFromPac(pacWrapper);
            orgDetails.orgID = fetchedOrgDetails.orgID;
            orgDetails.orgUrl = fetchedOrgDetails.orgUrl;
            orgDetails.environmentID = fetchedOrgDetails.environmentID;
        }
    }

    return orgDetails;
}
