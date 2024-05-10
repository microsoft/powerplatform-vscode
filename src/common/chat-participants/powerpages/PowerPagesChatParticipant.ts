/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { createChatParticipant } from '../ChatParticipantUtils';
import { IPowerPagesChatResult } from './PowerPagesChatParticipantTypes';
import { ITelemetry } from '../../../client/telemetry/ITelemetry';
import TelemetryReporter from '@vscode/extension-telemetry';
import { getIntelligenceEndpoint } from '../../ArtemisService';
import { sendApiRequest } from '../../copilot/IntelligenceApiService';
import { PacWrapper } from '../../../client/pac/PacWrapper';
import { ADX_ENTITYFORM, ADX_ENTITYLIST, COPILOT_UNAVAILABLE, PAC_SUCCESS } from '../../copilot/constants';
import { createAuthProfileExp, getActiveEditorContent } from '../../Utils';
import { dataverseAuthentication, intelligenceAPIAuthentication } from '../../AuthenticationProvider';
import { ActiveOrgOutput } from '../../../client/pac/PacTypes';
import { orgChangeErrorEvent, orgChangeEvent } from '../../OrgChangeNotifier';
import { getEntityName, getFormXml, getEntityColumns } from '../../copilot/dataverseMetadata';
import { NO_PROMPT_MESSAGE } from './Constants';
import { MultiStepInput } from '../../../client/power-pages/create/utils/MultiStepInput';

export interface OrgDetails {
    orgID: string;
    orgUrl: string;
}

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
    private orgUrl = '';

    private constructor(context: vscode.ExtensionContext, telemetry: ITelemetry | TelemetryReporter, pacWrapper?: PacWrapper) {

        this.chatParticipant = createChatParticipant('powerpages', this.handler);

        //TODO: Check the icon image
        this.chatParticipant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'common', 'chat-participants', 'powerpages', 'assets', 'copilot.png');

        this.telemetry = telemetry;

        this.extensionContext = context;

        this._pacWrapper = pacWrapper;

        this._disposables.push(orgChangeEvent(async (orgDetails: ActiveOrgOutput) => {
            await this.handleOrgChangeSuccess(orgDetails);
        }));

        this._disposables.push(orgChangeErrorEvent(async () => {
            await createAuthProfileExp(this._pacWrapper);
        }));

        vscode.commands.registerCommand('create-site-inputs', async (siteName: string, isCreateSiteInputsReceived) => {
            if (!isCreateSiteInputsReceived) {
                const siteCreateInputs = await this.getSiteCreationInputs(siteName);
                if(siteCreateInputs){
                    isCreateSiteInputsReceived = true;
                }
            }
        });

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

        stream.progress('Working on it...')

        await this.intializeOrgDetails();

        if (!this.orgID) {
            // TODO: Auth Create Experience using button
            await createAuthProfileExp(this._pacWrapper);
            return {
                metadata: {
                    command: ''
                }
            };
        }

        const intelligenceApiAuthResponse = await intelligenceAPIAuthentication(this.telemetry, '', this.orgID, true);

        if (!intelligenceApiAuthResponse) {

            //TODO: Handle auth error and provide a way to re-authenticate

            return {
                metadata: {
                    command: '',
                }
            };
        }

        const intelligenceApiToken = intelligenceApiAuthResponse.accessToken;

        const { intelligenceEndpoint, geoName } = await this.getEndpoint(this.orgID, this.telemetry);

        const endpointAvailabilityResult = this.handleEndpointAvailability(intelligenceEndpoint, geoName);

        if (endpointAvailabilityResult !== '') {
            return endpointAvailabilityResult;
        }

        if (request.command) {
            //TODO: Handle command scenarios
            if(request.command == 'create-site')
            {
                stream.progress('Generating a new Power Pages site...');

                stream.markdown('Below is the markdown content for the new Power Pages site. You can copy this content and paste it in the markdown file to create a new Power Pages site.');



                stream.button({
                    command: 'create-site-inputs',
                    title: 'Create Site',
                    tooltip: 'Create a new Power Pages site',
                    arguments: ['siteName', false],
                })

                 // register command

            }

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

                const dataverseToken = (await dataverseAuthentication(this.telemetry, this.orgUrl, true)).accessToken;

                if (activeFileParams.dataverseEntity == ADX_ENTITYFORM) {
                    const formColumns = await getFormXml(metadataInfo.entityName, metadataInfo.formName, this.orgUrl, dataverseToken, this.telemetry, 'sessionID');
                    componentInfo = formColumns;
                } else {
                    const entityColumns = await getEntityColumns(metadataInfo.entityName, this.orgUrl, dataverseToken, this.telemetry, 'sessionID');
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

    private async intializeOrgDetails(): Promise<void> {

        if (this.isOrgDetailsInitialized) {
            return;
        }

        this.isOrgDetailsInitialized = true;

        const orgDetails: OrgDetails | undefined = this.extensionContext.globalState.get('orgDetails');

        if (orgDetails) {
            this.orgID = orgDetails.orgID;
            this.orgUrl = orgDetails.orgUrl;
        } else {
            if (this._pacWrapper) {
                const pacActiveOrg = await this._pacWrapper.activeOrg();
                if (pacActiveOrg && pacActiveOrg.Status === PAC_SUCCESS) {
                    this.handleOrgChangeSuccess(pacActiveOrg.Results);
                } else {
                    await createAuthProfileExp(this._pacWrapper);
                }
            }
        }
    }

    private async handleOrgChangeSuccess(orgDetails: ActiveOrgOutput) {
        this.orgID = orgDetails.OrgId;
        this.orgUrl = orgDetails.OrgUrl

        this.extensionContext.globalState.update('orgDetails', { orgID: this.orgID, orgUrl: this.orgUrl });

        //TODO: Handle AIB GEOs

        this.cachedEndpoint = null;
    }

    async getEndpoint(orgID: string, telemetry: ITelemetry) {
        if (!this.cachedEndpoint) {
            this.cachedEndpoint = await getIntelligenceEndpoint(orgID, telemetry, '') as { intelligenceEndpoint: string; geoName: string };
        }
        return this.cachedEndpoint;
    }

    handleEndpointAvailability(intelligenceEndpoint: string, geoName: string) {
        if (!intelligenceEndpoint || !geoName) {
            return {
                metadata: {
                    command: ''
                }
            };
        } else if (intelligenceEndpoint === COPILOT_UNAVAILABLE) {

            //TODO: Handle Copilot Unavailable scenario with response to user
            return {
                metadata: {
                    command: ''
                }
            };
        }

        //TODO: Handle ECS unavailable scenario

        return '' //TODO return type
    }

    async getSiteCreationInputs(siteName: string) {
        const envNames: vscode.QuickPickItem[] = [
            { label: 'EnvONe' },
            { label: 'EnvTwo' },
            { label: 'EnvThree' }
        ];

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
            return (input: MultiStepInput) => inputDomainName(input, state);
        }

        async function inputDomainName(
            input: MultiStepInput,
            state: Partial<ISiteInputState>
        ) {
            state.domainName = await input.showInputBox({
                title,
                step: 3,
                totalSteps: 3,
                value: state.domainName || "",
                placeholder: vscode.l10n.t("Enter Domain Name"),
                validate: async (value) => (value ? undefined : vscode.l10n.t("Domain Name is required")),
            });
        }

        const siteInputState = await collectInputs();
        return siteInputState;
    }

}
