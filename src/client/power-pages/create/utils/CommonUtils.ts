/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { exec } from "child_process";
import { existsSync, stat } from "fs";
import path from "path";
import * as vscode from "vscode";
import { FileCreateEvent, sendTelemetryEvent } from "../../../../common/OneDSLoggerTelemetry/telemetry/telemetry";
import {
    ERROR_MESSAGE,
    NOT_A_PORTAL_DIRECTORY,
    NO_WORKSPACEFOLDER_FOUND,
    SHOW_OUTPUT_PANEL,
    Tables,
    WEBSITE_YML,
} from "../CreateOperationConstants";
import { Context } from "@microsoft/generator-powerpages/context";
import { IPageTemplates, IParentPagePaths, ITemplate, IWebTemplates } from "../CreateTypes";
import DesktopFS from "./DesktopFS";

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

// Function to get the names and values of page templates from a provided context
export function getPageTemplate(context: Context): IPageTemplates {

    const pageTemplates: ITemplate[] = context.getPageTemplates();

    // Check if pageTemplates is not empty
    if (!pageTemplates.length) {
        return { pageTemplateNames: [], pageTemplateMap: new Map() };
    }

    const pageTemplateNames = pageTemplates.map((template) => template.name);

    // Create a map of page template names to their corresponding values
    const pageTemplateMap = new Map<string, string>();
    pageTemplates.forEach((template) => {
        pageTemplateMap.set(template.name, template.value);
    });

    // Return the extracted page template names and map
    return { pageTemplateNames, pageTemplateMap };
}

export function getParentPagePaths(portalContext: Context): IParentPagePaths {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: Map<string, any> = new Map();
    const paths: Array<string> = [];
    const pathsMap: Map<string, string> = new Map();
    const webpageNames: Array<string> = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    portalContext.webpageMap.forEach((page: any) => {
        pages.set(page.id, page.content);
    });

    if (pages.size === 0) {
        return { paths: [], pathsMap: new Map(), webpageNames: [] };
    }

    // eslint-disable-next-line prefer-const
    for (let [webpageid, page] of pages) {
        if (!page.adx_name || !webpageid) {
            continue;
        }
        let path = page.adx_name;
        webpageNames.push(path);

        // If the page is a home page, add it to the paths array
        if (!page.adx_parentpageid && page.adx_partialurl === "/") {
            paths.push(path);
            pathsMap.set(path, webpageid);
            continue;
        }
        let prevPage = null;
        if (pages.has(page.adx_parentpageid)) {
            while (page.adx_parentpageid) {
                if (!pages.has(page.adx_parentpageid)) {
                    break;
                }
                // to check for circular reference
                if (prevPage === page) {
                    break;
                }
                prevPage = page;
                page = pages.get(page.adx_parentpageid);
                path = `${page.adx_name}/${path}`;
            }
            // to check for duplicates
            if (paths.indexOf(path) === -1) {
                paths.push(path);
                pathsMap.set(path, webpageid);
            }
        }
    }
    paths.sort();
    return { paths, pathsMap, webpageNames };
}

export async function getWebTemplates(
    portalContext: Context
): Promise<IWebTemplates> {
    await portalContext.init([Tables.WEBTEMPLATE]);
    const webTemplates: ITemplate[] = portalContext.getWebTemplates();

    const webTemplateNames = webTemplates.map((template) => template.name);
    const webTemplateMap = new Map<string, string>();
    webTemplates.forEach((template) => {
        webTemplateMap.set(template.name, template.value);
    });
    return { webTemplateNames, webTemplateMap };
}


export function getPortalContext(portalDir: string): Context {
    const fs: DesktopFS = new DesktopFS();
    const portalContext = Context.getInstance(portalDir, fs);
    return portalContext;
}

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
    watcher: vscode.FileSystemWatcher
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
                        sendTelemetryEvent({ methodName: createRecord.name, eventName: FileCreateEvent, fileEntityType: entityType, durationInMills: (performance.now() - startTime), exception: error as Error })
                        reject(error);
                    } else {
                        sendTelemetryEvent({ methodName: createRecord.name, eventName: FileCreateEvent, fileEntityType: entityType, durationInMills: (performance.now() - startTime) })
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
        throw new Error(NO_WORKSPACEFOLDER_FOUND);
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


export function logErrorAndNotifyUser(errorMessage: string) {
    const outputChannel = vscode.window.createOutputChannel("Powerplatfrom");
    outputChannel.appendLine(`Error: ${errorMessage}`);
    vscode.window.showErrorMessage(
        ERROR_MESSAGE,
        SHOW_OUTPUT_PANEL
    ).then((selection) => {
        if (selection === SHOW_OUTPUT_PANEL) {
            outputChannel.show();
        }
    });
}
