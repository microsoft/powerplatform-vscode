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
import { PacWrapper } from "../../../pac/PacWrapper";

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
 * @param pacWrapper PAC CLI wrapper used to execute the upload
 */
const uploadCodeSite = async (siteInfo: IWebsiteInfo, uploadPath: string, pacWrapper: PacWrapper) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_CALLED, {
        methodName: uploadCodeSite.name,
        siteIdToUpload: siteInfo.websiteId
    });

    try {
        const configFilePath = path.join(uploadPath, Constants.Strings.POWER_PAGES_CONFIG_FILE_NAME);
        const configData = readPowerPagesConfig(configFilePath);

        const compiledPath = configData.hasCompiledPath ? undefined : await getCompiledOutputFolderPath();
        if (!configData.hasCompiledPath && !compiledPath) {
            await vscode.window.showErrorMessage(Constants.Strings.UPLOAD_CODE_SITE_COMPILED_OUTPUT_FOLDER_NOT_FOUND);
            return;
        }

        traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_PAC_TRIGGERED, {
            methodName: uploadCodeSite.name,
            siteIdToUpload: siteInfo.websiteId
        });

        pacWrapper.showOutputChannel();
        const uploadSucceeded = await pacWrapper.uploadCodeSiteWithProgress(
            uploadPath,
            configData.hasSiteName ? undefined : siteInfo.name,
            undefined,
            compiledPath
        );
        if (!uploadSucceeded) {
            throw new Error("Code site upload failed");
        }
    } catch (error) {
        traceError(Constants.EventNames.ACTIONS_HUB_UPLOAD_CODE_SITE_FAILED, error as Error, {
            methodName: uploadCodeSite.name,
            siteIdToUpload: siteInfo.websiteId
        });
        await vscode.window.showErrorMessage(Constants.Strings.UPLOAD_CODE_SITE_FAILED);
    }
};

/**
 * Uploads a site that isn't in the current environment
 * @param siteTreeItem The site tree item containing site information
 * @param pacWrapper PAC CLI wrapper used to execute the upload
 */
async function uploadOtherSite(siteTreeItem: SiteTreeItem, pacWrapper: PacWrapper): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_CALLED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId });
    const websitePath = siteTreeItem.siteInfo.folderPath;

    if (!websitePath) {
        return;
    }

    if (siteTreeItem.siteInfo.isCodeSite) {
        await uploadCodeSite(siteTreeItem.siteInfo, websitePath, pacWrapper);
        return;
    }

    // Check if EDM is supported to determine the correct model version
    let modelVersionParam: string | undefined;
    let dataModelVersion = 1;
    const currentOrgUrl = PacContext.OrgInfo?.OrgUrl ?? '';
    const dataverseAccessToken = await dataverseAuthentication(currentOrgUrl, true);

    if (dataverseAccessToken) {
        const isEdmSupported = await isEdmEnvironment(currentOrgUrl, dataverseAccessToken.accessToken);
        if (isEdmSupported) {
            modelVersionParam = '2';
            dataModelVersion = 2;
        }
    }

    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_OTHER_SITE_PAC_TRIGGERED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId, dataModelVersion });
    pacWrapper.showOutputChannel();
    if (!await pacWrapper.uploadSiteWithProgress(websitePath, modelVersionParam)) {
        throw new Error("Site upload failed");
    }
}

/**
 * Uploads a site that's in the current environment
 * @param siteTreeItem The site tree item containing site information
 * @param websitePath Path to the site folder to upload
 * @param pacWrapper PAC CLI wrapper used to execute the upload
 */
async function uploadCurrentSite(siteTreeItem: SiteTreeItem, websitePath: string, pacWrapper: PacWrapper): Promise<void> {
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
        await uploadCodeSite(siteTreeItem.siteInfo, websitePathToUpload, pacWrapper);
        return;
    }

    const modelVersion = siteTreeItem.siteInfo.dataModelVersion || 1;

    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_CURRENT_SITE_PAC_TRIGGERED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId, dataModelVersion: modelVersion });
    pacWrapper.showOutputChannel();
    if (!await pacWrapper.uploadSiteWithProgress(websitePathToUpload, modelVersion.toString())) {
        throw new Error("Site upload failed");
    }
}

/**
 * Creates a handler that uploads a Power Pages site without invoking a shell.
 * @param pacTerminal PAC CLI integration used to execute uploads
 * @returns Upload handler accepting a site tree item and an optional site folder path
 */
export const uploadSite = (pacTerminal: PacTerminal) => async (siteTreeItem: SiteTreeItem, websitePath: string) => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_CALLED, { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId });
    try {
        if (!vscode.workspace.isTrusted) {
            await vscode.window.showErrorMessage(Constants.Strings.UPLOAD_SITE_REQUIRES_TRUST);
            return;
        }

        const pacWrapper = pacTerminal.getWrapper();

        // Handle upload for "other" sites (sites not in the current environment)
        if (siteTreeItem && siteTreeItem.contextValue === Constants.ContextValues.OTHER_SITE) {
            await uploadOtherSite(siteTreeItem, pacWrapper);
            return;
        }

        // Handle upload for active/inactive sites
        await uploadCurrentSite(siteTreeItem, websitePath, pacWrapper);
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED,
            error as Error,
            { methodName: uploadSite.name, siteIdToUpload: siteTreeItem.siteInfo.websiteId }
        );
        await vscode.window.showErrorMessage(Constants.Strings.UPLOAD_CODE_SITE_FAILED);
    }
};
