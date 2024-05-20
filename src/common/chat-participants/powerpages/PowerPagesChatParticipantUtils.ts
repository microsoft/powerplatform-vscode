/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { ADX_ENTITYFORM, ADX_ENTITYLIST } from "../../copilot/constants";
import { getEntityColumns, getEntityName, getFormXml } from "../../copilot/dataverseMetadata";
import { IActiveFileParams } from "../../copilot/model";
import { ArtemisService } from "../../services/ArtemisService";
import { dataverseAuthentication } from "../../services/AuthenticationProvider";

export async function getEndpoint(
    orgID: string,
    telemetry: ITelemetry,
    cachedEndpoint: { intelligenceEndpoint: string; geoName: string } | null
): Promise<{ intelligenceEndpoint: string; geoName: string }> {
    if (!cachedEndpoint) {
        cachedEndpoint = await ArtemisService.getIntelligenceEndpoint(orgID, telemetry, '', '') as { intelligenceEndpoint: string; geoName: string }; // TODO - add ENvironment ID and session ID
    }
    return cachedEndpoint;
}

/*
    * Get component info for the active file
    * @returns componentInfo - Entity details for active file (form or list)
*/
export async function getComponentInfo(telemetry: ITelemetry, orgUrl: string | undefined, activeFileParams: IActiveFileParams): Promise<string[]> {

    let metadataInfo = { entityName: '', formName: '' };
    let componentInfo: string[] = [];

    if (activeFileParams.dataverseEntity == ADX_ENTITYFORM || activeFileParams.dataverseEntity == ADX_ENTITYLIST) {
        metadataInfo = await getEntityName(telemetry, '', activeFileParams.dataverseEntity);

        const dataverseToken = (await dataverseAuthentication(telemetry, orgUrl ?? '', true)).accessToken;

        if (activeFileParams.dataverseEntity == ADX_ENTITYFORM) {
            const formColumns = await getFormXml(metadataInfo.entityName, metadataInfo.formName, orgUrl ?? '', dataverseToken, telemetry, 'sessionID');
            componentInfo = formColumns;
        } else {
            const entityColumns = await getEntityColumns(metadataInfo.entityName, orgUrl ?? '', dataverseToken, telemetry, 'sessionID');
            componentInfo = entityColumns;
        }
    }

    return componentInfo;
}
