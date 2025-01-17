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
        ACTIVE_SITE: "activeSite",
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
        NO_SITES_FOUND: vscode.l10n.t("No sites found")
    },
    EventNames: {
        ACTIONS_HUB_INITIALIZED: "actionsHubInitialized"
    }
};
