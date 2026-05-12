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
import { POWERPAGES_SITE_FOLDER, WEBSITE_YML } from "../../../../common/constants";
import PacContext from "../../../pac/PacContext";
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
 * Checks whether a directory looks like a Power Pages site root.
 *
 * A non-code site root contains `website.yml` directly.
 * A code site root contains `.powerpages-site/website.yml`.
 */
const containsSiteRoot = (dirPath: string): boolean => {
    return fs.existsSync(path.join(dirPath, WEBSITE_YML)) ||
        fs.existsSync(path.join(dirPath, POWERPAGES_SITE_FOLDER, WEBSITE_YML));
};

/**
 * Finds the site content path produced by the pac CLI download/clone commands.
 *
 * The pac CLI produces one of these layouts inside the target directory:
 *  - `pac pages download` (any site type): a single visible subfolder named
 *    after the site, containing `website.yml` (or `.powerpages-site/website.yml`
 *    for code sites).
 *  - `pac pages clone` of a code site: a single visible subfolder containing
 *    `.powerpages-site/website.yml`.
 *  - `pac pages clone` of a non-code site: `website.yml` placed directly in
 *    the output directory alongside several visible content subfolders such
 *    as `basic-forms/`, `web-pages/`, `web-templates/`, `webfiles/`, and a
 *    hidden `.portalconfig/` folder. None of those subfolders is the site
 *    root — the output directory itself is.
 *
 * Detection is strictly marker-based: we look for `website.yml` (or
 * `.powerpages-site/website.yml`) at the root first, then in each visible
 * child folder. If no marker is found the result is `undefined`, which the
 * caller surfaces as a clear download/clone failure rather than handing
 * the upload step a wrong path.
 */
const findDownloadedSitePath = (rootPath: string): string | undefined => {
    if (!fs.existsSync(rootPath)) {
        return undefined;
    }

    if (containsSiteRoot(rootPath)) {
        return rootPath;
    }

    const entries = fs.readdirSync(rootPath, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith(".")) {
            continue;
        }
        const childPath = path.join(rootPath, entry.name);
        if (containsSiteRoot(childPath)) {
            return childPath;
        }
    }

    return undefined;
};

/**
 * Shows an error message with a "Show Details" action that opens the PAC CLI
 * output channel, mirroring the inline `details` link used in progress notifications.
 * Fire-and-forget so the caller isn't blocked waiting for the user to dismiss the toast.
 */
const showErrorWithDetails = (pacWrapper: PacWrapper, message: string): void => {
    const showDetails = Constants.Strings.SHOW_DETAILS;
    void vscode.window.showErrorMessage(message, showDetails).then((selection) => {
        if (selection === showDetails) {
            pacWrapper.showOutputChannel();
        }
    });
};

/**
 * Outcome of the clone pipeline executed inside the single progress notification.
 * Telemetry and the failure toast are emitted by the caller after the progress
 * notification closes, so they don't visually overlap with the spinner.
 */
type CloneStepResult =
    | { kind: "ok" }
    | { kind: "cancelled" }
    | { kind: "download-failed"; reason: string }
    | { kind: "clone-failed"; reason: string }
    | { kind: "upload-failed"; reason: string };

/**
 * Builds the progress step message used while uploading the cloned site.
 * Falls back to a generic "Uploading site..." when the environment friendly
 * name is missing, to avoid rendering an empty `'' environment` placeholder.
 */
const buildUploadingMessage = (environmentName: string): string => {
    const trimmed = environmentName.trim();
    return trimmed
        ? Constants.StringFunctions.UPLOADING_CLONED_SITE_TO_ENV(trimmed)
        : Constants.Strings.CLONE_SITE_UPLOADING;
};

