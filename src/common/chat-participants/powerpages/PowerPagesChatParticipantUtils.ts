/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ADX_ENTITYFORM } from "../../copilot/constants";
import { getEntityColumns, getEntityName, getFormXml } from "../../copilot/dataverseMetadata";
import { IActiveFileParams } from "../../copilot/model";
import { oneDSLoggerWrapper } from "../../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ArtemisService } from "../../services/ArtemisService";
import { authenticateUserInVSCode, dataverseAuthentication } from "../../services/AuthenticationProvider";
import { IIntelligenceAPIEndpointInformation } from "../../services/Interfaces";
import { EditableFileSystemProvider } from "../../utilities/EditableFileSystemProvider";
import { CREATE_SITE_BTN_CMD } from "./commands/create-site/CreateSiteConstants";
import { collectSiteCreationInputs, getUpdatedPageContent } from "./commands/create-site/CreateSiteHelper";
import { SUPPORTED_ENTITIES, EXPLAIN_CODE_PROMPT, FORM_PROMPT, LIST_PROMPT, LOGIN_BTN_CMD, STATER_PROMPTS, WEB_API_PROMPT } from "./PowerPagesChatParticipantConstants";
import { VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO_FEEDBACK_THUMBSUP, VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO_FEEDBACK_THUMBSDOWN } from "./PowerPagesChatParticipantTelemetryConstants";
import { IComponentInfo, IPowerPagesChatResult } from "./PowerPagesChatParticipantTypes";
import * as vscode from 'vscode';

export async function getEndpoint(
    orgID: string,
    environmentID: string,
    sessionID: string,
    websiteID: string | null = null
): Promise<IIntelligenceAPIEndpointInformation> {

    const cachedEndpoint = await ArtemisService.getIntelligenceEndpoint(orgID, sessionID, environmentID, websiteID) as IIntelligenceAPIEndpointInformation;

    return cachedEndpoint;
}

/*
    * Get component info for the active file
    * @returns componentInfo - Entity details for active file (form or list)
*/
export async function getComponentInfo(orgUrl: string | undefined, activeFileParams: IActiveFileParams, sessionID: string): Promise<IComponentInfo> {

    let metadataInfo = { entityName: '', formName: '' };
    let componentInfo: string[] = [];

    if (isEntityInSupportedList(activeFileParams.dataverseEntity)) {
        metadataInfo = await getEntityName(sessionID, activeFileParams.dataverseEntity);

        const dataverseToken = (await dataverseAuthentication(orgUrl ?? '', true)).accessToken;

        if (activeFileParams.dataverseEntity == ADX_ENTITYFORM) {
            const formColumns = await getFormXml(metadataInfo.entityName, metadataInfo.formName, orgUrl ?? '', dataverseToken, sessionID);
            componentInfo = formColumns;
        } else {
            const entityColumns = await getEntityColumns(metadataInfo.entityName, orgUrl ?? '', dataverseToken, sessionID);
            componentInfo = entityColumns;
        }
    }

    return { componentInfo, entityName: metadataInfo.entityName };
}

export function isEntityInSupportedList(entity: string): boolean {
    return SUPPORTED_ENTITIES.includes(entity);
}

export function handleChatParticipantFeedback(feedback: vscode.ChatResultFeedback, sessionId: string) {
    const scenario = feedback.result.metadata?.scenario;
    const orgId = feedback.result.metadata?.orgId;
    if (feedback.kind === 1) {
        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO_FEEDBACK_THUMBSUP, { feedback: feedback.kind.toString(), scenario: scenario, orgId: orgId, sessionId: sessionId });
    } else if (feedback.kind === 0) {
        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_SCENARIO_FEEDBACK_THUMBSDOWN, { feedback: feedback.kind.toString(), scenario: scenario, orgId: orgId, sessionId: sessionId });
    }
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

export function createErrorResult(message: string, scenario: string, orgId: string): IPowerPagesChatResult {
    return {
        metadata: {
            command: '',
            scenario: scenario,
            orgId: orgId
        },
        errorDetails: {
            message: message
        }
    };
}

export function createSuccessResult(command: string, scenario: string, orgId: string): IPowerPagesChatResult {
    return {
        metadata: {
            command: command,
            scenario: scenario,
            orgId: orgId
        }
    };
}

export function removeChatVariables(userPrompt: string): string {
    const variablesToRemove = [
        '#editor',
        '#selection',
        '#terminalLastCommand',
        '#terminalSelection',
        '#vscodeAPI'
    ];

    const regex = new RegExp(variablesToRemove.join('|'), 'g');

    return userPrompt.replace(regex, '').trim();
}

export function registerButtonCommands() {
    vscode.commands.registerCommand(CREATE_SITE_BTN_CMD, async (siteName: string, sitePages, envList, contentProvider: EditableFileSystemProvider, isCreateSiteInputsReceived) => {
        if (!isCreateSiteInputsReceived) {
            //Update Page Content will be used for the site creation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sitePages.map((page: any) => {
                return {
                    ...page,
                    code: getUpdatedPageContent(contentProvider, page.metadata.pageTitle)
                }
            });
            const siteCreateInputs = await collectSiteCreationInputs(siteName, envList);
            if (siteCreateInputs) {
                isCreateSiteInputsReceived = true;
            }
        }
    });

    // Register the login button command
    vscode.commands.registerCommand(LOGIN_BTN_CMD, async () => {
        await authenticateUserInVSCode();
    });
}
