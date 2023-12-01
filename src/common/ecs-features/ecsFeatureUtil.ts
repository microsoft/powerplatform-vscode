/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { PowerPagesClientName, ECS_REQUEST_URL_TEMPLATE } from "./constants";
import { ECSAPIFeatureFlagFilters } from "./ecsFeatureFlagFilters";

export function getECSRequestURL(filters: ECSAPIFeatureFlagFilters, clientName = PowerPagesClientName): string {
    return ECS_REQUEST_URL_TEMPLATE
        .replace("{ClientName}", clientName)
        .replace("{AppName}", filters.AppName)
        .replace("{EnvironmentId}", filters.EnvID)
        .replace("{UserId}", filters.UserID)
        .replace("{TenantId}", filters.TenantID)
        .replace("{Region}", filters.Region);
}