/**
 * Clones a Power Pages site by downloading it to a temp location, cloning, and uploading.
 * The only user input required is the name for the cloned site.
 *
 * The full pipeline (download → clone → upload) runs inside a single VS Code
 * progress notification titled "Clone site: {siteName}". Step transitions are
 * surfaced via `progress.report({ message })`. The notification is cancellable —
 * clicking Cancel kills the running `pac` child process, skips remaining steps,
 * fires a cancellation telemetry event, and shows an info toast (no error).
 *
 * The progress callback returns a {@link CloneStepResult}; success/failure
 * handling, telemetry, and the follow-up toast happen after the notification
 * closes so they don't visually collide with the spinner.
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
        const environmentName = PacContext.AuthInfo?.OrganizationFriendlyName ?? "";

        const result = await showProgressWithNotification<CloneStepResult>(
            Constants.StringFunctions.CLONE_SITE_PROGRESS_TITLE(siteTreeItem.siteInfo.name),
            true,
            async (progress, token) => {
                if (token.isCancellationRequested) {
                    return { kind: "cancelled" };
                }

                // Step 1: Download the site to a temp location
                progress.report({ message: Constants.Strings.CLONE_SITE_DOWNLOADING });
                traceInfo(
                    Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_TRIGGERED,
                    {
                        methodName: cloneSite.name,
                        siteId: siteTreeItem.siteInfo.websiteId,
                        dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
                    }
                );

                const downloadSuccess = siteTreeItem.siteInfo.isCodeSite
                    ? await pacWrapper.downloadCodeSiteWithProgress(
                        downloadPath,
                        siteTreeItem.siteInfo.websiteId,
                        undefined,
                        token
                    )
                    : await pacWrapper.downloadSiteWithProgress(
                        downloadPath,
                        siteTreeItem.siteInfo.websiteId,
                        siteTreeItem.siteInfo.dataModelVersion,
                        undefined,
                        undefined,
                        token
                    );

                if (token.isCancellationRequested) {
                    return { kind: "cancelled" };
                }

                if (!downloadSuccess) {
                    return { kind: "download-failed", reason: "Download operation failed during clone" };
                }

                const sitePath = findDownloadedSitePath(downloadPath);
                if (!sitePath) {
                    return { kind: "download-failed", reason: "Downloaded site folder not found" };
                }

                // Step 2: Clone the downloaded site
                progress.report({ message: Constants.Strings.CLONE_SITE_CLONING });
                traceInfo(
                    Constants.EventNames.ACTIONS_HUB_CLONE_SITE_PAC_TRIGGERED,
                    {
                        methodName: cloneSite.name,
                        siteId: siteTreeItem.siteInfo.websiteId,
                    }
                );

                const cloneSuccess = await pacWrapper.cloneSiteWithProgress(sitePath, outputPath, cloneName, token);

                if (token.isCancellationRequested) {
                    return { kind: "cancelled" };
                }

                if (!cloneSuccess) {
                    return { kind: "clone-failed", reason: "Clone operation failed" };
                }

                const clonedSitePath = findDownloadedSitePath(outputPath);
                if (!clonedSitePath) {
                    return { kind: "clone-failed", reason: "Cloned site folder not found" };
                }

                // Step 3: Upload the cloned site
                progress.report({ message: buildUploadingMessage(environmentName) });
                traceInfo(
                    Constants.EventNames.ACTIONS_HUB_UPLOAD_CLONED_SITE_PAC_TRIGGERED,
                    {
                        methodName: cloneSite.name,
                        siteId: siteTreeItem.siteInfo.websiteId,
                        dataModelVersion: siteTreeItem.siteInfo.dataModelVersion
                    }
                );

                const uploadSuccess = siteTreeItem.siteInfo.isCodeSite
                    ? await pacWrapper.uploadCodeSiteWithProgress(clonedSitePath, cloneName, token)
                    : await pacWrapper.uploadSiteWithProgress(clonedSitePath, siteTreeItem.siteInfo.dataModelVersion.toString(), token);

                if (token.isCancellationRequested) {
                    return { kind: "cancelled" };
                }

                if (!uploadSuccess) {
                    return { kind: "upload-failed", reason: "Upload of cloned site failed" };
                }

                return { kind: "ok" };
            }
        );

        if (result.kind === "cancelled") {
            traceInfo(
                Constants.EventNames.ACTIONS_HUB_CLONE_SITE_CANCELLED,
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            // Fire-and-forget so the cancellation toast doesn't block cleanup.
            void vscode.window.showInformationMessage(Constants.Strings.CLONE_SITE_CANCELLED);
            return;
        }

        if (result.kind === "download-failed") {
            traceError(
                Constants.EventNames.ACTIONS_HUB_CLONE_SITE_DOWNLOAD_FAILED,
                new Error(result.reason),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            showErrorWithDetails(pacWrapper, Constants.Strings.CLONE_SITE_DOWNLOAD_FAILED);
            return;
        }

        if (result.kind === "clone-failed") {
            traceError(
                Constants.EventNames.ACTIONS_HUB_CLONE_SITE_FAILED,
                new Error(result.reason),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            showErrorWithDetails(pacWrapper, Constants.Strings.CLONE_SITE_FAILED);
            return;
        }

        if (result.kind === "upload-failed") {
            traceError(
                Constants.EventNames.ACTIONS_HUB_UPLOAD_CLONED_SITE_FAILED,
                new Error(result.reason),
                { methodName: cloneSite.name, siteId: siteTreeItem.siteInfo.websiteId }
            );
            showErrorWithDetails(pacWrapper, Constants.Strings.UPLOAD_CLONED_SITE_FAILED);
            return;
        }

        traceInfo(
            Constants.EventNames.ACTIONS_HUB_CLONE_SITE_COMPLETED,
            {
                methodName: cloneSite.name,
                siteId: siteTreeItem.siteInfo.websiteId,
            }
        );

        // Refresh the Actions Hub tree to show the newly cloned site.
        // This must run before showing the success message because awaiting
        // showInformationMessage blocks until the notification is dismissed.
        await vscode.commands.executeCommand("microsoft.powerplatform.pages.actionsHub.refresh");

        // Fire-and-forget the success notification so it doesn't block subsequent work.
        void vscode.window.showInformationMessage(Constants.StringFunctions.CLONE_SITE_SUCCESS(cloneName));
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
