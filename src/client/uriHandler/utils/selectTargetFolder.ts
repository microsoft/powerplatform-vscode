/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";

interface TargetFolderQuickPickItem extends vscode.QuickPickItem {
    uri?: vscode.Uri;
    browse?: true;
}

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
    const items: TargetFolderQuickPickItem[] = dependencies.getWorkspaceFolders().map(folder => ({
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

    const selectedItem = await dependencies.showQuickPick(items, {
        canPickMany: false,
        ignoreFocusOut: true,
        title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
    });
    if (!selectedItem) {
        return undefined;
    }

    if (!selectedItem.browse) {
        return selectedItem.uri;
    }

    const selectedFolders = await dependencies.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: URI_HANDLER_STRINGS.BUTTONS.SELECT_FOLDER,
        title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
    });

    return selectedFolders?.[0];
};
