/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import MetadataDiffContext, { MetadataDiffViewMode } from "../../MetadataDiffContext";
import { traceInfo } from "../../TelemetryHelper";
import { Constants } from "../../Constants";

/**
 * Handler for switching to tree view mode
 */
export const viewAsTree = (): void => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_VIEW_MODE_CHANGED, {
        methodName: viewAsTree.name,
        viewMode: MetadataDiffViewMode.Tree
    });

    MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);
};

/**
 * Handler for switching to list view mode
 */
export const viewAsList = (): void => {
    traceInfo(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_VIEW_MODE_CHANGED, {
        methodName: viewAsList.name,
        viewMode: MetadataDiffViewMode.List
    });

    MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
};
