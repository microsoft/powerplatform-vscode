/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";

export interface TargetFolderQuickPickItem extends vscode.QuickPickItem {
    uri?: vscode.Uri;
    browse?: true;
}

/**
 * Builds the target-folder items shared by the standalone picker and Agentic Create wizard.
 * @param workspaceFolders Open workspace folders in display order.
 * @returns Workspace-folder items followed by Browse.
 */
export const getTargetFolderQuickPickItems = (
    workspaceFolders: readonly vscode.WorkspaceFolder[]
): TargetFolderQuickPickItem[] => {
    const items: TargetFolderQuickPickItem[] = workspaceFolders.map(folder => ({
        label: folder.name,
        description: folder.uri.fsPath,
        iconPath: new vscode.ThemeIcon("folder"),
        uri: folder.uri
    }));
    items.push({
        label: URI_HANDLER_STRINGS.BUTTONS.BROWSE,
        iconPath: new vscode.ThemeIcon("folder-opened"),
        browse: true
    });
    return items;
};

/**
 * Resolves a target-folder item, opening the native folder dialog only for Browse.
 * @param selectedItem Quick Pick item selected by the user.
 * @param showOpenDialog Native folder dialog implementation.
 * @returns The selected folder, or undefined when Browse is cancelled.
 */
export const resolveTargetFolderQuickPickItem = async (
    selectedItem: TargetFolderQuickPickItem,
    showOpenDialog: SelectTargetFolderDependencies["showOpenDialog"]
): Promise<vscode.Uri | undefined> => {
    if (!selectedItem.browse) {
        return selectedItem.uri;
    }

    const selectedFolders = await showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: URI_HANDLER_STRINGS.BUTTONS.SELECT_FOLDER,
        title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
    });
    return selectedFolders?.[0];
};

/**
 * VS Code interactions used by {@link selectTargetFolder}.
 */
export interface SelectTargetFolderDependencies {
    getWorkspaceFolders(): readonly vscode.WorkspaceFolder[];
    showQuickPick(
        items: readonly TargetFolderQuickPickItem[],
        options: vscode.QuickPickOptions
    ): Thenable<TargetFolderQuickPickItem | undefined>;
    showOpenDialog(options: vscode.OpenDialogOptions): Thenable<vscode.Uri[] | undefined>;
}

const DEFAULT_DEPENDENCIES: SelectTargetFolderDependencies = {
    getWorkspaceFolders: () => vscode.workspace.workspaceFolders ?? [],
    showQuickPick: (items, options) => vscode.window.showQuickPick(items, options),
    showOpenDialog: (options) => vscode.window.showOpenDialog(options)
};

/**
 * Prompts the user to select the folder where a Power Pages site will be created.
 *
 * Open workspace folders are presented directly in a Quick Pick. The native folder dialog is
 * reserved for the explicit Browse option so the flow does not unexpectedly leave VS Code.
 *
 * @param dependencies Optional VS Code interactions used by integration tests.
 * @returns The selected folder URI, or undefined when the user cancels either picker.
 */
export const selectTargetFolder = async (
    dependencies: SelectTargetFolderDependencies = DEFAULT_DEPENDENCIES
): Promise<vscode.Uri | undefined> => {
    const items = getTargetFolderQuickPickItems(dependencies.getWorkspaceFolders());

    const selectedItem = await dependencies.showQuickPick(items, {
        canPickMany: false,
        ignoreFocusOut: true,
        title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
    });
    if (!selectedItem) {
        return undefined;
    }

    return resolveTargetFolderQuickPickItem(selectedItem, dependencies.showOpenDialog);
};
