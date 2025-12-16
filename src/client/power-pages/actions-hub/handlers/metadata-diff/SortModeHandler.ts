/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import MetadataDiffContext, { MetadataDiffSortMode } from "../../MetadataDiffContext";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";

/**
 * Handler for sorting by file name
 */
export const sortByName = (): void => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SORT_MODE_CHANGED, {
        methodName: sortByName.name,
        sortMode: MetadataDiffSortMode.Name
    });

    MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);
};

/**
 * Handler for sorting by file path
 */
export const sortByPath = (): void => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SORT_MODE_CHANGED, {
        methodName: sortByPath.name,
        sortMode: MetadataDiffSortMode.Path
    });

    MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);
};

/**
 * Handler for sorting by status
 */
export const sortByStatus = (): void => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SORT_MODE_CHANGED, {
        methodName: sortByStatus.name,
        sortMode: MetadataDiffSortMode.Status
    });

    MetadataDiffContext.setSortMode(MetadataDiffSortMode.Status);
};
