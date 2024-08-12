/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
import { sendApiRequest } from "./IntelligenceApiService";
import { dataverseAuthentication, getOIDFromToken, intelligenceAPIAuthentication } from "../services/AuthenticationProvider";
import { v4 as uuidv4 } from 'uuid'
import { PacWrapper } from "../../client/pac/PacWrapper";
import { ITelemetry } from "../OneDSLoggerTelemetry/telemetry/ITelemetry";
import { ADX_ENTITYFORM, ADX_ENTITYLIST, AUTH_CREATE_FAILED, AUTH_CREATE_MESSAGE, AuthProfileNotFound, COPILOT_IN_POWERPAGES, COPILOT_UNAVAILABLE, CopilotStylePathSegments, EXPLAIN_CODE, SELECTED_CODE_INFO, SELECTED_CODE_INFO_ENABLED, THUMBS_DOWN, THUMBS_UP, UserPrompt, WebViewMessage, sendIconSvg } from "./constants";
import { IOrgInfo } from './model';
import { checkCopilotAvailability, escapeDollarSign, getActiveEditorContent, getNonce, getSelectedCode, getSelectedCodeLineRange, getUserName, openWalkthrough, showConnectedOrgMessage, showInputBoxAndGetOrgUrl, showProgressWithNotification } from "../utilities/Utils";
import { CESUserFeedback } from "./user-feedback/CESSurvey";
import { ActiveOrgOutput } from "../../client/pac/PacTypes";
import { CopilotWalkthroughEvent, CopilotCopyCodeToClipboardEvent, CopilotInsertCodeToEditorEvent, CopilotLoadedEvent, CopilotOrgChangedEvent, CopilotUserFeedbackThumbsDownEvent, CopilotUserFeedbackThumbsUpEvent, CopilotUserPromptedEvent, CopilotCodeLineCountEvent, CopilotClearChatEvent, CopilotExplainCode, CopilotExplainCodeSize, CopilotNotAvailableECSConfig } from "./telemetry/telemetryConstants";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import TelemetryReporter from "@vscode/extension-telemetry";
import { getEntityColumns, getEntityName, getFormXml } from "./dataverseMetadata";
import { isWithinTokenLimit, encode } from "gpt-tokenizer";
import { orgChangeErrorEvent, orgChangeEvent } from "../../client/OrgChangeNotifier";
import { createAuthProfileExp, getDisabledOrgList, getDisabledTenantList } from "./utils/copilotUtil";
import { INTELLIGENCE_SCOPE_DEFAULT, PROVIDER_ID } from "../services/Constants";
import { ArtemisService } from "../services/ArtemisService";
import { SUCCESS } from "../constants";

let intelligenceApiToken: string;
let userID: string; // Populated from PAC or intelligence API
let userName: string; // Populated from intelligence API
let sessionID: string; // Generated per session

