/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ITelemetry } from "../../../client/telemetry/ITelemetry";
import { ADX_ENTITYFORM} from "../../copilot/constants";
import { getEntityColumns, getEntityName, getFormXml } from "../../copilot/dataverseMetadata";
import { IActiveFileParams } from "../../copilot/model";
import { ArtemisService } from "../../services/ArtemisService";
import { dataverseAuthentication } from "../../services/AuthenticationProvider";
import { IIntelligenceAPIEndpointInformation } from "../../services/Interfaces";
import { SUPPORTED_ENTITIES } from "./PowerPagesChatParticipantConstants";



export async function getEndpoint(
    orgID: string,
    environmentID: string,
    telemetry: ITelemetry,
    cachedEndpoint: IIntelligenceAPIEndpointInformation | null
): Promise<IIntelligenceAPIEndpointInformation> {
    if (!cachedEndpoint) {
        cachedEndpoint = await ArtemisService.getIntelligenceEndpoint(orgID, telemetry, environmentID, '') as IIntelligenceAPIEndpointInformation; // TODO - add session ID
    }
    return cachedEndpoint;
}

/*
    * Get component info for the active file
    * @returns componentInfo - Entity details for active file (form or list)
*/
export async function getComponentInfo(telemetry: ITelemetry, orgUrl: string | undefined, activeFileParams: IActiveFileParams): Promise<{ componentInfo: string[], entityName: string }> {

    let metadataInfo = { entityName: '', formName: '' };
    let componentInfo: string[] = [];

    if (isEntityInSupportedList(activeFileParams.dataverseEntity)) {
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

    return {componentInfo, entityName: metadataInfo.entityName};
}

export function isEntityInSupportedList(entity: string): boolean {
    return SUPPORTED_ENTITIES.includes(entity);
}
