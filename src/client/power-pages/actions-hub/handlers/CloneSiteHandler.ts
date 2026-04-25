/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as os from "os";
import * as fs from "fs-extra";
import path from "path";
import { PacTerminal } from "../../../lib/PacTerminal";
import { Constants } from "../Constants";
import { SiteTreeItem } from "../tree-items/SiteTreeItem";
import { traceError, traceInfo } from "../TelemetryHelper";
import { showProgressWithNotification } from "../../../../common/utilities/Utils";
import { PacWrapper } from "../../../pac/PacWrapper";
import { v4 } from "uuid";

/**
 * Creates a temporary directory for clone operations.
 * Returns the paths for download and clone output subdirectories.
 */
const createTempDirectories = (): { basePath: string; downloadPath: string; outputPath: string } => {
    const basePath = path.join(os.tmpdir(), `pp-clone-${v4()}`);
    const downloadPath = path.join(basePath, "download");
    const outputPath = path.join(basePath, "output");

    fs.ensureDirSync(downloadPath);
    fs.ensureDirSync(outputPath);

    return { basePath, downloadPath, outputPath };
};

/**
 * Finds the site content folder created by the download command.
 * The download command creates a subfolder named after the site inside the download path.
 */
const findDownloadedSitePath = (downloadPath: string): string | undefined => {
    const entries = fs.readdirSync(downloadPath, { withFileTypes: true });
    const siteFolder = entries.find(entry => entry.isDirectory());
    return siteFolder ? path.join(downloadPath, siteFolder.name) : undefined;
};

/**
 * Downloads the site using the appropriate method based on site type.
 */
const downloadSite = async (
    pacWrapper: PacWrapper,
    siteTreeItem: SiteTreeItem,
    downloadPath: string
): Promise<boolean> => {
    if (siteTreeItem.siteInfo.isCodeSite) {
        return await showProgressWithNotification(
            Constants.StringFunctions.DOWNLOADING_SITE_FOR_CLONE(siteTreeItem.siteInfo.name),
            async () => pacWrapper.downloadCodeSiteWithProgress(
                downloadPath,
                siteTreeItem.siteInfo.websiteId
            )
        );
    }

    return await showProgressWithNotification(
        Constants.StringFunctions.DOWNLOADING_SITE_FOR_CLONE(siteTreeItem.siteInfo.name),
        async () => pacWrapper.downloadSiteWithProgress(
            downloadPath,
            siteTreeItem.siteInfo.websiteId,
            siteTreeItem.siteInfo.dataModelVersion
        )
    );
};

/**
 * Clones a Power Pages site by downloading it to a temp location, cloning, and uploading.
 * The only user input required is the name for the cloned site.
 * Runs three PAC CLI commands sequentially with progress: download, clone, and upload.
 */
export const cloneSite = (pacTerminal: PacTerminal) => async (siteTreeItem: SiteTreeItem): Promise<void> => {
    traceInfo(
        Constants.EventNames.ACTIONS_HUB_CLONE_SITE_CALLED,
        {
            methodName: cloneSite.name,
            siteId: siteTreeItem.siteInfo.websiteId,
            dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
        }
    );

    let tempBasePath: string | undefined;

    try {
        const cloneName = await vscode.window.showInputBox({
            prompt: Constants.Strings.CLONE_SITE_NAME_PROMPT,
            value: `Copy of ${siteTreeItem.siteInfo.name}`,
            validateInput: (value) => value?.trim() ? null : Constants.Strings.CLONE_SITE_NAME_VALIDATION
        });

        if (!cloneName) {
            return;
        }

        const { basePath, downloadPath, outputPath } = createTempDirectories();
        tempBasePath = basePath;

        const pacWrapper = pacTerminal.getWrapper();

        // Step 1: Download the site to a temp location
        traceInfo(
            Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_TRIGGERED,
            {
                methodName: cloneSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );

        const downloadSuccess = await downloadSite(pacWrapper, siteTreeItem, downloadPath);

        if (!downloadSuccess) {
            traceError(
                Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_FAILED,
                new Error("Download operation failed during clone"),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            await vscode.window.showErrorMessage(Constants.Strings.CLONE_SITE_DOWNLOAD_FAILED);
            return;
        }

        // Find the site folder created by the download
        const sitePath = findDownloadedSitePath(downloadPath);
        if (!sitePath) {
            traceError(
                Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_FAILED,
                new Error("Downloaded site folder not found"),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            await vscode.window.showErrorMessage(Constants.Strings.CLONE_SITE_DOWNLOAD_FAILED);
            return;
        }

        // Step 2: Clone the downloaded site
        traceInfo(
            Constants.EventNames.ACTIONS_HUB_CLONE_SITE_PAC_TRIGGERED,
            {
                methodName: cloneSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
            }
        );

        const cloneSuccess = await showProgressWithNotification(
            Constants.StringFunctions.CLONING_SITE(siteTreeItem.siteInfo.name),
            async () => pacWrapper.cloneSiteWithProgress(sitePath, outputPath, cloneName)
        );

        if (!cloneSuccess) {
            traceError(
                Constants.EventNames.ACTIONS_HUB_CLONE_SITE_FAILED,
                new Error("Clone operation failed"),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            await vscode.window.showErrorMessage(Constants.Strings.CLONE_SITE_FAILED);
            return;
        }

        // Find the cloned site folder created by the clone command
        const clonedSitePath = findDownloadedSitePath(outputPath);
        if (!clonedSitePath) {
            traceError(
                Constants.EventNames.ACTIONS_HUB_CLONE_SITE_FAILED,
                new Error("Cloned site folder not found"),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            await vscode.window.showErrorMessage(Constants.Strings.CLONE_SITE_FAILED);
            return;
        }

        // Step 3: Upload the cloned site
        traceInfo(
            Constants.EventNames.ACTIONS_HUB_UPLOAD_CLONED_SITE_PAC_TRIGGERED,
            {
                methodName: cloneSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );

        let uploadSuccess: boolean;

        if (siteTreeItem.siteInfo.isCodeSite) {
            uploadSuccess = await showProgressWithNotification(
                Constants.StringFunctions.UPLOADING_CLONED_SITE(cloneName),
                async () => pacWrapper.uploadCodeSiteWithProgress(clonedSitePath, cloneName)
            );
        } else {
            uploadSuccess = await showProgressWithNotification(
                Constants.StringFunctions.UPLOADING_CLONED_SITE(cloneName),
                async () => pacWrapper.uploadSiteWithProgress(clonedSitePath, siteTreeItem.siteInfo.dataModelVersion.toString())
            );
        }

        if (!uploadSuccess) {
            traceError(
                Constants.EventNames.ACTIONS_HUB_UPLOAD_CLONED_SITE_FAILED,
                new Error("Upload of cloned site failed"),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            await vscode.window.showErrorMessage(Constants.Strings.UPLOAD_CLONED_SITE_FAILED);
            return;
        }

        traceInfo(
            Constants.EventNames.ACTIONS_HUB_CLONE_SITE_COMPLETED,
            {
                methodName: cloneSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
            }
        );

        await vscode.window.showInformationMessage(Constants.Strings.CLONE_SITE_SUCCESS);

        // Refresh the Actions Hub tree to show the newly cloned site
        await vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");
    } catch (error) {
        traceError(
            Constants.EventNames.ACTIONS_HUB_CLONE_SITE_FAILED,
            error as Error,
            {
                methodName: cloneSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
                dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
            }
        );
    } finally {
        if (tempBasePath) {
            fs.remove(tempBasePath).catch(() => { /* best-effort cleanup */ });
        }
    }
};
