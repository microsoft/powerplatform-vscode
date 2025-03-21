/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import PacContext from "../../pac/PacContext";
import CurrentSiteContext from "./CurrentSiteContext";


export const getBaseEventInfo = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventInfo = {} as any;

    if (PacContext.OrgInfo?.OrgId) {
        eventInfo.orgId = PacContext.OrgInfo?.OrgId
    }

    if (PacContext.OrgInfo?.OrgUrl) {
        eventInfo.orgUrl = PacContext.OrgInfo?.OrgUrl
    }

    if (CurrentSiteContext.currentSiteId) {
        eventInfo.siteId = CurrentSiteContext.currentSiteId;
    }

    return eventInfo;
}
