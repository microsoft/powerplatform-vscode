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
        NO_SITES: "noSites"
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
    },
    EventNames: {
        ACTIONS_HUB_INITIALIZED: "actionsHubInitialized",
        ACTIONS_HUB_INITIALIZATION_FAILED: "actionsHubInitializationFailed",
        ACTIONS_HUB_CURRENT_ENV_FETCH_FAILED: "actionsHubCurrentEnvFetchFailed",
        ACTIONS_HUB_REFRESH_FAILED: "actionsHubRefreshFailed",
        ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED: "actionsHubShowEnvironmentDetailsFailed",
        ORGANIZATION_URL_MISSING: "Organization URL is missing in the results.",
        EMPTY_RESULTS_ARRAY: "Results array is empty or not an array.",
        PAC_AUTH_OUTPUT_FAILURE: "pacAuthCreateOutput is missing or unsuccessful."
    },
    StudioEndpoints: {
        TEST: "https://make.test.powerpages.microsoft.com",
        PREPROD: "https://make.preprod.powerpages.microsoft.com",
        PROD: "https://make.powerpages.microsoft.com",
        DOD: "https://make.powerpages.microsoft.appsplatform.us",
        GCC: "https://make.gov.powerpages.microsoft.us",
        HIGH: "https://make.high.powerpages.microsoft.us",
        MOONCAKE: "https://make.powerpages.microsoft.cn"
    }
};

export const ENVIRONMENT_EXPIRED = vscode.l10n.t("Active Environment is expired or deleted. Please select a new environment.")
