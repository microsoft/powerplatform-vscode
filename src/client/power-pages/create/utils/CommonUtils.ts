/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { exec } from "child_process";
import { existsSync, stat } from "fs";
import path from "path";
import * as vscode from "vscode";
import { ITelemetry } from "../../../telemetry/ITelemetry";
import { FileCreateEvent, sendTelemetryEvent, UserFileCreateEvent } from "../../telemetry";
import {
    NOT_A_PORTAL_DIRECTORY,
    Tables,
    TriggerPoint,
    WEBSITE_YML,
} from "../CreateOperationConstants";

export const isNullOrEmpty = (str: string | undefined): boolean => {
    return !str || str.trim().length === 0;
};

/**
 * @example
 * formatFolderName("My Folder Name"); // "my-folder-name"
 */
export const formatFolderName = (name: string) => {
    return name.replace(/[/ ]/g, "-").toLowerCase();
};

/**
 * @example
 * formatFileName("My File Name"); // "My-File-Name"
 */
export const formatFileName = (name: string) => {
    const words = name.trim().split(/[/ ]/);

    // Uppercase the first letter of each word and join the words back together
    return words.map((word) => word[0].toUpperCase() + word.slice(1)).join("-");
};

export function createFileWatcher(
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string,
    pattern: string
) {
    const watcher: vscode.FileSystemWatcher =
        vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(selectedWorkspaceFolder, pattern),
            false,
            true,
            true
        );

    context.subscriptions.push(watcher);
    return watcher;
}

export async function createRecord(
    entityType: string,
    execCommand: string,
    portalDirectory: string,
    watcher: vscode.FileSystemWatcher,
    telemetry: ITelemetry
) {
    const startTime = performance.now();
    await vscode.window.withProgress(
        {
            location: vscode.ProgressLocation.Notification,
            title: vscode.l10n.t({
                message: "Creating {0}...",
                args: [entityType],
                comment: ["{0} will be replaced by the entity type."],
            }),
            cancellable: false,
        },
        async (progress) => {
            return new Promise<void>((resolve, reject) => {
                watcher.onDidCreate(async (uri) => {
                    // Stop watching the directory to avoid duplicate events
                    watcher.dispose();
                    try {
                        await vscode.window.showTextDocument(uri);
                        vscode.window.showInformationMessage(
                            vscode.l10n.t({
                                message: "{0} created!",
                                args: [entityType],
                                comment: ["{0} will be replaced by the entity type."]
                            })
                        );
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });
                exec(execCommand, { cwd: portalDirectory }, (error) => {
                    if (error) {
                        vscode.window.showErrorMessage(vscode.l10n.t({
                            message: "Failed to create: {0}.",
                            args: [error.message],
                            comment: ["{0} will be replaced by the error message."]
                        }));
                        sendTelemetryEvent(telemetry, { eventName: FileCreateEvent, fileEntityType: entityType, durationInMills: (performance.now() - startTime), exception: error as Error })
                        reject(error);
                    } else {
                        sendTelemetryEvent(telemetry, { eventName: FileCreateEvent, fileEntityType: entityType, durationInMills: (performance.now() - startTime) })
                        progress.report({ increment: 100 });
                    }
                });
            });
        }
    );
}

export async function getSelectedWorkspaceFolder(
    uri: vscode.Uri,
    activeEditor: vscode.TextEditor | undefined,
) {
    let selectedWorkspaceFolder: string | undefined;
    let filePath: string;

    if (!vscode.workspace.workspaceFolders) {
        throw new Error("No workspace folder found");
    }

    const workspaceFolder = activeEditor
        ? vscode.workspace.getWorkspaceFolder(activeEditor.document.uri)
        : null;

    switch (true) {
        case Boolean(uri):
            filePath = uri.fsPath;
            selectedWorkspaceFolder = isWebsiteYML(filePath);
            break;
        case Boolean(
            workspaceFolder && vscode.workspace.workspaceFolders.length === 1
        ):
            selectedWorkspaceFolder = workspaceFolder?.uri?.fsPath;
            break;
        case vscode.workspace.workspaceFolders.length > 1:
            return vscode.window
                .showWorkspaceFolderPick()
                .then(async (folder) => {
                    const isPortalDirectory = await isPortalDir(
                        folder?.uri.fsPath
                    );
                    if (isPortalDirectory) {
                        return folder?.uri.fsPath;
                    } else {
                        throw new Error(NOT_A_PORTAL_DIRECTORY);
                    }
                });
        default:
            selectedWorkspaceFolder =
                vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            break;
    }

    const isPortalDirectory = await isPortalDir(selectedWorkspaceFolder);
    if (isPortalDirectory) {
        return selectedWorkspaceFolder;
    } else {
        throw new Error(NOT_A_PORTAL_DIRECTORY);
    }
}

export function isPortalDir(
    selectedFolder: string | undefined
): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if (selectedFolder) {
            stat(path.join(selectedFolder, WEBSITE_YML), (err) => {
                err ? resolve(false) : resolve(true);
            });
        } else {
            reject(new Error("No selected folder"));
        }
    });
}

export function isWebsiteYML(directory: string): string {
    while (directory !== path.parse(directory).root) {
        const websiteYMLPath = path.join(directory, WEBSITE_YML);
        if (existsSync(websiteYMLPath)) {
            return directory;
        }
        directory = path.dirname(directory);
    }
    vscode.window.showErrorMessage(NOT_A_PORTAL_DIRECTORY);
    throw new Error("");
}

export function sendTelemetryEventWithEntityType(entityType: Tables, uri:vscode.Uri, telemetry:ITelemetry): void {
    if (uri) {
        sendTelemetryEvent(telemetry, { eventName: UserFileCreateEvent, fileEntityType: entityType, triggerPoint: TriggerPoint.CONTEXT_MENU });
    } else {
        sendTelemetryEvent(telemetry, { eventName: UserFileCreateEvent, fileEntityType: entityType });
    }
}
