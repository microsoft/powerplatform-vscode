/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

export const INTELLIGENCE_SCOPE_DEFAULT = "https://text.pai.dynamics.com/.default";
export const PROVIDER_ID = "microsoft";
export const SCOPE_OPTION_OFFLINE_ACCESS = "offline_access";

// Microsoft Graph Client constants
export const SCOPE_OPTION_CONTACTS_READ = "Contacts.Read";
export const SCOPE_OPTION_USERS_READ_BASIC_ALL = "User.ReadBasic.All";
export const SCOPE_OPTION_DEFAULT = "/.default";

export const BAP_API_VERSION = '2021-04-01';
export const BAP_SERVICE_SCOPE_DEFAULT = "https://api.bap.microsoft.com/.default";//"https://management.core.windows.net/.default";
export const BAP_SERVICE_ENDPOINT = `{rootURL}/providers/Microsoft.BusinessAppPlatform/`;
export const BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL = `scopes/admin/environments/{environmentID}?$expand=properties/copilotPolicies&api-version={apiVersion}`;

export enum BAPServiceStamp {
    TEST = "test",
    PREPROD = "preprod",
    PROD = "prod",
    GCC = "gcc",
    HIGH = "high",
    MOONCAKE = "mooncake",
    DOD = "dod",
}
