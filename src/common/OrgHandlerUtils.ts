/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ExtensionContext } from 'vscode';
import { ActiveOrgOutput } from '../client/pac/PacTypes';
import { PacWrapper } from '../client/pac/PacWrapper';
import { OrgDetails } from './chat-participants/powerpages/PowerPagesChatParticipantTypes';
import { PAC_SUCCESS } from './copilot/constants';
import { createAuthProfileExp } from './Utils';

export const ORG_DETAILS_KEY = 'orgDetails';

export function handleOrgChangeSuccess(
    orgDetails: ActiveOrgOutput,
    extensionContext: ExtensionContext
): { orgID: string, orgUrl: string } {
    const orgID = orgDetails.OrgId;
    const orgUrl = orgDetails.OrgUrl;

    extensionContext.globalState.update(ORG_DETAILS_KEY, { orgID, orgUrl });

    //TODO: Handle AIB GEOs

    return { orgID, orgUrl };
}

export async function initializeOrgDetails(
    isOrgDetailsInitialized: boolean,
    extensionContext: ExtensionContext,
    pacWrapper?: PacWrapper
): Promise<{ orgID?: string, orgUrl?: string }> {
    if (isOrgDetailsInitialized) {
        return {};
    }

    const orgDetails: OrgDetails | undefined = extensionContext.globalState.get(ORG_DETAILS_KEY);
    let orgID: string | undefined;
    let orgUrl: string | undefined;

    if (orgDetails && orgDetails.orgID && orgDetails.orgUrl) {
        orgID = orgDetails.orgID;
        orgUrl = orgDetails.orgUrl;
    } else {
        if (pacWrapper) {
            const pacActiveOrg = await pacWrapper.activeOrg();
            if (pacActiveOrg && pacActiveOrg.Status === PAC_SUCCESS) {
                const orgDetails = handleOrgChangeSuccess(pacActiveOrg.Results, extensionContext);
                orgID = orgDetails.orgID;
                orgUrl = orgDetails.orgUrl;
            } else {
                await createAuthProfileExp(pacWrapper);
            }
        }
    }

    return { orgID, orgUrl };
}
