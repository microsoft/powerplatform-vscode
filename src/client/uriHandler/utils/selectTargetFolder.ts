/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";

/**
 * Prompts the user to select the folder where a Power Pages site will be created.
 * @returns The selected folder URI, or undefined when the user cancels the dialog.
 */
export const selectTargetFolder = async (): Promise<vscode.Uri | undefined> => {
    const selectedFolders = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: URI_HANDLER_STRINGS.BUTTONS.SELECT_FOLDER,
        title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
    });

    return selectedFolders?.[0];
};
