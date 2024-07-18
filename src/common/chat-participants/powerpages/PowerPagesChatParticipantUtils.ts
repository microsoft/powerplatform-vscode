/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { ITelemetry } from '../../OneDSLoggerTelemetry/telemetry/ITelemetry';
import { ADX_ENTITYFORM } from "../../copilot/constants";
import { getEntityColumns, getEntityName, getFormXml } from "../../copilot/dataverseMetadata";
import { IActiveFileParams } from "../../copilot/model";
import { ArtemisService } from "../../services/ArtemisService";
import { dataverseAuthentication } from "../../services/AuthenticationProvider";
import { IIntelligenceAPIEndpointInformation } from "../../services/Interfaces";
import { MultiStepInput } from "../../utilities/MultiStepInput";
import { SUPPORTED_ENTITIES } from "./PowerPagesChatParticipantConstants";
import { IComponentInfo } from "./PowerPagesChatParticipantTypes";



export async function getEndpointInfo(
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

export async function getSiteCreationInputs(siteName: string, envInfo: { envId: string; envDisplayName: string; }[]) {
    const envNames: vscode.QuickPickItem[] = envInfo.map((env) => {
        return {
            label: env.envDisplayName,
            description: env.envId,
        };
    });

    const title = vscode.l10n.t("New Power Pages Site");

    interface ISiteInputState {
        siteName: string;
        envName: string;
        domainName: string;
        title: string;
        step: number;
        totalSteps: number;
    }

    async function collectInputs() {
        const state = {} as Partial<ISiteInputState>;
        await MultiStepInput.run((input) => selectEnvName(input, state));
        return state as ISiteInputState;
    }

    async function selectEnvName(
        input: MultiStepInput,
        state: Partial<ISiteInputState>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 3,
            placeholder: vscode.l10n.t("Choose Environment"),
            items: envNames,
            activeItem:
                typeof state.envName !== "string"
                    ? state.envName
                    : undefined,
        });
        state.envName = pick.label;
        return (input: MultiStepInput) => inputSiteName(input, state);
    }

    async function inputSiteName(
        input: MultiStepInput,
        state: Partial<ISiteInputState>
    ) {
        state.siteName = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 3,
            value: state.siteName || siteName,
            placeholder: vscode.l10n.t("Enter Site Name"),
            validate: async (value) => (value ? undefined : vscode.l10n.t("Site Name is required")),
        });
        //return (input: MultiStepInput) => inputDomainName(input, state);
    }

    // async function inputDomainName(
    //     input: MultiStepInput,
    //     state: Partial<ISiteInputState>
    // ) {
    //     state.domainName = await input.showInputBox({
    //         title,
    //         step: 3,
    //         totalSteps: 3,
    //         value: state.domainName || "",
    //         placeholder: vscode.l10n.t("Enter Domain Name"),
    //         validate: async (value) => (value ? undefined : vscode.l10n.t("Domain Name is required")),
    //     });
    // }

    const siteInputState = await collectInputs();
    return siteInputState;
}

