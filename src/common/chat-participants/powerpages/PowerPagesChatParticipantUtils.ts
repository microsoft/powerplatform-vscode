/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ADX_ENTITYFORM } from "../../copilot/constants";
import { getEntityColumns, getEntityName, getFormXml } from "../../copilot/dataverseMetadata";
import { IActiveFileParams } from "../../copilot/model";
import { ITelemetry } from "../../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { ArtemisService } from "../../services/ArtemisService";
import { dataverseAuthentication } from "../../services/AuthenticationProvider";
import { IIntelligenceAPIEndpointInformation } from "../../services/Interfaces";
import { EXPLAIN_CODE_PROMPT, FORM_PROMPT, LIST_PROMPT, STATER_PROMPTS, SUPPORTED_ENTITIES, WEB_API_PROMPT } from "./PowerPagesChatParticipantConstants";
import { IComponentInfo, IPowerPagesChatResult } from "./PowerPagesChatParticipantTypes";
import * as vscode from 'vscode';

export async function getEndpoint(
    orgID: string,
    environmentID: string,
    telemetry: ITelemetry,
    cachedEndpoint: IIntelligenceAPIEndpointInformation | null,
    sessionID: string
): Promise<IIntelligenceAPIEndpointInformation> {
    if (!cachedEndpoint) {
        cachedEndpoint = await ArtemisService.getIntelligenceEndpoint(orgID, telemetry, sessionID, environmentID) as IIntelligenceAPIEndpointInformation; // TODO - add session ID
    }
    return cachedEndpoint;
}

/*
    * Get component info for the active file
    * @returns componentInfo - Entity details for active file (form or list)
*/
export async function getComponentInfo(telemetry: ITelemetry, orgUrl: string | undefined, activeFileParams: IActiveFileParams, sessionID: string): Promise<IComponentInfo> {

    let metadataInfo = { entityName: '', formName: '' };
    let componentInfo: string[] = [];

    if (isEntityInSupportedList(activeFileParams.dataverseEntity)) {
        metadataInfo = await getEntityName(telemetry, sessionID, activeFileParams.dataverseEntity);

        const dataverseToken = (await dataverseAuthentication(telemetry, orgUrl ?? '', true)).accessToken;

        if (activeFileParams.dataverseEntity == ADX_ENTITYFORM) {
            const formColumns = await getFormXml(metadataInfo.entityName, metadataInfo.formName, orgUrl ?? '', dataverseToken, telemetry, sessionID);
            componentInfo = formColumns;
        } else {
            const entityColumns = await getEntityColumns(metadataInfo.entityName, orgUrl ?? '', dataverseToken, telemetry, sessionID);
            componentInfo = entityColumns;
        }
    }

    return { componentInfo, entityName: metadataInfo.entityName };
}

export function isEntityInSupportedList(entity: string): boolean {
    return SUPPORTED_ENTITIES.includes(entity);
}

export function createAndReferenceLocation(activeFileUri: vscode.Uri, startLine: number, endLine: number): vscode.Location {

    const positionStart = new vscode.Position(startLine, 0),
          positionEnd = new vscode.Position(endLine, 0),
          activeFileRange = new vscode.Range(positionStart, positionEnd),
          location = new vscode.Location(activeFileUri, activeFileRange);

    return location;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function provideChatParticipantFollowups(result: IPowerPagesChatResult, _context: vscode.ChatContext, _token: vscode.CancellationToken) {
    if (result.metadata.command === STATER_PROMPTS) {
        return [
            { prompt: EXPLAIN_CODE_PROMPT },
            { prompt: WEB_API_PROMPT },
            { prompt: LIST_PROMPT },
            { prompt: FORM_PROMPT }
        ];
    }
}

