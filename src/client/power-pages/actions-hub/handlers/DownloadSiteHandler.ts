/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import path from "path";
import { PacTerminal } from "../../../lib/PacTerminal";
import { Constants } from "../Constants";
import CurrentSiteContext from "../CurrentSiteContext";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { traceError, traceInfo } from "../TelemetryHelper";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";

const getDownloadFolderOptions = () => {
    const options = [
        {
            label: Constants.Strings.BROWSE,
            iconPath: new vscode.ThemeIcon("folder")
        }
    ] as { label: string, iconPath: vscode.ThemeIcon | undefined }[];

    if (CurrentSiteContext.currentSiteFolderPath) {
        options.push({
            label: path.dirname(CurrentSiteContext.currentSiteFolderPath),
            iconPath: undefined
        });
    }

    return options;
}

const getDownloadPath = async () => {
    let downloadPath = "";
    const config = vscode.workspace.getConfiguration(Constants.Strings.CONFIGURATION_NAME);
    const hasConfiguredDownloadPath = config.has(Constants.Strings.DOWNLOAD_SETTING_NAME);

    if (hasConfiguredDownloadPath) {
        const configuredDownloadPath = config.get<string>(Constants.Strings.DOWNLOAD_SETTING_NAME) || "";
        if (fs.existsSync(configuredDownloadPath)) {
            return configuredDownloadPath;
        }
    }

    const option = await vscode.window.showQuickPick(getDownloadFolderOptions(), {
        canPickMany: false,
        placeHolder: Constants.Strings.SELECT_DOWNLOAD_FOLDER
    });

    if (option?.label === Constants.Strings.BROWSE) {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: Constants.Strings.SELECT_FOLDER,
            title: Constants.Strings.SELECT_DOWNLOAD_FOLDER
        });

        if (folderUri && folderUri.length > 0) {
            downloadPath = folderUri[0].fsPath;
        }
    } else {
        downloadPath = option?.label || "";
    }
    return downloadPath;
}

const executeCodeSiteDownloadCommand = (siteInfo: IWebsiteInfo, downloadPath: string) => {
    const downloadCommandParts = ["pac", "pages", "download-code-site"];
    downloadCommandParts.push("--overwrite");
    downloadCommandParts.push(`--path "${downloadPath}"`);
    downloadCommandParts.push(`--webSiteId ${siteInfo.websiteId}`);

    const downloadCommand = downloadCommandParts.join(" ");

    traceInfo(
        Constants.EventNames.ACTIONS_HUB_DOWNLOAD_CODE_SITE_PAC_TRIGGERED,
        {
            methodName: executeCodeSiteDownloadCommand.name,
            siteId: siteInfo.websiteId
        }
    );
    PacTerminal.getTerminal().sendText(downloadCommand);
}

const executeSiteDownloadCommand = (siteInfo: IWebsiteInfo, downloadPath: string) => {
    const modelVersion = siteInfo.dataModelVersion;
    const downloadCommandParts = ["pac", "pages", "download"];
    downloadCommandParts.push("--overwrite");
    downloadCommandParts.push(`--path "${downloadPath}"`);
    downloadCommandParts.push(`--webSiteId ${siteInfo.websiteId}`);
    downloadCommandParts.push(`--modelVersion "${modelVersion}"`);

    const downloadCommand = downloadCommandParts.join(" ");

    traceInfo(
        Constants.EventNames.ACTIONS_HUB_DOWNLOAD_SITE_PAC_TRIGGERED,
        {
            methodName: executeSiteDownloadCommand.name,
            siteId: siteInfo.websiteId,
            dataModelVersion: modelVersion
        }
    );
    PacTerminal.getTerminal().sendText(downloadCommand);
}

export const downloadSite = async (siteTreeItem: SiteTreeItem) => {
    traceInfo(
        Constants.EventNames.ACTIONS_HUB_DOWNLOAD_SITE_CALLED,
        {
            methodName: downloadSite.name,
            siteId: siteTreeItem.siteInfo.websiteId,
            dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
        }
    );

    try {
        let downloadPath = "";
        const { siteInfo } = siteTreeItem;

        if (siteInfo && siteInfo.isCurrent && CurrentSiteContext.currentSiteFolderPath) {
            downloadPath = path.dirname(CurrentSiteContext.currentSiteFolderPath);
        } else {
            downloadPath = await getDownloadPath();
        }

        if (!downloadPath) {
            return;
        }

        if (siteInfo.isCodeSite) {
            executeCodeSiteDownloadCommand(siteInfo, downloadPath);
        } else {
            executeSiteDownloadCommand(siteInfo, downloadPath);
        }
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_DOWNLOAD_SITE_FAILED,
            error as Error,
            {
                methodName: downloadSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );
    }
}
