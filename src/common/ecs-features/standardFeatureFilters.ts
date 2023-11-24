/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export interface StandardFeatureFilters {
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

    /**	Unique ID for the user's visit (session) */
    SessionID?: string;

    /**
     * The Azure Location where the hosting service handled the request for the page.
     * @example WUS2, NEU
     */
    Location?: string;

    /**
     * The user's current language
     * @example en-US
     */
    Locale?: string;

    /**
     * The user agent for the user's browser
     * @example 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4814.0 Safari/537.36 Edg/99.0.1135.5'
     */
    UserAgent?: string;

    /**
     * The branch name for the current version
     * @example master, 2203.4
     */
    BuildBranch?: string;

    /**
     * The build number the current version
     * @example 0.0.20220205.11-master-ci
     */
    BuildNumber?: string;

    /**
     * The name of the application
     * @example make-powerapps-com
     */
    AppName?: string;
}
