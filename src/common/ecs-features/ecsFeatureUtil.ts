/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ClientName, ECS_REQUEST_URL_TEMPLATE } from "./constants";
import { StandardFeatureFilters } from "./standardFeatureFilters";

export function getECSRequestURL(filters: StandardFeatureFilters, clientName = ClientName): string {
    return ECS_REQUEST_URL_TEMPLATE
        .replace("{EnvironmentId}", filters.EnvID)
        .replace("{UserId}", filters.UserID)
        .replace("{TenantId}", filters.TenantID)
        .replace("{Region}", filters.Region)
        .replace("{clientName}", clientName);
}
