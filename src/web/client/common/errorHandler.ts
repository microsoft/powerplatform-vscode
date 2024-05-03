/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import WebExtensionContext from "../WebExtensionContext";
import { schemaKey } from "../schema/constants";
import { telemetryEventNames } from "../telemetry/constants";
import { PORTALS_FOLDER_NAME_DEFAULT, queryParameters } from "./constants";
import { isMultifileEnabled } from "../utilities/commonUtil";

export function showErrorDialog(errorString: string, detailMessage?: string) {
    const options = { detail: detailMessage, modal: true };
    vscode.window.showErrorMessage(errorString, options);
}

export function removeEncodingFromParameters(
    queryParamsMap: Map<string, string>
) {
    //NOTE: From extensibility perspective split attributes and attributes may contain encoded string which must be decoded before use.
    const schemaFileName = decodeURI(
        queryParamsMap.get(schemaKey.SCHEMA_VERSION) as string
    );
    queryParamsMap.set(schemaKey.SCHEMA_VERSION, schemaFileName);
    const websiteName = decodeURI(
        queryParamsMap.get(queryParameters.WEBSITE_NAME) as string
    );
    const portalFolderName = websiteName
        ? websiteName
        : PORTALS_FOLDER_NAME_DEFAULT;
    queryParamsMap.set(queryParameters.WEBSITE_NAME, portalFolderName);
}

export function checkMandatoryParameters(
    appName: string,
    queryParamsMap: Map<string, string>
): boolean {
    return (
        checkMandatoryPathParameters(appName) &&
        checkMandatoryQueryParameters(appName, queryParamsMap) &&
        checkMandatoryMultifileParameters(appName, queryParamsMap)
    );
}

export function checkMandatoryPathParameters(
    appName: string,
): boolean {
    switch (
    appName // remove switch cases and use polymorphism
    ) {
        case "portal":
            return true;
        default:
            showErrorDialog(
                vscode.l10n.t("There was a problem opening the workspace"),
                vscode.l10n.t("Unable to find that app")
            );
            return false;
    }
}

export function checkMandatoryQueryParameters(
    appName: string,
    queryParamsMap: Map<string, string>
): boolean {
    switch (
    appName // remove switch cases and use polymorphism
    ) {
        case "portal": {
            const orgURL = queryParamsMap?.get(queryParameters.ORG_URL);
            const dataSource = queryParamsMap?.get(queryParameters.DATA_SOURCE);
            const schemaName = queryParamsMap?.get(schemaKey.SCHEMA_VERSION);
            const websiteId = queryParamsMap?.get(queryParameters.WEBSITE_ID);
            if (orgURL && dataSource && schemaName && websiteId) {
                return true;
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_MANDATORY_QUERY_PARAMETERS_MISSING,
                    checkMandatoryQueryParameters.name,
                    `${orgURL ? `orgURL, ` : ``}dataSource:${dataSource}, schemaName:${schemaName} ,websiteId:${websiteId}`
                );
                showErrorDialog(
                    vscode.l10n.t("There was a problem opening the workspace"),
                    vscode.l10n.t(
                        "Check the URL and verify the parameters are correct"
                    )
                );
                return false;
            }
        }
        default:
            showErrorDialog(
                vscode.l10n.t("There was a problem opening the workspace"),
                vscode.l10n.t("Unable to find that app")
            );
            return false;
    }
}

export function checkMandatoryMultifileParameters(
    appName: string,
    queryParametersMap: Map<string, string>
): boolean {
    switch (
    appName // remove switch cases and use polymorphism
    ) {
        case "portal": {
            const enableMultifile = queryParametersMap?.get(queryParameters.ENABLE_MULTIFILE);
            const isEnableMultifile = (String(enableMultifile).toLowerCase() === 'true');
            const websiteId = queryParametersMap.get(queryParameters.WEBSITE_ID);
            if ((isMultifileEnabled() && isEnableMultifile && websiteId)
                || (isMultifileEnabled() && !isEnableMultifile)
                || !isMultifileEnabled()) {
                return true;
            } else {
                WebExtensionContext.telemetry.sendErrorTelemetry(
                    telemetryEventNames.WEB_EXTENSION_MULTI_FILE_MANDATORY_PARAMETERS_MISSING,
                    checkMandatoryMultifileParameters.name,
                    `enableMultifile:${enableMultifile}, websiteId:${websiteId}`
                );
                showErrorDialog(
                    vscode.l10n.t("There was a problem opening the workspace"),
                    vscode.l10n.t(
                        "Check the URL and verify the parameters are correct"
                    )
                );
                return false;
            }
        }
        default:
            showErrorDialog(
                vscode.l10n.t("There was a problem opening the workspace"),
                vscode.l10n.t("Unable to find that app")
            );
            return false;
    }
}
