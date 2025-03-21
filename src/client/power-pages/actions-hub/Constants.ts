/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

export const Constants = {
    ContextValues: {
        ENVIRONMENT_GROUP: "environmentGroup",
        ACTIVE_SITES_GROUP: "activeSitesGroup",
        INACTIVE_SITES_GROUP: "inactiveSitesGroup",
        CURRENT_ACTIVE_SITE: "currentActiveSite",
        NON_CURRENT_ACTIVE_SITE: "nonCurrentActiveSite",
        INACTIVE_SITE: "inactiveSite",
        OTHER_SITE: "otherSite",
        OTHER_SITES_GROUP: "otherSitesGroup",
        NO_SITES: "noSites",
    },
    Icons: {
        SITE: new vscode.ThemeIcon('globe'),
        SITE_GROUP: new vscode.ThemeIcon('folder'),
        OTHER_SITES: new vscode.ThemeIcon('archive')
    },
    Strings: {
        OTHER_SITES: vscode.l10n.t("Other Sites"),
        ACTIVE_SITES: vscode.l10n.t("Active Sites"),
        INACTIVE_SITES: vscode.l10n.t("Inactive Sites"),
        NO_SITES_FOUND: vscode.l10n.t("No sites found"),
        NO_ENVIRONMENTS_FOUND: vscode.l10n.t("No environments found"),
        SELECT_ENVIRONMENT: vscode.l10n.t("Select an environment"),
        COPY_TO_CLIPBOARD: vscode.l10n.t("Copy to clipboard"),
        SESSION_DETAILS: vscode.l10n.t("Session Details"),
        CHANGING_ENVIRONMENT: vscode.l10n.t("Changing environment..."),
        CURRENT: vscode.l10n.t("Current"),
        SITE_MANAGEMENT_URL_NOT_FOUND: vscode.l10n.t("Site management URL not found for the selected site. Please try again after refreshing the environment."),
        SITE_UPLOAD_CONFIRMATION: vscode.l10n.t(`Be careful when you're updating public sites. The changes you make are visible to anyone immediately. Do you want to continue?`),
        YES: vscode.l10n.t("Yes"),
        CURRENT_SITE_PATH_NOT_FOUND: vscode.l10n.t("Current site path not found."),
        SITE_DETAILS: vscode.l10n.t("Site Details"),
        BROWSE: vscode.l10n.t("Browse..."),
        SELECT_DOWNLOAD_FOLDER: vscode.l10n.t("Select the folder that will contain your project root for your site"),
        SELECT_FOLDER: vscode.l10n.t("Select Folder"),
        ORGANIZATION_URL_MISSING: "Organization URL is missing in the results.",
        EMPTY_RESULTS_ARRAY: "Results array is empty or not an array.",
        PAC_AUTH_OUTPUT_FAILURE: "pacAuthCreateOutput is missing or unsuccessful."
    },
    EventNames: {
        ACTIONS_HUB_ENABLED: "ActionsHubEnabled",
        ACTIONS_HUB_INITIALIZED: "ActionsHubInitialized",
        ACTIONS_HUB_INITIALIZATION_FAILED: "ActionsHubInitializationFailed",
        ACTIONS_HUB_REFRESH_FAILED: "ActionsHubRefreshFailed",
        ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED: "ActionsHubShowEnvironmentDetailsFailed",
        SITE_MANAGEMENT_URL_NOT_FOUND: "SiteManagementUrlNotFound",
        ACTIONS_HUB_UPLOAD_SITE: "ActionsHubUploadSite",
        ACTIONS_HUB_UPLOAD_SITE_CANCELLED: "ActionsHubUploadSiteCancelled",
        OTHER_SITES_YAML_PARSE_FAILED: "OtherSitesYamlParseFailed",
        OTHER_SITES_FILESYSTEM_ERROR: "OtherSitesFilesystemError",
        ACTIONS_HUB_UPLOAD_OTHER_SITE: "ActionsHubUploadOtherSite",
        ACTIONS_HUB_UPLOAD_SITE_FAILED: "ActionsHubUploadSiteFailed",
        ACTIONS_HUB_REFRESH: "ActionsHubRefresh",
        ACTIONS_HUB_LOAD_WEBSITES_FAILED: "ActionsHubLoadWebsitesFailed",
        ACTIONS_HUB_FETCH_WEBSITES_FAILED: "ActionsHubFetchWebsitesFailed",
        ACTIONS_HUB_TREE_GET_CHILDREN_CALLED: "ActionsHubTreeGetChildrenCalled",
        ACTIONS_HUB_TREE_GET_CHILDREN_FAILED: "ActionsHubTreeGetChildrenFailed",
    },
    FeatureNames: {
        REFRESH_ENVIRONMENT: "RefreshEnvironment"
    },
    StudioEndpoints: {
        TEST: "https://make.test.powerpages.microsoft.com",
        PREPROD: "https://make.preprod.powerpages.microsoft.com",
        PROD: "https://make.powerpages.microsoft.com",
        DOD: "https://make.powerpages.microsoft.appsplatform.us",
        GCC: "https://make.gov.powerpages.microsoft.us",
        HIGH: "https://make.high.powerpages.microsoft.us",
        MOONCAKE: "https://make.powerpages.microsoft.cn"
    },
    AppNames: {
        POWER_PAGES_MANAGEMENT: 'mspp_powerpagemanagement',
        PORTAL_MANAGEMENT: 'dynamics365portals'
    },
    EntityNames: {
        MSPP_WEBSITE: 'mspp_website',
        ADX_WEBSITE: 'adx_website'
    }
};
