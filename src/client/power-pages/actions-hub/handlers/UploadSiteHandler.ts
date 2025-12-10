/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fs from "fs";
import path from "path";
import * as vscode from "vscode";
import { PacTerminal } from "../../../lib/PacTerminal";
import { Constants } from "../Constants";
import CurrentSiteContext from "../CurrentSiteContext";
import { IWebsiteInfo } from "../models/IWebsiteInfo";
import { SiteVisibility } from "../models/SiteVisibility";
import { traceError, traceInfo } from "../TelemetryHelper";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";
import { IPowerPagesConfig, IPowerPagesConfigData } from "../models/IPowerPagesConfig";
import { UTF8_ENCODING } from "../../../../common/constants";
import PacContext from "../../../pac/PacContext";
import { dataverseAuthentication } from "../../../../common/services/AuthenticationProvider";
import { isEdmEnvironment } from "../../../../common/copilot/dataverseMetadata";

/**
 * Reads and parses the powerpages.config.json file
 * @param configFilePath Path to the configuration file
 * @returns Parsed configuration data
 */
const readPowerPagesConfig = (configFilePath: string): IPowerPagesConfigData => {
    if (!fs.existsSync(configFilePath)) {
        return { hasCompiledPath: false, hasSiteName: false };
    }

    try {
        const configContent = fs.readFileSync(configFilePath, UTF8_ENCODING);
        const config: IPowerPagesConfig = JSON.parse(configContent);

        const hasCompiledPath = Boolean(config?.compiledPath);
        const hasSiteName = Boolean(config?.siteName);

        return { hasCompiledPath, hasSiteName };
    } catch (configError) {
        traceError(Constants.EventNames.POWER_PAGES_CONFIG_PARSE_FAILED, configError as Error, { methodName: readPowerPagesConfig.name });
    }
    return { hasCompiledPath: false, hasSiteName: false };
};

/**
 * Builds the upload code site command for pac pages upload-code-site
 * @param uploadPath Root path for the upload
 * @param siteInfo Site information
 * @param configData Configuration data
 * @returns The complete upload command as a string
 */
const buildUploadCodeSiteCommand = async (
    uploadPath: string,
    siteInfo: IWebsiteInfo,
    configData: IPowerPagesConfigData
): Promise<string> => {
    const commandParts = ["pac", "pages", "upload-code-site"];

    commandParts.push("--rootPath", `"${uploadPath}"`);

    if (!configData.hasCompiledPath) {
        const compiledPath = await getCompiledOutputFolderPath();
        if (!compiledPath) {
            await vscode.window.showErrorMessage(
                vscode.l10n.t(Constants.Strings.UPLOAD_CODE_SITE_COMPILED_OUTPUT_FOLDER_NOT_FOUND)
            );
            return "";
        }
        commandParts.push("--compiledPath", `"${compiledPath}"`);
    }

    if (!configData.hasSiteName) {
        commandParts.push("--siteName", `"${siteInfo.name}"`);
    }

    return commandParts.join(" ");
};

const getCompiledOutputFolderOptions = () => {
    const options = [
        {
            label: Constants.Strings.BROWSE,
            iconPath: new vscode.ThemeIcon("folder")
        }
    ] as { label: string, iconPath: vscode.ThemeIcon | undefined }[];

    return options;
}

const getCompiledOutputFolderPath = async () => {
    let compiledOutputPath = "";

    const option = await vscode.window.showQuickPick(getCompiledOutputFolderOptions(), {
        canPickMany: false,
        placeHolder: Constants.Strings.SELECT_COMPILED_OUTPUT_FOLDER
    });

    if (option?.label === Constants.Strings.BROWSE) {
        const folderUri = await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            openLabel: Constants.Strings.SELECT_FOLDER,
            title: Constants.Strings.SELECT_COMPILED_OUTPUT_FOLDER
        });

        if (folderUri && folderUri.length > 0) {
            compiledOutputPath = folderUri[0].fsPath;
        }
    } else {
        compiledOutputPath = option?.label || "";
    }
    return compiledOutputPath;

}

/**
 * Uploads a Power Pages code site to the environment
 * @param siteInfo Information about the site to upload
 * @param uploadPath Path to the site folder to upload
 */
