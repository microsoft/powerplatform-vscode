/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import MetadataDiffContext from "../../MetadataDiffContext";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";

/**
 * Clears the metadata diff results from the tree view after user confirmation
 */
export async function clearMetadataDiff(): Promise<void> {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_CLEAR, {
        methodName: clearMetadataDiff.name
    });

    const confirmButton = Constants.Strings.CLEAR_ALL;
    const result = await vscode.window.showWarningMessage(
        Constants.Strings.CLEAR_ALL_RESULTS_TITLE,
        { modal: true, detail: Constants.Strings.CLEAR_ALL_RESULTS_MESSAGE },
        confirmButton
    );

    if (result !== confirmButton) {
        return;
    }

    MetadataDiffContext.clear();
}
