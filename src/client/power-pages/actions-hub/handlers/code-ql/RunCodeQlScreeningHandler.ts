/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { CODEQL_EXTENSION_ID, POWERPAGES_SITE_FOLDER } from "../../../../../common/constants";
import { showProgressWithNotification } from "../../../../../common/utilities/Utils";
import { getDefaultCodeQLDatabasePath } from "../../ActionsHubUtils";
import { Constants } from "../../Constants";
import CurrentSiteContext from "../../CurrentSiteContext";
import { getBaseEventInfo, traceError, traceInfo } from "../../TelemetryHelper";
import { SiteTreeItem } from "../../tree-items/SiteTreeItem";
import { CodeQLAction } from "./CodeQLAction";

export const runCodeQLScreening = async (siteTreeItem?: SiteTreeItem) => {
    const startTime = Date.now();
    let siteInfo = null;

    if (siteTreeItem) {
        siteInfo = {
            websiteId: siteTreeItem.siteInfo.websiteId,
            contextValue: siteTreeItem.contextValue,
            isCodeSite: siteTreeItem.siteInfo.isCodeSite,
            dataModelVersion: siteTreeItem.siteInfo.dataModelVersion,
            hasValidPath: !!siteTreeItem.siteInfo.folderPath
        };
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_STARTED, {
        methodName: runCodeQLScreening.name,
        hasSiteTreeItem: !!siteTreeItem,
        siteInfo: siteInfo,
        ...getBaseEventInfo()
    });

    try {
        // Get the current site path
        let sitePath = "";
        if (siteTreeItem && siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            sitePath = siteTreeItem.siteInfo.folderPath || "";
        } else {
            sitePath = CurrentSiteContext.currentSiteFolderPath || "";
        }

        if (!sitePath) {
            await vscode.window.showErrorMessage(Constants.Strings.CODEQL_CURRENT_SITE_PATH_NOT_FOUND);

            traceError(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_FAILED, new Error('Site path not found'), {
                methodName: runCodeQLScreening.name,
                reason: 'site_path_not_found',
                duration: Date.now() - startTime,
                siteInfo: siteInfo,
                ...getBaseEventInfo()
            });

            return;
        }

        // Check if the .powerpages-site folder exists for BYOC sites.
        const sitePathWithFolder = path.join(sitePath, POWERPAGES_SITE_FOLDER);
        const powerPagesSiteFolderExists = fs.existsSync(sitePathWithFolder);

        // Check if CodeQL extension is installed
        const codeQLExtension = vscode.extensions.getExtension(CODEQL_EXTENSION_ID);

        if (!codeQLExtension) {
            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_PROMPTED, {
                methodName: runCodeQLScreening.name,
                extensionId: CODEQL_EXTENSION_ID,
                sitePath: sitePath,
                powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                siteInfo: siteInfo,
                ...getBaseEventInfo()
            });

            // Prompt user to install the CodeQL extension
            const install = await vscode.window.showWarningMessage(
                Constants.Strings.CODEQL_EXTENSION_NOT_INSTALLED,
                Constants.Strings.INSTALL,
                Constants.Strings.CANCEL
            );

            if (install === Constants.Strings.INSTALL) {
                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_ACCEPTED, {
                    methodName: runCodeQLScreening.name,
                    userAction: 'install_extension',
                    extensionId: CODEQL_EXTENSION_ID,
                    sitePath: sitePath,
                    powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                    siteInfo: siteInfo,
                    ...getBaseEventInfo()
                });

                await vscode.commands.executeCommand('workbench.extensions.installExtension', CODEQL_EXTENSION_ID);
                return;
            } else {
                traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_INSTALL_DECLINED, {
                    methodName: runCodeQLScreening.name,
                    userAction: 'cancelled_install',
                    extensionId: CODEQL_EXTENSION_ID,
                    duration: Date.now() - startTime,
                    siteInfo: siteInfo,
                    ...getBaseEventInfo()
                });
                return;
            }
        }

        // Extension is already installed, log this event
        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_EXTENSION_FOUND, {
            methodName: runCodeQLScreening.name,
            extensionId: CODEQL_EXTENSION_ID,
            sitePath: sitePath,
            powerPagesSiteFolderExists: powerPagesSiteFolderExists,
            siteInfo: siteInfo,
            ...getBaseEventInfo()
        });

        // Use default database location (site folder)
        const databaseLocation = getDefaultCodeQLDatabasePath();

        traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_DATABASE_CREATED, {
            methodName: runCodeQLScreening.name,
            sitePath: sitePath,
            databaseLocation: databaseLocation,
            powerPagesSiteFolderExists: powerPagesSiteFolderExists,
            extensionAlreadyInstalled: true,
            siteInfo: siteInfo,
            ...getBaseEventInfo()
        });

        const codeQLAction = new CodeQLAction();

        try {
            const analysisResults = await showProgressWithNotification(
                Constants.Strings.CODEQL_SCREENING_STARTED,
                async () => {
                    // Use a custom method that allows specifying the database location
                    return await codeQLAction.executeCodeQLAnalysisWithCustomPath(sitePath, databaseLocation, powerPagesSiteFolderExists);
                }
            );

            const duration = Date.now() - startTime;
            traceInfo(Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_COMPLETED, {
                methodName: runCodeQLScreening.name,
                sitePath: sitePath,
                databaseLocation: databaseLocation,
                powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                duration: duration,
                issuesFound: analysisResults?.issueCount || 0,
                hasIssues: (analysisResults?.issueCount || 0) > 0,
                siteInfo: siteInfo
            });
        } catch (error) {
            const duration = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : String(error);

            traceError(
                Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_FAILED,
                error as Error,
                {
                    methodName: runCodeQLScreening.name,
                    sitePath: sitePath,
                    databaseLocation: databaseLocation,
                    powerPagesSiteFolderExists: powerPagesSiteFolderExists,
                    duration: duration,
                    errorMessage: errorMessage,
                    siteInfo: siteInfo
                }
            );
            await vscode.window.showErrorMessage(Constants.Strings.CODEQL_SCREENING_FAILED);
        } finally {
            codeQLAction.dispose();
        }

    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        traceError(
            Constants.EventNames.ACTIONS_HUB_CODEQL_SCREENING_FAILED,
            error as Error,
            {
                methodName: runCodeQLScreening.name,
                duration: duration,
                errorMessage: errorMessage,
                siteInfo: siteInfo
            }
        );
        await vscode.window.showErrorMessage(Constants.Strings.CODEQL_SCREENING_FAILED);
    }
};
