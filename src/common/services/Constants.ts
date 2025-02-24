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

// BAP API constants
export const BAP_API_VERSION = '2021-04-01';
export const BAP_SERVICE_SCOPE_DEFAULT = "https://api.bap.microsoft.com/.default";
export const BAP_SERVICE_ENDPOINT = `{rootURL}/providers/Microsoft.BusinessAppPlatform/`;
export const BAP_SERVICE_COPILOT_CROSS_GEO_FLAG_RELATIVE_URL = `scopes/admin/environments/{environmentID}?$expand=properties/copilotPolicies&api-version={apiVersion}`;
export const BAP_ENVIRONMENT_LIST_URL = `scopes/admin/environments?api-version={apiVersion}&select=name,properties.displayName,properties.linkedEnvironmentMetadata`;

// PPAPI constants
export const PPAPI_WEBSITES_API_VERSION = '2022-03-01-preview';
export const PPAPI_WEBSITES_SERVICE_SCOPE_DEFAULT = "https://api.powerplatform.com/.default";
export const PPAPI_PREPROD_WEBSITES_SERVICE_SCOPE_DEFAULT = "https://api.preprod.powerplatform.com/.default";
export const PPAPI_TEST_WEBSITES_SERVICE_SCOPE_DEFAULT = "https://api.test.powerplatform.com/.default";
export const PPAPI_MOONCAKE_WEBSITES_SERVICE_SCOPE_DEFAULT = "https://api.powerplatform.cn/.default";
export const PPAPI_GCC_HIGH_DOD_WEBSITES_SERVICE_SCOPE_DEFAULT = "https://api.powerplatform.us/.default";
export const PPAPI_WEBSITES_ENDPOINT = `{rootURL}/powerpages/environments/{environmentId}/websites`;

export enum ServiceEndpointCategory {
    NONE = "",
    TEST = "test",
    PREPROD = "preprod",
    PROD = "prod",
    GCC = "gcc",
    HIGH = "high",
    MOONCAKE = "mooncake",
    DOD = "dod",
}

export enum WebsiteApplicationType {
    Production = "Production",
    Trial = "Trial",
}

export enum WebsiteDataModel {
    Enhanced = "Enhanced",
    Standard = "Standard",
}
