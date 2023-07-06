/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
import { sendApiRequest } from "./IntelligenceApi";
import { intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";
import { v4 as uuidv4 } from 'uuid'
import { INTELLIGENCE_SCOPE_DEFAULT, PROVIDER_ID } from "../../web/client/common/constants";
import { PacInterop, PacWrapper } from "../../client/pac/PacWrapper";
import { PacWrapperContext } from "../../client/pac/PacWrapperContext";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { DataverseEntityNameMap, EntityFieldMap, FieldTypeMap, WebViewMessage } from "./constants";
import { escapeDollarSign, getLastThreeParts, getNonce, getUserName, showConnectedOrgMessage, showInputBoxAndGetOrgUrl } from "./Utils";
import { CESUserFeedback } from "./user-feedback/CESSurvey";
import { GetAuthProfileWatchPattern } from "../../client/lib/AuthPanelView";
import { PacActiveOrgListOutput } from "../../client/pac/PacTypes";
//declare const IS_DESKTOP: boolean;
export let apiToken: string;
export let sessionID: string;
export let userName: string;
export let orgID: string;
export let environmentName: string;
export let userID: string;
export let activeOrgUrl: string;



export class PowerPagesCopilot implements vscode.WebviewViewProvider {
    public static readonly viewType = "powerpages.copilot";
    private _view?: vscode.WebviewView;
    private readonly _pacWrapper: PacWrapper;
    private _extensionContext: vscode.ExtensionContext;
    private readonly _disposables: vscode.Disposable[] = [];

    constructor(private readonly _extensionUri: vscode.Uri, _context: vscode.ExtensionContext, telemetry: ITelemetry, cliPath: string) {
        this._extensionContext = _context;
        const pacContext = new PacWrapperContext(_context, telemetry);
        const interop = new PacInterop(pacContext, cliPath);
        this._pacWrapper = new PacWrapper(pacContext, interop); //For Web Terminal will not be available
        console.log("pacWrapper created " + this._pacWrapper);
        _context.subscriptions.push(
            vscode.commands.registerCommand("powerpages.copilot.clearConversation", () => {
                console.log("clearing conversation");
                this.sendMessageToWebview({ type: "clearConversation" });
                sessionID = uuidv4();
            }
            )
        );
        this.setupFileWatcher();
        //this.handleOrgChange();
    }


    private isDesktop: boolean = vscode.env.uiKind === vscode.UIKind.Desktop;

    private setupFileWatcher() {
        const watchPath = GetAuthProfileWatchPattern();
        if (watchPath) {
            const watcher = vscode.workspace.createFileSystemWatcher(watchPath);

            watcher.onDidChange(() => this.handleOrgChange()),
            watcher.onDidCreate(() => this.handleOrgChange()),
            watcher.onDidDelete(() => this.handleOrgChange())
            this._extensionContext.subscriptions.push(watcher);
        }

    }

    private async handleOrgChange() {
        orgID = '';
        const pacOutput = await this._pacWrapper.activeOrg();

        if (pacOutput.Status === "Success") {
            const activeOrg = pacOutput.Results;

            orgID = activeOrg.OrgId;
            console.log("orgID from PAC: " + orgID);
            environmentName = activeOrg.FriendlyName;
            console.log("environmentName from PAC: " + environmentName);
            userID = activeOrg.UserId;
            console.log("userID from PAC: " + userID);
            const orgUrl = activeOrg.OrgUrl;

            showConnectedOrgMessage(environmentName, orgUrl);
        } else {
            console.log("Error getting active org from PAC");
            // vscode.window.showErrorMessage("Error getting active org from PAC");
            vscode.window.showInputBox({
                // prompt: "Please enter the environment name",
                placeHolder: "Enter the environment URL",
            }).then(async (orgUrl) => {
                if (!orgUrl) {
                    return;
                }
                const pacAuthCreateOutput = await this._pacWrapper.authCreateNewAuthProfileForOrg(orgUrl);
                if (pacAuthCreateOutput.Status === "Success") {
                    this.handleOrgChange();
                } else {
                    vscode.window.showErrorMessage("Error creating auth profile for org");
                }
            });

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

        webviewView.description = "PREVIEW"
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,

            localResourceRoots: [this._extensionUri],
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "webViewLoaded": {
                    console.log("webview loaded");
                    sessionID = uuidv4();
                    this.sendMessageToWebview({ type: 'env', value: this.isDesktop, envName: environmentName }); //TODO Use IS_DESKTOP
                    await this.checkAuthentication();
                    this.sendMessageToWebview({ type: 'userName', value: userName });
                    this.sendMessageToWebview({ type: "welcomeScreen" });
                    break;
                }
                case "login": {
                    this.handleLogin();
                    break;
                }
                case "newUserPrompt": {
                    if (orgID) {
                        const { activeFileParams, activeFileContent } = this.getActiveEditorContent();
                        intelligenceAPIAuthentication()
                            .then(({ accessToken, user }) => {
                                console.log('token: ' + accessToken);
                                apiToken = accessToken;
                                userName = getUserName(user);
                                this.sendMessageToWebview({ type: 'userName', value: userName });

                                return sendApiRequest(data.value, activeFileParams, activeFileContent, orgID, apiToken);
                            })
                            .then(apiResponse => {
                                this.sendMessageToWebview({ type: 'apiResponse', value: apiResponse });
                            })
                            .catch(error => {
                                console.log("Error during authentication or API request: " + error);
                                apiToken = "";
                                // Handle any error scenarios
                            });
                    } else {
                        vscode.window.showErrorMessage("Please login to an environment before using Copilot");
                    }
                    break;
                }
                case "insertCode": {
                    console.log("code to be inserted " + data.value);
                    const escapedSnippet = escapeDollarSign(data.value);
                    console.log("escapedSnippet " + escapedSnippet);
                    vscode.window.activeTextEditor?.insertSnippet(
                        new vscode.SnippetString(`${escapedSnippet}`)
                    );
                    break;
                }
                case "copyCodeToClipboard": {
                    console.log(
                        "code ready to be copied to clipboard " + data.value
                    );
                    vscode.env.clipboard.writeText(data.value);
                    vscode.window.showInformationMessage(vscode.l10n.t('Copied to clipboard!'))
                    break;
                }
                case "clearChat": {
                    console.log("clear chat ");
                    sessionID = uuidv4();
                    break;
                }
                case "userFeedback": {
                    console.log("user feedback " + data.value);
                    if (data.value === "thumbsUp") {
                        console.log("Thumbs up telemetry")
                        CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsUp")
                    } else if (data.value === "thumbsDown") {
                        console.log("Thumbs down telemetry")
                        CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsDown")
                    }
                }
            }
        });
    }

    private async handleLogin() {
        console.log("login");
        const pacOutput = await this._pacWrapper.activeOrg();
        if (pacOutput.Status === "Success") {
            this.handleOrgChangeSuccess.call(this, pacOutput);

            intelligenceAPIAuthentication().then(({ accessToken, user }) => {
                this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user);
            });

        } else {

            const userOrgUrl = await showInputBoxAndGetOrgUrl();
            if (!userOrgUrl) {
                return;
            }
            const pacAuthCreateOutput = await this._pacWrapper.authCreateNewAuthProfileForOrg(userOrgUrl);
            if (pacAuthCreateOutput.Status === "Success") {
                intelligenceAPIAuthentication().then(({ accessToken, user }) => {
                    this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user);
                });
            } else {
                vscode.window.showErrorMessage("Error creating auth profile for org");
            }

        }
    }

    private async handleOrgChangeSuccess(pacOutput: PacActiveOrgListOutput) {
        const activeOrg = pacOutput.Results;

        orgID = activeOrg.OrgId;
        console.log("orgID from PAC: " + orgID);
        environmentName = activeOrg.FriendlyName;
        console.log("environmentName from PAC: " + environmentName);
        userID = activeOrg.UserId;
        console.log("userID from PAC: " + userID);
        activeOrgUrl = activeOrg.OrgUrl;

        showConnectedOrgMessage(environmentName, activeOrgUrl);
    }

    private async intelligenceAPIAuthenticationHandler(accessToken: string, user: string) {
        if (accessToken && user) {
            console.log('token: ' + accessToken);
            apiToken = accessToken;
            userName = getUserName(user);
            this.sendMessageToWebview({ type: 'userName', value: userName });
            this.sendMessageToWebview({ type: "welcomeScreen" });
        }
    }

    private async checkAuthentication() {
        const session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });
        if (session) {
            console.log('token: ' + session.accessToken);
            apiToken = session.accessToken;
            userName = getUserName(session.account.label);
        } else {
            console.log('no session');
            console.log("apiToken no session= " + apiToken);
        }
    }

    private getActiveEditorContent(): { activeFileParams: string[], activeFileContent: string } {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            const document = activeEditor.document;
            const fileName = document.fileName;
            const relativeFileName = vscode.workspace.asRelativePath(fileName);
            console.log("active file name = " + relativeFileName)
            const activeFileParams: string[] = getLastThreeParts(relativeFileName);

            const activeFileParamsMapped = this.getMappedParams(activeFileParams);

            return { activeFileParams: activeFileParamsMapped, activeFileContent: document.getText() };
        }
        return { activeFileParams: ['', '', ''], activeFileContent: "" };
    }

    private getMappedParams(activeFileParams: string[]): string[] {
        const mappedParams: string[] = [];
        mappedParams.push(DataverseEntityNameMap.get(activeFileParams[0]) || "");
        mappedParams.push(EntityFieldMap.get(activeFileParams[1]) || "");
        mappedParams.push(FieldTypeMap.get(activeFileParams[2]) || "");
        return mappedParams;
    }

    public sendMessageToWebview(message: WebViewMessage) {
        if (this._view) {
            this._view.webview.postMessage(message);
        } else {
            console.log("webview not found");
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {


        const copilotScriptPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'common', 'copilot', 'assets', 'scripts', 'copilot.js');
        const copilotScriptUri = webview.asWebviewUri(copilotScriptPath);

        const copilotStylePath = vscode.Uri.joinPath(
            this._extensionUri,
            'src',
            "common",
            "copilot",
            "assets",
            "styles",
            "copilot.css"
        );
        const copilotStyleUri = webview.asWebviewUri(copilotStylePath);

        const codiconStylePath = vscode.Uri.joinPath(
            this._extensionUri,
            'src',
            "common",
            "copilot",
            "assets",
            "styles",
            "codicon.css"
        );
        const codiconStyleUri = webview.asWebviewUri(codiconStylePath);

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        //TODO: Add CSP
        return `
        <!DOCTYPE html>
        <html lang="en">
        
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="${copilotStyleUri}" rel="stylesheet">
          </link>
          <link href="${codiconStyleUri}" rel="stylesheet">
          </link>
          <title>Chat View</title>
        </head>
        
        <body>
          <div class="copilot-window">
        
            <div class="chat-messages" id="chat-messages">
              <div id="copilot-header"></div>
            </div>
        
            <div class="chat-input">
              <div class="input-container">
                <input type="text" placeholder="Ask a question..." id="chat-input" class="input-field">
                <button aria-label="Match Case" id="send-button" class="send-button">
                  <span>
                    <svg width="16px" height="16px" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1.17683 1.1185C1.32953 0.989145 1.54464 0.963297 1.72363 1.05279L14.7236 7.55279C14.893 7.63748 15 7.81061 15 8C15 8.18939 14.893 8.36252 14.7236 8.44721L1.72363 14.9472C1.54464 15.0367 1.32953 15.0109 1.17683 14.8815C1.02414 14.7522 0.96328 14.5442 1.02213 14.353L2.97688 8L1.02213 1.64705C0.96328 1.45578 1.02414 1.24785 1.17683 1.1185ZM3.8693 8.5L2.32155 13.5302L13.382 8L2.32155 2.46979L3.8693 7.5H9.50001C9.77615 7.5 10 7.72386 10 8C10 8.27614 9.77615 8.5 9.50001 8.5H3.8693Z"
                        class="send-icon" />
                    </svg>
                  </span>
                </button>
              </div>
              <p class="disclaimer">Make sure AI-generated content is accurate and appropriate before using. <a href="#">See
                  terms</a></p>
            </div>
          </div>
        
          <script type="module" nonce="${nonce}" src="${copilotScriptUri}"></script>
        </body>
        
        </html>`;
    }
}