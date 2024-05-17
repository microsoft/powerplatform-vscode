/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { getIntelligenceEndpoint } from "../../ArtemisService";

export async function getEndpoint(
  orgID: string,
  telemetry: ITelemetry,
  cachedEndpoint: { intelligenceEndpoint: string; geoName: string } | null
): Promise<{ intelligenceEndpoint: string; geoName: string }> {
  if (!cachedEndpoint) {
    cachedEndpoint = await getIntelligenceEndpoint(orgID, telemetry, '') as { intelligenceEndpoint: string; geoName: string };
  }
  return cachedEndpoint;
}
