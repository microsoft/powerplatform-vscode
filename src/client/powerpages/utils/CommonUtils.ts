/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { Context } from "@microsoft/generator-powerpages/generators/context";
import { PageTemplates, ParentPagePaths, Tables, Template, WebTemplates } from "../constants";
import DesktopFS from "./DesktopFS";
import * as vscode from "vscode";
import { exec } from "child_process";

export const isNullOrEmpty = (str: string | undefined): boolean => {
    return !str || str.trim().length === 0;
};

export const formatFolderName = (name: string) => {
    return name.replace(/[/ ]/g, "-").toLowerCase();
};

export const formatFileName = (name: string) => {
    const words = name.split(/[/ ]/);

    // Uppercase the first letter of each word and join the words back together
    return words.map((word) => word[0].toUpperCase() + word.slice(1)).join("-");
};



// Function to get the names and values of page templates from a provided context
export function getPageTemplate(context: Context): PageTemplates {
    // Get the page templates from the provided context
    const pageTemplates: Template[] = context.getPageTemplates();

    // Check if pageTemplates is not empty
    if (!pageTemplates.length) {
        return { pageTemplateNames: [], pageTemplateMap: new Map() };
    }

    // Extract the names of the page templates
    const pageTemplateNames = pageTemplates.map((template) => template.name);

    // Create a map of page template names to their corresponding values
    const pageTemplateMap = new Map<string, string>();
    pageTemplates.forEach((template) => {
        pageTemplateMap.set(template.name, template.value);
    });

    // Return the extracted page template names and map
    return { pageTemplateNames, pageTemplateMap };
}

export function getParentPagePaths(portalContext: Context): ParentPagePaths {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pages: Map<string, any> = new Map();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    portalContext.webpageMap.forEach((page: any) => {
        pages.set(page.id, page.content);
    });

    if (pages.size === 0) {
        return { paths: [], pathsMap: new Map(), webpageNames: [] };
    }
    const paths: Array<string> = [];
    const pathsMap: Map<string, string> = new Map();
    const webpageNames: Array<string> = [];
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
): Promise<WebTemplates> {
    await portalContext.init([Tables.WEBTEMPLATE]);
    const webTemplates: Template[] = portalContext.getWebTemplates();

    const webTemplateNames = webTemplates.map((template) => template.name);
    const webTemplateMap = new Map<string, string>();
    webTemplates.forEach((template) => {
        webTemplateMap.set(template.name, template.value);
    });
    return { webTemplateNames, webTemplateMap };
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
    return vscode.window
        .withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `Creating ${entityType}...`,
                cancellable: false,
            },
            () => {
                return new Promise((resolve, reject) => {
                    exec(
                        execCommand,
                        { cwd: portalDirectory },
                        (error, stderr) => {
                            if (error) {
                                vscode.window.showErrorMessage(error.message);
                                reject(error);
                            } else {
                                resolve(stderr);
                            }
                        }
                    );
                });
            }
        )
        .then(() => {
            vscode.window.showInformationMessage(`${entityType} created!`);
            watcher.onDidCreate(async (uri) => {
                await vscode.window.showTextDocument(uri);
            });
        });
}


export function getPortalContext(portalDir:string): Context {
    const fs: DesktopFS = new DesktopFS();
    const portalContext = Context.getInstance(portalDir, fs);
    return portalContext;
}

export async function getSelectedWorkspaceFolder( uri: vscode.Uri, activeEditor: vscode.TextEditor | undefined) {
    let selectedWorkspaceFolder;

    if (!vscode.workspace.workspaceFolders) {
        throw new Error("No workspace folder found");
    }

    const workspaceFolder = activeEditor ?
        vscode.workspace.getWorkspaceFolder(activeEditor.document.uri) :
        null;

    switch (true) {
        case Boolean(uri):
            selectedWorkspaceFolder = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;
            break;
        case Boolean(workspaceFolder && vscode.workspace.workspaceFolders.length === 1):
            selectedWorkspaceFolder = workspaceFolder?.uri?.fsPath;
            break;
        case vscode.workspace.workspaceFolders.length > 1:
            return vscode.window.showWorkspaceFolderPick().then((folder) => {
                return folder?.uri.fsPath;
            });
        default:
            selectedWorkspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
            break;
    }

    return selectedWorkspaceFolder;
}