const uploadCodeSite = async (siteInfo: IWebsiteInfo, uploadPath: string) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_CALLED, {
        methodName: uploadCodeSite.name,
        siteIdToUpload: siteInfo.websiteId
    });

    try {
        const configFilePath = path.join(uploadPath, Constants.Strings.POWER_PAGES_CONFIG_FILE_NAME);
        const configData = readPowerPagesConfig(configFilePath);

        const uploadCommand = await buildUploadCodeSiteCommand(
            uploadPath,
            siteInfo,
            configData
        );

        if (!uploadCommand) {
            return;
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_PAC_TRIGGERED, {
            methodName: uploadCodeSite.name,
            siteIdToUpload: siteInfo.websiteId
        });

        PacTerminal.getTerminal().sendText(uploadCommand);
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_FAILED, error as Error, {
            methodName: uploadCodeSite.name,
            siteIdToUpload: siteInfo.websiteId
        });
        await vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.UPLOAD_CODE_SITE_FAILED));
    }
};

/**
 * Uploads a site that isn't in the current environment
 * @param siteTreeItem The site tree item containing site information
 */
async function uploadOtherSite(siteTreeItem: SiteTreeItem): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_CALLED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId });
    const websitePath = siteTreeItem.siteInfo.folderPath;

    if (!websitePath) {
        return;
    }

    if (siteTreeItem.siteInfo.isCodeSite) {
        await uploadCodeSite(siteTreeItem.siteInfo, websitePath);
        return;
    }

    // Check if EDM is supported to determine the correct model version
    let modelVersionParam = '';
    let dataModelVersion = 1;
    const currentOrgUrl = PacContext.OrgInfo?.OrgUrl ?? '';
    const dataverseAccessToken = await dataverseAuthentication(currentOrgUrl, true);

    if (dataverseAccessToken) {
        const isEdmSupported = await isEdmEnvironment(currentOrgUrl, dataverseAccessToken.accessToken);
        if (isEdmSupported) {
            modelVersionParam = '--modelVersion 2';
            dataModelVersion = 2;
        }
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_PAC_TRIGGERED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId, dataModelVersion });
    PacTerminal.getTerminal().sendText(`pac pages upload --path "${websitePath}" ${modelVersionParam}`);
}

/**
 * Uploads a site that's in the current environment
 * @param siteTreeItem The site tree item containing site information
 */
async function uploadCurrentSite(siteTreeItem: SiteTreeItem, websitePath: string): Promise<void> {
    traceInfo(
        Constants.EventNames.ACTIONS_HUB_UPLOAD_CURRENT_SITE_CALLED,
        {
            methodName: uploadSite.name,
            siteIdToUpload: siteTreeItem.siteInfo.websiteId,
            modelVersion: siteTreeItem.siteInfo.dataModelVersion
        }
    );

    // Public sites require confirmation to prevent accidental deployment
    if (siteTreeItem.siteInfo.siteVisibility?.toLowerCase() === SiteVisibility.Public) {
        const confirm = await vscode.window.showInformationMessage(
            Constants.Strings.SITE_UPLOAD_CONFIRMATION,
            { modal: true },
            Constants.Strings.YES
        );

        if (confirm !== Constants.Strings.YES) {
            traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CURRENT_SITE_CANCELLED_PUBLIC_SITE, {
                methodName: uploadSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                modelVersion: siteTreeItem.siteInfo.dataModelVersion
            });
            return;
        }
    }

    const websitePathToUpload = websitePath || CurrentSiteContext.currentSiteFolderPath;
    if (!websitePathToUpload) {
        vscode.window.showErrorMessage(vscode.l10n.t(Constants.Strings.CURRENT_SITE_PATH_NOT_FOUND));
        return;
    }

    if (siteTreeItem.siteInfo.isCodeSite) {
        await uploadCodeSite(siteTreeItem.siteInfo, websitePathToUpload);
        return;
    }

    const modelVersion = siteTreeItem.siteInfo.dataModelVersion || 1;

    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CURRENT_SITE_PAC_TRIGGERED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId, dataModelVersion: modelVersion });
    PacTerminal.getTerminal().sendText(`pac pages upload --path "${websitePathToUpload}" --modelVersion "${modelVersion}"`);
}

/**
 * Uploads a Power Pages site to the environment
 * @param siteTreeItem The site tree item containing site information
 * @param websitePath The path to the website folder to upload. If not passed the current site context will be used.
 */
export const uploadSite = async (siteTreeItem: SiteTreeItem, websitePath: string) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_CALLED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId });
    try {
        // Handle upload for "other" sites (sites not in the current environment)
        if (siteTreeItem && siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            await uploadOtherSite(siteTreeItem);
            return;
        }

        // Handle upload for active/inactive sites
        await uploadCurrentSite(siteTreeItem, websitePath);
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED,
            error as Error,
            { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId }
        );
    }
};
