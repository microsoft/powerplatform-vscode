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

export const ORG_DETAILS_KEY = 'orgDetails';

export function handleOrgChangeSuccess(
    orgDetails: ActiveOrgOutput,
    extensionContext: ExtensionContext
): IOrgDetails {
    const orgID = orgDetails.OrgId;
    const orgUrl = orgDetails.OrgUrl;
    const environmentID = orgDetails.EnvironmentId;

    extensionContext.globalState.update(ORG_DETAILS_KEY, { orgID, orgUrl, environmentID });

    return { orgID, orgUrl, environmentID };
}

export async function initializeOrgDetails(
    isOrgDetailsInitialized: boolean,
    extensionContext: ExtensionContext,
    pacWrapper?: PacWrapper
): Promise<{ orgID: string, orgUrl: string, environmentID: string }> {
    if (isOrgDetailsInitialized) {
        return { orgID: '', orgUrl: '', environmentID: '' };
    }

    const orgDetails: IOrgDetails | undefined = extensionContext.globalState.get(ORG_DETAILS_KEY);
    let orgID = '';
    let orgUrl = '';
    let environmentID = '';

    if (orgDetails && orgDetails.orgID && orgDetails.orgUrl && orgDetails.environmentID) {
        orgID = orgDetails.orgID;
        orgUrl = orgDetails.orgUrl;
        environmentID = orgDetails.environmentID;
    } else {
        if (pacWrapper) {
            const pacActiveOrg = await pacWrapper.activeOrg();
            if (pacActiveOrg && pacActiveOrg.Status === SUCCESS) {
                const orgDetails = handleOrgChangeSuccess(pacActiveOrg.Results, extensionContext);
                orgID = orgDetails.orgID;
                orgUrl = orgDetails.orgUrl;
                environmentID = orgDetails.environmentID;
            } else {
                await createAuthProfileExp(pacWrapper);
            }
        }
    }

    return { orgID, orgUrl, environmentID };
}
