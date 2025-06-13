/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface ECSAPIFeatureFlagFilters {
    /**
     * Application AppName
     * @example powerpages-microsoft-com
     */
    AppName: string;

    /** The AAD user object ID or MSA. */
    UserID: string;

    /** The AAD tenant object ID. */
    TenantID: string;

    /**	Unique Dataverse Environment ID */
    EnvID: string;

    /**
     * Deployment region
     * @example test, preview, prod
     */
    Region: string;

    /**
     * Deployment cluster location
     * @example NDE, WCDE, NCH, WCH, CAE, NAE, SBR, SCUS, ECA, CCA, SIN, CIN, CFR, SFR
     */
    Location: string;

    // TBD - more API call filters to be added later
}
