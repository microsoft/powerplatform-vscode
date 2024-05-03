/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import * as vscode from "vscode";
import * as fs from 'fs';
import * as YAML from 'yaml';
import { sendApiRequest } from "./IntelligenceApiService";
import { dataverseAuthentication, intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";
import { v4 as uuidv4 } from 'uuid'
import { PacWrapper } from "../../client/pac/PacWrapper";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { AUTH_CREATE_FAILED, AUTH_CREATE_MESSAGE, AuthProfileNotFound, COPILOT_UNAVAILABLE, CopilotDisclaimer, CopilotStylePathSegments, DataverseEntityNameMap, EXPLAIN_CODE, EntityFieldMap, FieldTypeMap, PAC_SUCCESS, SELECTED_CODE_INFO, SELECTED_CODE_INFO_ENABLED, UserPrompt, WebViewMessage, sendIconSvg } from "./constants";
import { IActiveFileParams, IActiveFileData, IOrgInfo } from './model';
import { escapeDollarSign, getLastThreePartsOfFileName, getNonce, getSelectedCode, getSelectedCodeLineRange, getUserName, openWalkthrough, showConnectedOrgMessage, showInputBoxAndGetOrgUrl, showProgressWithNotification } from "../Utils";
import { CESUserFeedback } from "./user-feedback/CESSurvey";
import { GetAuthProfileWatchPattern } from "../../client/lib/AuthPanelView";
import { ActiveOrgOutput } from "../../client/pac/PacTypes";
import { CopilotWalkthroughEvent, CopilotCopyCodeToClipboardEvent, CopilotInsertCodeToEditorEvent, CopilotLoadedEvent, CopilotOrgChangedEvent, CopilotUserFeedbackThumbsDownEvent, CopilotUserFeedbackThumbsUpEvent, CopilotUserPromptedEvent, CopilotCodeLineCountEvent, CopilotClearChatEvent, CopilotNotAvailable, CopilotExplainCode, CopilotExplainCodeSize } from "./telemetry/telemetryConstants";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import { INTELLIGENCE_SCOPE_DEFAULT, PROVIDER_ID } from "../../web/client/common/constants";
import { getIntelligenceEndpoint } from "../ArtemisService";
import TelemetryReporter from "@vscode/extension-telemetry";
import { getEntityColumns, getEntityName } from "./dataverseMetadata";
import { COPILOT_STRINGS } from "./assets/copilotStrings";
import { isWithinTokenLimit, encode } from "gpt-tokenizer";
import { FORM_CREATE_PROMPT, FORM_CUSTOMIZATION_API_PROMPT, FORM_VALIDATION_PROMPT, PAC_CLI_PROMPT, WEBPAGE_CREATE_PROMPT, WEB_API_PROMPT } from "./assets/powerpages-constants";

let intelligenceApiToken: string;
let userID: string; // Populated from PAC or intelligence API
let userName: string; // Populated from intelligence API
let sessionID: string; // Generated per session

let orgID: string;
let environmentName: string;
let activeOrgUrl: string;
let tenantId: string | undefined;

declare const IS_DESKTOP: string | undefined;
//TODO: Check if it can be converted to singleton
export class PowerPagesCopilot implements vscode.WebviewViewProvider {
    public static readonly viewType = "powerpages.copilot";
    private _view?: vscode.WebviewView;
    private readonly _pacWrapper?: PacWrapper;
    private _extensionContext: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];
    private loginButtonRendered = false;
    private telemetry: ITelemetry;
    private aibEndpoint: string | null = null;
    private geoName: string | null = null;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        _context: vscode.ExtensionContext,
        telemetry: ITelemetry | TelemetryReporter,
        pacWrapper?: PacWrapper,
        orgInfo?: IOrgInfo) {
        this.telemetry = telemetry;
        this._extensionContext = _context;
        sessionID = uuidv4();
        this._pacWrapper = pacWrapper;

        this._disposables.push(
            vscode.commands.registerCommand("powerpages.copilot.clearConversation", () => {
                if (userName && orgID) {
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotClearChatEvent, copilotSessionId: sessionID, orgId: orgID });
                    this.sendMessageToWebview({ type: "clearConversation" });
                    sessionID = uuidv4();
                }
            }
            )
        );

        if (SELECTED_CODE_INFO_ENABLED) { //TODO: Remove this check once the feature is ready

            const handleSelectionChange = async (commandType: string) => {
                const editor = vscode.window.activeTextEditor;
                if (!editor) {
                    return;
                }
                const selectedCode = getSelectedCode(editor);
                const selectedCodeLineRange = getSelectedCodeLineRange(editor);
                if (commandType === EXPLAIN_CODE && selectedCode.length === 0) {
                    // Show a message if the selection is empty and don't send the message to webview
                    vscode.window.showInformationMessage(vscode.l10n.t('Selection is empty.'));
                    return;
                }
                const withinTokenLimit = isWithinTokenLimit(selectedCode, 1000);
                if (commandType === EXPLAIN_CODE) {
                    const tokenSize = encode(selectedCode).length;
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotExplainCodeSize, copilotSessionId: sessionID, orgId: orgID, codeLineCount: String(selectedCodeLineRange.end - selectedCodeLineRange.start), tokenSize: String(tokenSize) });
                    if (withinTokenLimit === false) {
                        return;
                    }
                }
                this.sendMessageToWebview({ type: commandType, value: { start: selectedCodeLineRange.start, end: selectedCodeLineRange.end, selectedCode: selectedCode, tokenSize: withinTokenLimit } });
            };

            this._disposables.push(
                vscode.window.onDidChangeTextEditorSelection(() => handleSelectionChange(SELECTED_CODE_INFO)), vscode.window.onDidChangeActiveTextEditor(() => handleSelectionChange(SELECTED_CODE_INFO))
            );

            this._disposables.push(
                vscode.commands.registerCommand("powerpages.copilot.explain", () => { sendTelemetryEvent(this.telemetry, { eventName: CopilotExplainCode, copilotSessionId: sessionID, orgId: orgID }); this.show(); handleSelectionChange(EXPLAIN_CODE) })
            );
        }

        if (this._pacWrapper) {
            this.setupFileWatcher();
        }

        if (orgInfo) {
            orgID = orgInfo.orgId;
            environmentName = orgInfo.environmentName;
            activeOrgUrl = orgInfo.activeOrgUrl;
            tenantId = orgInfo.tenantId;
        }
    }



    private async githubCopilot() {
        // Define a Teams chat agent handler.
        const generateResult = {};
        const pacResult = {};

        interface IPowerPagesChatResult extends vscode.ChatResult {
            metadata: {
                command: string;
            }
        }

        const LANGUAGE_MODEL_ID = 'copilot-gpt-3.5-turbo'; // Use faster model. Alternative is 'copilot-gpt-4', which is slower but more powerful

        // Define a Cat chat handler.
        const handler: vscode.ChatRequestHandler = async (request: vscode.ChatRequest, context: vscode.ChatContext, stream: vscode.ChatResponseStream, token: vscode.CancellationToken): Promise<IPowerPagesChatResult> => {
            if (this.isValidSubCommand(request.command ?? "")) {
                stream.progress('Working on it...');
                //const topic = getTopic(context.history);
                // const messages = [
                //     new vscode.LanguageModelChatSystemMessage(await this.getPromptMessage(request.command ?? "")),
                //     new vscode.LanguageModelChatUserMessage(request.prompt),
                // ];
                // const chatResponse = await vscode.lm.sendChatRequest(LANGUAGE_MODEL_ID, messages, {}, token);
                // for await (const fragment of chatResponse.stream) {
                //     stream.markdown(fragment);
                // }

               // const aibResponse = await sendApiRequest([{ displayText: request.prompt, code: '' }], this.getActiveEditorContent().activeFileParams, orgID, intelligenceApiToken, sessionID, '', [], this.telemetry, this.aibEndpoint);
               // const codeBlock = aibResponse[0].code.replace(/\n\n/g, '\n');
                const renderString = "This is a string I want to render as codeblock"
                const markdownCodeBlock = '\\`\\`\\`typescript\n' + renderString + '\n\\`\\`\\`';
                // stream.markdown(aibResponse[0].displayText);
                stream.markdown(`\n\`\`\`typescript
                const myStack = new Stack();
                myStack.push(1); // pushing a number on the stack (or let's say, adding a fish to the stack)
                myStack.push(2); // adding another fish (number 2)
                console.log(myStack.pop()); // eating the top fish, will output: 2
                \`\`\`
                So remember, Code Kitten, in a stack, the last fish in is the first fish out - which we tech cats call LIFO (Last In, First Out).`);
                // stream.markdown(markdownCodeBlock);
                // stream.button({
                //     command: 'teach',
                //     title: vscode.l10n.t('Use Cat Names in Editor')
                // });

                if (this.needsActiveEditorChanges(request.command ?? "")) {
                    const activeEditor = vscode.window.activeTextEditor;

                    if (activeEditor) {
                        const document = activeEditor.document;
                        const uri = document.uri;
                        stream.reference(uri);
                    }
                }

                return { metadata: { command: request.command ?? '' } };
            } else {
                return { metadata: { command: request.command ?? '' } };
            }

        };

        // Define a custom variable resolver.
        const customVariableResolver: vscode.ChatVariableResolver = {
            resolve(name, context, token) {
                // Implement your variable resolution logic here
                // You should return an array of ChatVariableValue objects
                // based on the provided 'name', 'context', and 'token'.

                const values: vscode.ChatVariableValue[] = [
                    {
                        level: vscode.ChatVariableLevel.Full,
                        value: 'Your variable value (required)',
                        description: 'Your variable description (optional)',
                    },
                    // Add more values if needed
                ];

                return values;
            },
        };

        // Chat participants appear as top-level options in the chat input
        // when you type `@`, and can contribute sub-commands in the chat input
        // that appear when you type `/`.
        const powerpages = vscode.chat.createChatParticipant('powerpages', handler);
        powerpages.isSticky = true; // powerpages is persistant, whenever a user starts interacting with @powerpages, @powerpages will automatically be added to the following messages
        powerpages.iconPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'common', 'copilot', 'assets', 'icons', 'copilot.png');
        powerpages.followupProvider = {
            provideFollowups(result: IPowerPagesChatResult, context: vscode.ChatContext, token: vscode.CancellationToken) {
                return [{
                    prompt: 'Create a webpage for world-cup',
                    label: vscode.l10n.t('Create a webpage'),
                    command: 'create-webpage'
                } satisfies vscode.ChatFollowup];
            }
        };

        this._extensionContext.subscriptions.push(powerpages);

        this._disposables.push(
            powerpages,
            // Register the command handler for the /generate Create Project followup
        );

    }

    private isValidSubCommand(subCommand: string) {
        return subCommand === 'form-validation' || subCommand === 'web-api' || subCommand === 'create-webpage' || subCommand === 'pac' || subCommand === 'add-form' || subCommand === 'form-customization';
    }

    private async getPromptMessage(scenario: string) {
        let entityName = "";
        let entityColumns: string[] = [];

        switch (scenario) {
            case 'form-validation':
                ({ entityName, entityColumns } = await this.getEntityNameAndColumns());
                return FORM_VALIDATION_PROMPT.replace("{{targetEntity}}", entityName).replace("{{targetColumns}}", entityColumns.join(", "));
            case 'web-api':
                return WEB_API_PROMPT;
            case 'create-webpage':
                return WEBPAGE_CREATE_PROMPT;
            case 'add-form':
                return FORM_CREATE_PROMPT.replace("{{targetEntityForm}}", await this.getEntityFormNames()).replace("{{targetAdvancedForm}}", await this.getEntityFormNames(false));
            case 'form-customization':
                ({ entityName, entityColumns } = await this.getEntityNameAndColumns());
                return FORM_CUSTOMIZATION_API_PROMPT.replace("{{targetEntity}}", entityName).replace("{{targetColumns}}", entityColumns.join(", "));
            default:
                return '';
        }
    }

    private async getEntityNameAndColumns() {
        const { activeFileParams } = this.getActiveEditorContent();

        let entityName = "";
        let entityColumns: string[] = [];

        if (activeFileParams.dataverseEntity == "adx_entityform" || activeFileParams.dataverseEntity == 'adx_entitylist') {
            entityName = await getEntityName(this.telemetry, sessionID, activeFileParams.dataverseEntity);

            const dataverseToken = await dataverseAuthentication(activeOrgUrl, true);

            entityColumns = await getEntityColumns(entityName, activeOrgUrl, dataverseToken, this.telemetry, sessionID);
        }

        return { entityName, entityColumns };
    }

    private async getEntityFormNames(isEntityForm = true) {
        const formNames: string[] = [];
        const files = await vscode.workspace.findFiles(`**/${isEntityForm ? "basic-forms" : "advanced-forms"}/**/${isEntityForm ? "*.yml" : "*.advancedform.yml"}`);

        files.forEach(file => {
            const name = this.getEntityNameFromYml(file.path)
            if (name) {
                formNames.push(name);
            }
        });
        return formNames.join(", ");

    }

    private getEntityNameFromYml(uriPath: string): string | undefined {
        try {
            const uri = vscode.Uri.file(uriPath);
            const fileContents = fs.readFileSync(uri.fsPath, 'utf8');
            const parsedFileContents = YAML.parse(fileContents);
            return parsedFileContents['adx_name']

        } catch (e) {
            // Do nothing
        }
    }

    private needsActiveEditorChanges(scenario: string) {
        return scenario === 'form-validation' || scenario === 'create-webpage' || scenario === 'add-form';
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }

    private setupFileWatcher() {
        const watchPath = GetAuthProfileWatchPattern();
        if (watchPath) {
            const watcher = vscode.workspace.createFileSystemWatcher(watchPath);
            this._disposables.push(
                watcher,
                watcher.onDidChange(() => this.handleOrgChange()),
                watcher.onDidCreate(() => this.handleOrgChange()),
                watcher.onDidDelete(() => this.handleOrgChange())
            );
        }
    }

    private async handleOrgChange() {
        orgID = '';
        const pacOutput = await this._pacWrapper?.activeOrg();

        if (pacOutput && pacOutput.Status === PAC_SUCCESS) {
            this.handleOrgChangeSuccess(pacOutput.Results);
        } else if (this._view?.visible) {

            if (pacOutput && pacOutput.Status === PAC_SUCCESS) {
                this.handleOrgChangeSuccess(pacOutput.Results);
            } else if (this._view?.visible) {

                const userOrgUrl = await showInputBoxAndGetOrgUrl();
                if (!userOrgUrl) {
                    return;
                }
                const pacAuthCreateOutput = await showProgressWithNotification(vscode.l10n.t(AUTH_CREATE_MESSAGE), async () => { return await this._pacWrapper?.authCreateNewAuthProfileForOrg(userOrgUrl) });
                if (pacAuthCreateOutput && pacAuthCreateOutput.Status !== PAC_SUCCESS) {
                    vscode.window.showErrorMessage(AUTH_CREATE_FAILED); // TODO: Provide Experience to create auth profile
                    return;
                }
            }
        }
    }

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        context: vscode.WebviewViewResolveContext,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;

        webviewView.title = "Copilot In Power Pages" + (IS_DESKTOP ? "" : " [PREVIEW]");
        webviewView.description = "PREVIEW";
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        const pacOutput = await this._pacWrapper?.activeOrg();

        if (SELECTED_CODE_INFO_ENABLED) {
            vscode.commands.executeCommand('setContext', 'powerpages.copilot.isVisible', true);
        }

        if (pacOutput && pacOutput.Status === PAC_SUCCESS) {
            await this.handleOrgChangeSuccess(pacOutput.Results);
        } else if (!IS_DESKTOP && orgID && activeOrgUrl) {
            await this.handleOrgChangeSuccess({ OrgId: orgID, UserId: userID, OrgUrl: activeOrgUrl } as ActiveOrgOutput);
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "webViewLoaded": {
                    // Send the localized strings to the copilot webview
                    this.sendMessageToWebview({ type: 'copilotStrings', value: COPILOT_STRINGS })
                    if (this.aibEndpoint === COPILOT_UNAVAILABLE) {
                        this.sendMessageToWebview({ type: 'Unavailable' });
                        return;
                    }

                    sendTelemetryEvent(this.telemetry, { eventName: CopilotLoadedEvent, copilotSessionId: sessionID, orgId: orgID });
                    this.sendMessageToWebview({ type: 'env' }); //TODO Use IS_DESKTOP
                    await this.checkAuthentication();
                    if (orgID && userName) {
                        this.sendMessageToWebview({ type: 'isLoggedIn', value: true });
                        this.sendMessageToWebview({ type: 'userName', value: userName });
                    } else {
                        this.sendMessageToWebview({ type: 'isLoggedIn', value: false });
                        this.loginButtonRendered = true;
                    }
                    this.sendMessageToWebview({ type: "welcomeScreen" });
                    break;
                }
                case "login": {
                    this.handleLogin();
                    break;
                }
                case "newUserPrompt": {
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotUserPromptedEvent, copilotSessionId: sessionID, aibEndpoint: this.aibEndpoint ?? '', orgId: orgID, isSuggestedPrompt: String(data.value.isSuggestedPrompt) }); //TODO: Add active Editor info
                    orgID
                        ? (async () => {
                            const { activeFileParams } = this.getActiveEditorContent();
                            await this.authenticateAndSendAPIRequest(data.value.userPrompt, activeFileParams, orgID, this.telemetry);
                        })()
                        : (() => {
                            this.sendMessageToWebview({ type: 'apiResponse', value: AuthProfileNotFound });
                            this.handleOrgChange();
                            this.sendMessageToWebview({ type: 'enableInput' });
                        })();

                    break;
                }
                case "insertCode": {

                    const escapedSnippet = escapeDollarSign(data.value);

                    vscode.window.activeTextEditor?.insertSnippet(
                        new vscode.SnippetString(`${escapedSnippet}`)
                    );
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotInsertCodeToEditorEvent, copilotSessionId: sessionID, orgId: orgID });
                    break;
                }
                case "copyCodeToClipboard": {

                    vscode.env.clipboard.writeText(data.value);
                    vscode.window.showInformationMessage(vscode.l10n.t('Copied to clipboard!'))
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotCopyCodeToClipboardEvent, copilotSessionId: sessionID, orgId: orgID });
                    break;
                }
                case "clearChat": {

                    sessionID = uuidv4();
                    break;
                }
                case "userFeedback": {

                    if (data.value === "thumbsUp") {

                        sendTelemetryEvent(this.telemetry, { eventName: CopilotUserFeedbackThumbsUpEvent, copilotSessionId: sessionID, orgId: orgID });
                        CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsUp", this.telemetry, this.geoName as string, tenantId)
                    } else if (data.value === "thumbsDown") {

                        sendTelemetryEvent(this.telemetry, { eventName: CopilotUserFeedbackThumbsDownEvent, copilotSessionId: sessionID, orgId: orgID });
                        CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsDown", this.telemetry, this.geoName as string, tenantId)
                    }
                    break;
                }
                case "walkthrough": {
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotWalkthroughEvent, copilotSessionId: sessionID, orgId: orgID });
                    openWalkthrough(this._extensionUri);
                    break;
                }
                case "codeLineCount": {
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotCodeLineCountEvent, copilotSessionId: sessionID, codeLineCount: String(data.value), orgId: orgID });
                    break;
                }
            }
        });
    }

    public show() {
        if (this._view) {
            // Show the webview view
            this._view.show(true);
        }
    }

    private async handleLogin() {

        const pacOutput = await this._pacWrapper?.activeOrg();
        if (pacOutput && pacOutput.Status === PAC_SUCCESS) {
            this.handleOrgChangeSuccess.call(this, pacOutput.Results);

            intelligenceAPIAuthentication(this.telemetry, sessionID, orgID).then(({ accessToken, user, userId }) => {
                this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user, userId);
            });

        } else if (this._view?.visible) {

            const userOrgUrl = await showInputBoxAndGetOrgUrl();
            if (!userOrgUrl) {
                this.sendMessageToWebview({ type: 'isLoggedIn', value: false });

                if (!this.loginButtonRendered) {
                    this.sendMessageToWebview({ type: "welcomeScreen" });
                    this.loginButtonRendered = true; // Set the flag to indicate that the login button has been rendered
                }

                return;
            }
            const pacAuthCreateOutput = await showProgressWithNotification(AUTH_CREATE_MESSAGE, async () => { return await this._pacWrapper?.authCreateNewAuthProfileForOrg(userOrgUrl) });
            pacAuthCreateOutput && pacAuthCreateOutput.Status === PAC_SUCCESS
                ? intelligenceAPIAuthentication(this.telemetry, sessionID, orgID).then(({ accessToken, user, userId }) =>
                    this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user, userId)
                )
                : vscode.window.showErrorMessage(AUTH_CREATE_FAILED);


        }
    }

    private async checkAuthentication() {
        const session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });
        if (session) {
            intelligenceApiToken = session.accessToken;
            userName = getUserName(session.account.label);
            userID = session?.account.id.split("/").pop() ??
                session?.account.id;
        } else {
            intelligenceApiToken = "";
            userName = "";
        }
    }

    private async authenticateAndSendAPIRequest(data: UserPrompt[], activeFileParams: IActiveFileParams, orgID: string, telemetry: ITelemetry) {
        return intelligenceAPIAuthentication(telemetry, sessionID, orgID)
            .then(async ({ accessToken, user, userId }) => {
                intelligenceApiToken = accessToken;
                userName = getUserName(user);
                userID = userId;

                this.sendMessageToWebview({ type: 'userName', value: userName });

                let entityName = "";
                let entityColumns: string[] = [];

                if (activeFileParams.dataverseEntity == "adx_entityform" || activeFileParams.dataverseEntity == 'adx_entitylist') {
                    entityName = await getEntityName(telemetry, sessionID, activeFileParams.dataverseEntity);

                    const dataverseToken = await dataverseAuthentication(activeOrgUrl, true);

                    entityColumns = await getEntityColumns(entityName, activeOrgUrl, dataverseToken, telemetry, sessionID);
                }
                return sendApiRequest(data, activeFileParams, orgID, intelligenceApiToken, sessionID, entityName, entityColumns, telemetry, this.aibEndpoint);
            })
            .then(apiResponse => {
                this.sendMessageToWebview({ type: 'apiResponse', value: apiResponse });
                this.sendMessageToWebview({ type: 'enableInput' });
            });
    }


    private async handleOrgChangeSuccess(activeOrg: ActiveOrgOutput) {
        if (IS_DESKTOP && orgID === activeOrg.OrgId) {
            return;
        }

        orgID = activeOrg.OrgId;
        environmentName = activeOrg.FriendlyName;
        userID = activeOrg.UserId;
        activeOrgUrl = activeOrg.OrgUrl;

        sessionID = uuidv4(); // Generate a new session ID on org change
        sendTelemetryEvent(this.telemetry, { eventName: CopilotOrgChangedEvent, copilotSessionId: sessionID, orgId: orgID });

        const { intelligenceEndpoint, geoName } = await getIntelligenceEndpoint(orgID, this.telemetry, sessionID);
        this.aibEndpoint = intelligenceEndpoint;
        this.geoName = geoName;

        if (this.aibEndpoint === COPILOT_UNAVAILABLE) {
            sendTelemetryEvent(this.telemetry, { eventName: CopilotNotAvailable, copilotSessionId: sessionID, orgId: orgID });
            this.sendMessageToWebview({ type: 'Unavailable' });
        } else {
            this.sendMessageToWebview({ type: 'Available' });
        }

        if (IS_DESKTOP && this._view?.visible) {
            showConnectedOrgMessage(environmentName, activeOrgUrl);
        }

        await this.githubCopilot();
    }

    private async intelligenceAPIAuthenticationHandler(accessToken: string, user: string, userId: string) {
        if (accessToken && user) {
            intelligenceApiToken = accessToken;
            userName = getUserName(user);
            userID = userId;

            this.sendMessageToWebview({ type: 'isLoggedIn', value: true })
            this.sendMessageToWebview({ type: 'userName', value: userName });
            this.sendMessageToWebview({ type: "welcomeScreen" });
        }
    }

    private getActiveEditorContent(): IActiveFileData {
        const activeEditor = vscode.window.activeTextEditor;
        const activeFileData: IActiveFileData = {
            activeFileContent: '',
            activeFileParams: {
                dataverseEntity: '',
                entityField: '',
                fieldType: ''
            } as IActiveFileParams
        };
        if (activeEditor) {
            const document = activeEditor.document;
            const fileName = document.fileName;
            const relativeFileName = vscode.workspace.asRelativePath(fileName);

            const activeFileParams: string[] = getLastThreePartsOfFileName(relativeFileName);

            activeFileData.activeFileContent = document.getText();
            activeFileData.activeFileParams.dataverseEntity = DataverseEntityNameMap.get(activeFileParams[0]) || "";
            activeFileData.activeFileParams.entityField = EntityFieldMap.get(activeFileParams[1]) || "";
            activeFileData.activeFileParams.fieldType = FieldTypeMap.get(activeFileParams[2]) || "";
        }

        return activeFileData;
    }

    public sendMessageToWebview(message: WebViewMessage) {
        if (this._view) {
            this._view.webview.postMessage(message);
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const copilotScriptPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'common', 'copilot', 'assets', 'scripts', 'copilot.js');
        const copilotScriptUri = webview.asWebviewUri(copilotScriptPath);

        const copilotStylePath = vscode.Uri.joinPath(
            this._extensionUri,
            ...CopilotStylePathSegments
        );
        const copilotStyleUri = webview.asWebviewUri(copilotStylePath);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        //TODO: Add CSP
        return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
          <meta charset="UTF-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${copilotStyleUri}" rel="stylesheet">
          </link>
          <title>Chat View</title>
        </head>

        <body>
          <div class="copilot-window">

            <div class="chat-messages" id="chat-messages">
              <div id="copilot-header"></div>
            </div>

            <div class="chat-input" id="input-component">
              <label for="chat-input" class="input-label hide" id="input-label-id"></label>
              <div class="input-container">
                <input type="text" placeholder="What do you need help with?" id="chat-input" class="input-field">
                <button aria-label="Match Case" id="send-button" class="send-button">
                  <span>
                    ${sendIconSvg}
                  </span>
                </button>
              </div>
              <p class="disclaimer">${CopilotDisclaimer}</p>
            </div>
          </div>

          <script type="module" nonce="${nonce}" src="${copilotScriptUri}"></script>
        </body>

        </html>`;
    }
}
