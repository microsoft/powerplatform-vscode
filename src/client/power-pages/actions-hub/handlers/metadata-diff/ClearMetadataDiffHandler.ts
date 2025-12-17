/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import MetadataDiffContext from "../../MetadataDiffContext";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";

/**
 * Clears the metadata diff results from the tree view
 */
export function clearMetadataDiff(): void {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_CLEAR, {
        methodName: clearMetadataDiff.name
    });

    MetadataDiffContext.clear();
}
