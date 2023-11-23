/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ECS_REQUEST_URL_TEMPLATE } from "./constants";

export function getECSRequestURL(envId?: string, userId?: string, tenantId?: string, region?: string) {
    return ECS_REQUEST_URL_TEMPLATE
        .replace("{EnvironmentId}", envId ?? "")
        .replace("{UserId}", userId ?? "")
        .replace("{TenantId}", tenantId ?? "")
        .replace("{Region}", region ?? "");
}