let orgID: string;
let environmentName: string;
let activeOrgUrl: string;
let tenantId: string | undefined;
let environmentId: string;

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
    private crossGeoDataMovementEnabledPPACFlag = false;

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
        this._disposables.push(
            orgChangeEvent((orgDetails: ActiveOrgOutput) => this.handleOrgChangeSuccess(orgDetails))
        );

        if (this._view?.visible) {
            this._disposables.push(orgChangeErrorEvent(async () => await createAuthProfileExp(this._pacWrapper)));
        }

        if (orgInfo) {
            orgID = orgInfo.orgId;
            environmentName = orgInfo.environmentName;
            activeOrgUrl = orgInfo.activeOrgUrl;
            tenantId = orgInfo.tenantId;
            environmentId = orgInfo.environmentId;
        }
    }

    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
    }

    private async handleOrgChange() {
        orgID = '';
        const pacOutput = await this._pacWrapper?.activeOrg();

        if (pacOutput && pacOutput.Status === SUCCESS) {
            this.handleOrgChangeSuccess(pacOutput.Results);
        } else if (this._view?.visible) {
            await createAuthProfileExp(this._pacWrapper)
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

        webviewView.title = vscode.l10n.t(COPILOT_IN_POWERPAGES) + (IS_DESKTOP ? "" : " [PREVIEW]");
        webviewView.description = vscode.l10n.t("PREVIEW");
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        const pacOutput = await this._pacWrapper?.activeOrg();

        if (SELECTED_CODE_INFO_ENABLED) {
            vscode.commands.executeCommand('setContext', 'powerpages.copilot.isVisible', true);
        }

        if (pacOutput && pacOutput.Status === SUCCESS) {
            await this.handleOrgChangeSuccess(pacOutput.Results);
        } else if (!IS_DESKTOP && orgID && activeOrgUrl) {
            await this.handleOrgChangeSuccess({ OrgId: orgID, UserId: userID, OrgUrl: activeOrgUrl, EnvironmentId: environmentId } as ActiveOrgOutput);
        }

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "webViewLoaded": {
                    // end the localized strings to the Copilot webview. They can't be moved to a constant file because they are not being picked for localization.
                    const copilotStrings = {
                        EXPLAIN_CODE_PROMPT: vscode.l10n.t('Explain the following code snippet:'),
                        LARGE_SELECTION: vscode.l10n.t('Selection is too large. Try making a shorter selection.'),
                        FEATURE_NOT_ENABLED_MESSAGE: vscode.l10n.t("Feature is not enabled for this geo."),
                        COPILOT_SUPPORT_MESSAGE: vscode.l10n.t("Hi! Your Microsoft account doesn’t currently support Copilot. Contact your admin for details."),
                        COPY_TO_CLIPBOARD_MESSAGE: vscode.l10n.t("Copy to clipboard"),
                        INSERT_CODE_MESSAGE: vscode.l10n.t("Insert code into editor"),
                        AI_CONTENT_MISTAKES_MESSAGE: vscode.l10n.t("AI-generated content can contain mistakes"),
                        THUMBS_UP_MESSAGE: vscode.l10n.t("Thumbs Up"),
                        THUMBS_DOWN_MESSAGE: vscode.l10n.t("Thumbs Down"),
                        FORM_PROMPT: vscode.l10n.t("Write JavaScript code for form field validation to check phone field value is in the valid format."),
                        WEB_API_PROMPT: vscode.l10n.t("Write web API code to query active contact records."),
                        LIST_PROMPT: vscode.l10n.t("Write JavaScript code to highlight the row where email field is empty in table list."),
                        SUGGESTIONS_MESSAGE: vscode.l10n.t("Here are a few suggestions to get you started"),
                        GETTING_STARTED_MESSAGE: vscode.l10n.t("GETTING STARTED"),
                        LEARN_MORE_MESSAGE: vscode.l10n.t("Learn more about Copilot"),
                        LOGIN_MESSAGE: vscode.l10n.t("Hi! Instantly generate code for Power Pages sites by typing in what you need. To start using Copilot, log in to your Microsoft account."),
                        LOGIN_BUTTON: vscode.l10n.t("Login"),
                        HI: vscode.l10n.t("Hi"),
                        WELCOME_MESSAGE: vscode.l10n.t('In your own words, describe what you need. You can get help with writing code for Power Pages sites in HTML, CSS, and JS languages.'),
                        DOCUMENTATION_LINK: vscode.l10n.t("To know more, see <a href=\"https://go.microsoft.com/fwlink/?linkid=2206366\">Copilot in Power Pages documentation."),
                        WORKING_ON_IT_MESSAGE: vscode.l10n.t("Working on it..."),
                        GITHUB_COPILOT_CHAT: vscode.l10n.t('You can use this in <a href="#" id="github-copilot-link">GitHub Copilot with @powerpages</a> and leverage best of both world.'),
                        NEW_BADGE: vscode.l10n.t("NEW"),
                    };

                    this.sendMessageToWebview({
                        type: 'copilotStrings',
                        value: copilotStrings
                    });

                    if (this.aibEndpoint === COPILOT_UNAVAILABLE) {
                        this.sendMessageToWebview({ type: 'Unavailable' });
                        return;
                    } else if (getDisabledOrgList()?.includes(orgID) || getDisabledTenantList()?.includes(tenantId ?? "")) {
                        sendTelemetryEvent(this.telemetry, { eventName: CopilotNotAvailableECSConfig, copilotSessionId: sessionID, orgId: orgID });
                        this.sendMessageToWebview({ type: 'Unavailable' });
                        return;
                    }

                    sendTelemetryEvent(this.telemetry, { eventName: CopilotLoadedEvent, copilotSessionId: sessionID, orgId: orgID });
                    this.sendMessageToWebview({ type: 'env' });
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
                    sendTelemetryEvent(this.telemetry, { eventName: CopilotUserPromptedEvent, copilotSessionId: sessionID, aibEndpoint: this.aibEndpoint ?? '', orgId: orgID, isSuggestedPrompt: String(data.value.isSuggestedPrompt), crossGeoDataMovementEnabledPPACFlag: this.crossGeoDataMovementEnabledPPACFlag }); //TODO: Add active Editor info
                    orgID
                        ? (async () => {
                            await this.authenticateAndSendAPIRequest(data.value.userPrompt, orgID, this.telemetry);
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

                    const feedbackValue = data.value.feedbackValue;
                    const messageScenario = data.value.messageScenario;

                    if (feedbackValue === THUMBS_UP) {

                        sendTelemetryEvent(this.telemetry, { eventName: CopilotUserFeedbackThumbsUpEvent, copilotSessionId: sessionID, orgId: orgID, subScenario: String(messageScenario) });
                        CESUserFeedback(this._extensionContext, sessionID, userID, THUMBS_UP, this.telemetry, this.geoName as string, messageScenario, tenantId)
                    } else if (feedbackValue === THUMBS_DOWN) {

                        sendTelemetryEvent(this.telemetry, { eventName: CopilotUserFeedbackThumbsDownEvent, copilotSessionId: sessionID, orgId: orgID, subScenario: String(messageScenario) });
                        CESUserFeedback(this._extensionContext, sessionID, userID, THUMBS_DOWN, this.telemetry, this.geoName as string, messageScenario, tenantId)
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
                case "openGitHubCopilotLink": {
                    //Open the GitHub Copilot Chat with @powerpages if GitHub Copilot Chat is installed
                    if(vscode.extensions.getExtension('github.copilot-chat')) {
                        vscode.commands.executeCommand('workbench.action.chat.open', '@powerpages how can you help with coding for my website?');
                    } else {
                        vscode.env.openExternal(vscode.Uri.parse('https://go.microsoft.com/fwlink/?linkid=2276973'));
                    }
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
        if (pacOutput && pacOutput.Status === SUCCESS) {
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
            pacAuthCreateOutput && pacAuthCreateOutput.Status === SUCCESS
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
            userID = getOIDFromToken(session.accessToken, this.telemetry);
        } else {
            intelligenceApiToken = "";
            userName = "";
        }
    }

    private async authenticateAndSendAPIRequest(data: UserPrompt[], orgID: string, telemetry: ITelemetry) {
        return intelligenceAPIAuthentication(telemetry, sessionID, orgID)
            .then(async ({ accessToken, user, userId }) => {
                intelligenceApiToken = accessToken;
                userName = getUserName(user);
                userID = userId;

                this.sendMessageToWebview({ type: 'userName', value: userName });

                const { activeFileContent, activeFileParams } = getActiveEditorContent();

                let metadataInfo = { entityName: '', formName: '' };
                let componentInfo: string[] = [];

                if (activeFileParams.dataverseEntity == ADX_ENTITYFORM || activeFileParams.dataverseEntity == ADX_ENTITYLIST) {
                    metadataInfo = await getEntityName(telemetry, sessionID, activeFileParams.dataverseEntity);

                    const dataverseToken = (await dataverseAuthentication(telemetry, activeOrgUrl, true)).accessToken;

                    if (activeFileParams.dataverseEntity == ADX_ENTITYFORM) {
                        const formColumns = await getFormXml(metadataInfo.entityName, metadataInfo.formName, activeOrgUrl, dataverseToken, telemetry, sessionID);
                        componentInfo = formColumns;
                    } else {
                        const entityColumns = await getEntityColumns(metadataInfo.entityName, activeOrgUrl, dataverseToken, telemetry, sessionID);
                        componentInfo = entityColumns;
                    }

                }
                return sendApiRequest([{ displayText: data[0].displayText, code: activeFileContent }], activeFileParams, orgID, intelligenceApiToken, sessionID, metadataInfo.entityName, componentInfo, telemetry, this.aibEndpoint, this.geoName, this.crossGeoDataMovementEnabledPPACFlag);
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
        environmentId = activeOrg.EnvironmentId

        sessionID = uuidv4(); // Generate a new session ID on org change
        sendTelemetryEvent(this.telemetry, { eventName: CopilotOrgChangedEvent, copilotSessionId: sessionID, orgId: orgID });

        const intelligenceAPIEndpointInfo = await ArtemisService.getIntelligenceEndpoint(orgID, this.telemetry, sessionID, environmentId);
        this.aibEndpoint = intelligenceAPIEndpointInfo.intelligenceEndpoint;
        this.geoName = intelligenceAPIEndpointInfo.geoName;
        this.crossGeoDataMovementEnabledPPACFlag = intelligenceAPIEndpointInfo.crossGeoDataMovementEnabledPPACFlag;


        const copilotAvailabilityStatus = checkCopilotAvailability(this.aibEndpoint, orgID, this.telemetry, sessionID, tenantId);

        if (!copilotAvailabilityStatus) {
            this.sendMessageToWebview({ type: 'Unavailable' });
            return;
        } else {
            this.sendMessageToWebview({ type: 'Available' });
        }

        if (IS_DESKTOP && this._view?.visible) {
            showConnectedOrgMessage(environmentName, activeOrgUrl);
        }
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
              <textarea rows=1 placeholder="${vscode.l10n.t('What do you need help with?')}" id="chat-input" class="input-field"></textarea>
                <button aria-label="Match Case" id="send-button" class="send-button">
                  <span>
                    ${sendIconSvg}
                  </span>
                </button>
              </div>
              <p class="disclaimer">${vscode.l10n.t(`Make sure AI-generated content is accurate and appropriate before using. <a href="https://go.microsoft.com/fwlink/?linkid=2240145">Learn more</a> | <a href="https://go.microsoft.com/fwlink/?linkid=2189520">View
              terms</a>`)}</p>
            </div>
          </div>

          <script type="module" nonce="${nonce}" src="${copilotScriptUri}"></script>
        </body>

        </html>`;
    }
}
