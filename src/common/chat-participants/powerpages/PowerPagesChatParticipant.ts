/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { ITelemetry } from '../../../client/telemetry/ITelemetry';
import TelemetryReporter from '@vscode/extension-telemetry';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { ADX_ENTITYFORM, ADX_ENTITYLIST } from '../../copilot/constants';
import { getActiveEditorContent } from '../../Utils';
import { dataverseAuthentication, intelligenceAPIAuthentication } from '../../AuthenticationProvider';
import { ActiveOrgOutput } from '../../../client/pac/PacTypes';
import { orgChangeErrorEvent, orgChangeEvent } from '../../OrgChangeNotifier';
import { getEntityName, getFormXml, getEntityColumns } from '../../copilot/dataverseMetadata';
import { NO_PROMPT_MESSAGE } from './Constants';
import { AUTHENTICATION_FAILED_MSG, COPILOT_NOT_AVAILABLE_MSG, PAC_AUTH_NOT_FOUND, POWERPAGES_CHAT_PARTICIPANT_ID, RESPONSE_AWAITED_MSG } from './PowerPagesChatParticipantConstants';
import { ORG_DETAILS_KEY, handleOrgChangeSuccess, initializeOrgDetails } from '../../OrgHandlerUtils';
import { getEndpoint } from './PowerPagesChatParticipantUtils';
export class PowerPagesChatParticipant {
    private static instance: PowerPagesChatParticipant | null = null;
    private chatParticipant: vscode.ChatParticipant;
    private telemetry: ITelemetry;
    private extensionContext: vscode.ExtensionContext;
    private readonly _pacWrapper?: PacWrapper;
    private isOrgDetailsInitialized = false;
    private readonly _disposables: vscode.Disposable[] = [];
    private cachedEndpoint: { intelligenceEndpoint: string, geoName: string } | null = null;

    private orgID: string | undefined;
    private orgUrl: string | undefined;

    private constructor(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter, pacWrapper?: PacWrapper) {

        this.chatParticipant = createChatParticipant(POWERPAGES_CHAT_PARTICIPANT_ID, this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

        this.telemetry = telemetry;

        this.extensionContext = context;

        this._pacWrapper = pacWrapper;

        this._disposables.push(orgChangeEvent(async (orgDetails: ActiveOrgOutput) => {
            await this.handleOrgChangeSuccess(orgDetails);
        }));

        this._disposables.push(orgChangeErrorEvent(async () => {
            this.extensionContext.globalState.update(ORG_DETAILS_KEY, { orgID: undefined, orgUrl: undefined });
        }));

    }

    public static getInstance(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter, pacWrapper?: PacWrapper) {
        if (!PowerPagesChatParticipant.instance) {
            PowerPagesChatParticipant.instance = new PowerPagesChatParticipant(context, telemetry, pacWrapper);
        }

        return PowerPagesChatParticipant.instance;
    }

    public dispose() {
        this.chatParticipant.dispose();
    }

    private handler: vscode.ChatRequestHandler = async (
        request: vscode.ChatRequest,
        _context: vscode.ChatContext,
        stream: vscode.ChatResponseStream,
        _token: vscode.CancellationToken
    ): Promise<IPowerPagesChatResult> => {
        // Handle chat requests here

        stream.progress(RESPONSE_AWAITED_MSG)

        await this.initializeOrgDetails();

        if (!this.orgID) {
            stream.markdown(PAC_AUTH_NOT_FOUND);
            return {
                metadata: {
                    command: ''
                }
            };
        }

        const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.telemetry, '', this.orgID, true);

        if (!intelligenceApiAuthResponse) {
            stream.markdown(AUTHENTICATION_FAILED_MSG);

            return {
                metadata: {
                    command: '',
                }
            };
        }

        const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;

        const { intelligenceEndpoint, geoName } = await getEndpoint(this.orgID, this.telemetry, this.cachedEndpoint);

        if (!intelligenceEndpoint || !geoName) {
            stream.markdown(COPILOT_NOT_AVAILABLE_MSG)

            return {
                metadata: {
                    command: ''
                }
            };
        }

        if (request.command) {
            //TODO: Handle command scenarios

        } else {

            const userPrompt = request.prompt;

            if (!userPrompt) {

                //TODO: String approval is required
                stream.markdown(NO_PROMPT_MESSAGE);

                return {
                    metadata: {
                        command: ''
                    }
                };
            }

            const { activeFileParams } = getActiveEditorContent();

            let metadataInfo = { entityName: '', formName: '' };
            let componentInfo: string[] = [];


            if (activeFileParams.dataverseEntity == ADX_ENTITYFORM || activeFileParams.dataverseEntity == ADX_ENTITYLIST) {
                metadataInfo = await getEntityName(this.telemetry, '', activeFileParams.dataverseEntity);

                const dataverseToken = (await dataverseAuthentication(this.telemetry, this.orgUrl ?? '', true)).accessToken;

                if (activeFileParams.dataverseEntity == ADX_ENTITYFORM) {
                    const formColumns = await getFormXml(metadataInfo.entityName, metadataInfo.formName, this.orgUrl ?? '', dataverseToken, this.telemetry, 'sessionID');
                    componentInfo = formColumns;
                } else {
                    const entityColumns = await getEntityColumns(metadataInfo.entityName, this.orgUrl ?? '', dataverseToken, this.telemetry, 'sessionID');
                    componentInfo = entityColumns;
                }

            }

            // export async function sendApiRequest(userPrompt: UserPrompt[], activeFileParams: IActiveFileParams, orgID: string, apiToken: string, sessionID: string, entityName: string, entityColumns: string[], telemetry: ITelemetry, aibEndpoint: string | null, geoName: string | null) {}
            const llmResponse = await sendApiRequest([{ displayText: userPrompt, code: '' }], activeFileParams, this.orgID, intelligenceApiToken, '', '', componentInfo, this.telemetry, intelligenceEndpoint, geoName);

            llmResponse.forEach((response: { displayText: string | vscode.MarkdownString; code: string; }) => {
                if (response.displayText) {
                    stream.markdown(response.displayText);
                }
                if (response.code) {
                    stream.markdown('\n```javascript\n' + response.code + '\n```');
                }
                stream.markdown('\n');
            });

        }

        console.log(_token)

        return {
            metadata: {
                command: ''
            }
        };

    };

    private async initializeOrgDetails(): Promise<void> {
        const { orgID, orgUrl } = await initializeOrgDetails(this.isOrgDetailsInitialized, this.extensionContext, this._pacWrapper);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
    }

    private async handleOrgChangeSuccess(orgDetails: ActiveOrgOutput): Promise<void> {
        const { orgID, orgUrl } = handleOrgChangeSuccess(orgDetails, this.extensionContext);
        this.orgID = orgID;
        this.orgUrl = orgUrl;
    }
}
