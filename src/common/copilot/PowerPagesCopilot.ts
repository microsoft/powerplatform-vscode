/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
import { sendApiRequest } from "./IntelligenceApiService";
import { intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";
import { v4 as uuidv4 } from 'uuid'
import { PacInterop, PacWrapper } from "../../client/pac/PacWrapper";
import { PacWrapperContext } from "../../client/pac/PacWrapperContext";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { ActiveFileParams, AuthProfileNotFound, CodiconStylePathSegments, CopilotDisclaimer, CopilotStylePathSegments, DataverseEntityNameMap, EntityFieldMap, FieldTypeMap, WebViewMessage, sendIconSvg } from "./constants";
import { escapeDollarSign, getLastThreeParts, getNonce, getUserName, showConnectedOrgMessage, showInputBoxAndGetOrgUrl } from "../Utils";
import { CESUserFeedback } from "./user-feedback/CESSurvey";
import { GetAuthProfileWatchPattern } from "../../client/lib/AuthPanelView";
import { PacActiveOrgListOutput } from "../../client/pac/PacTypes";
import { CopyCodeToClipboardEvent, InsertCodeToEditorEvent, UserFeedbackThumbsDownEvent, UserFeedbackThumbsUpEvent } from "./telemetry/telemetryConstants";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";

let apiToken: string;
let userName: string;
let orgID: string;
let environmentName: string;
let userID: string;
let activeOrgUrl: string;
export let sessionID: string;

//TODO: Check if it can be converted to singleton
export class PowerPagesCopilot implements vscode.WebviewViewProvider {
  public static readonly viewType = "powerpages.copilot";
  private _view?: vscode.WebviewView;
  private readonly _pacWrapper: PacWrapper;
  private _extensionContext: vscode.ExtensionContext;
  private readonly _disposables: vscode.Disposable[] = [];
  private loginButtonRendered = false;
  private telemetry: ITelemetry;

  constructor(private readonly _extensionUri: vscode.Uri, _context: vscode.ExtensionContext, telemetry: ITelemetry, cliPath: string) {
    this.telemetry = telemetry;
    this._extensionContext = _context;
    const pacContext = new PacWrapperContext(_context, telemetry);
    const interop = new PacInterop(pacContext, cliPath);
    this._pacWrapper = new PacWrapper(pacContext, interop); //For Web Terminal will not be available

    _context.subscriptions.push(
      vscode.commands.registerCommand("powerpages.copilot.clearConversation", () => {

        this.sendMessageToWebview({ type: "clearConversation" });
        sessionID = uuidv4();
      }
      )
    );
    this.setupFileWatcher();
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
      this.handleOrgChangeSuccess(pacOutput);
    } else if (this._view?.visible) {

      const userOrgUrl = await showInputBoxAndGetOrgUrl();
      if (!userOrgUrl) {
        return;
      }
      const pacAuthCreateOutput = await this._pacWrapper.authCreateNewAuthProfileForOrg(userOrgUrl);
      pacAuthCreateOutput.Status === "Success"
        ? this.handleOrgChange()
        : vscode.window.showErrorMessage("Error creating auth profile for org");

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

          sessionID = uuidv4();
          this.sendMessageToWebview({ type: 'env', value: this.isDesktop, envName: environmentName }); //TODO Use IS_DESKTOP
          this.handleLogin();
          break;
        }
        case "login": {
          this.handleLogin();
          break;
        }
        case "newUserPrompt": {
          orgID
            ? (() => {
              const { activeFileParams } = this.getActiveEditorContent();
              this.authenticateAndSendAPIRequest(data.value, activeFileParams, orgID);
            })()
            : (() => {
              this.sendMessageToWebview({ type: 'apiResponse', value: AuthProfileNotFound });
              this.sendMessageToWebview({ type: 'enableInput' });
            })();

          break;
        }
        case "insertCode": {

          const escapedSnippet = escapeDollarSign(data.value);

          vscode.window.activeTextEditor?.insertSnippet(
            new vscode.SnippetString(`${escapedSnippet}`)
          );
          sendTelemetryEvent(this.telemetry, { eventName: InsertCodeToEditorEvent, copilotSessionId: sessionID });
          break;
        }
        case "copyCodeToClipboard": {

          vscode.env.clipboard.writeText(data.value);
          vscode.window.showInformationMessage(vscode.l10n.t('Copied to clipboard!'))
          sendTelemetryEvent(this.telemetry, { eventName: CopyCodeToClipboardEvent, copilotSessionId: sessionID });
          break;
        }
        case "clearChat": {

          sessionID = uuidv4();
          break;
        }
        case "userFeedback": {

          if (data.value === "thumbsUp") {

            sendTelemetryEvent(this.telemetry, { eventName: UserFeedbackThumbsUpEvent, copilotSessionId: sessionID });
            CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsUp", this.telemetry)
          } else if (data.value === "thumbsDown") {

            sendTelemetryEvent(this.telemetry, { eventName: UserFeedbackThumbsDownEvent, copilotSessionId: sessionID });
            CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsDown", this.telemetry)
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

    const pacOutput = await this._pacWrapper.activeOrg();
    if (pacOutput.Status === "Success") {
      this.handleOrgChangeSuccess.call(this, pacOutput);

      intelligenceAPIAuthentication().then(({ accessToken, user }) => {
        this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user);
      });

    } else if (this._view?.visible) {

      const userOrgUrl = await showInputBoxAndGetOrgUrl();
      if (!userOrgUrl) {
        userName = "";
        this.sendMessageToWebview({ type: 'userName', value: userName });

        if (!this.loginButtonRendered) {
          this.sendMessageToWebview({ type: "welcomeScreen" });
          this.loginButtonRendered = true; // Set the flag to indicate that the login button has been rendered
        }

        return;
      }
      const pacAuthCreateOutput = await this._pacWrapper.authCreateNewAuthProfileForOrg(userOrgUrl);
      pacAuthCreateOutput.Status === "Success"
      ? intelligenceAPIAuthentication().then(({ accessToken, user }) =>
          this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user)
        )
      : vscode.window.showErrorMessage("Error creating auth profile for org");
    

    }
  }

  private authenticateAndSendAPIRequest(data: any, activeFileParams: ActiveFileParams, orgID: string) {
    return intelligenceAPIAuthentication()
      .then(({ accessToken, user }) => {
        apiToken = accessToken;
        userName = getUserName(user);
        this.sendMessageToWebview({ type: 'userName', value: userName });

        return sendApiRequest(data, activeFileParams, orgID, apiToken);
      })
      .then(apiResponse => {
        this.sendMessageToWebview({ type: 'apiResponse', value: apiResponse });
        this.sendMessageToWebview({ type: 'enableInput' });
      });
  }


  private async handleOrgChangeSuccess(pacOutput: PacActiveOrgListOutput) {
    const activeOrg = pacOutput.Results;
    orgID = activeOrg.OrgId;
    environmentName = activeOrg.FriendlyName;
    userID = activeOrg.UserId;
    activeOrgUrl = activeOrg.OrgUrl;

    showConnectedOrgMessage(environmentName, activeOrgUrl);
  }

  private async intelligenceAPIAuthenticationHandler(accessToken: string, user: string) {
    if (accessToken && user) {

      apiToken = accessToken;
      userName = getUserName(user);
      this.sendMessageToWebview({ type: 'userName', value: userName });
      this.sendMessageToWebview({ type: "welcomeScreen" });
    }
  }



  private getActiveEditorContent(): { activeFileParams: ActiveFileParams, activeFileContent: string } {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
      const document = activeEditor.document;
      const fileName = document.fileName;
      const relativeFileName = vscode.workspace.asRelativePath(fileName);
  
      const activeFileParams: string[] = getLastThreeParts(relativeFileName);
      const activeFileParamsMapped = this.getMappedParams(activeFileParams);
  
      return { activeFileParams: { dataverseEntity: activeFileParamsMapped[0], entityField: activeFileParamsMapped[1], fieldType: activeFileParamsMapped[2] }, activeFileContent: document.getText() };
    }
  
    return { activeFileParams: {} as ActiveFileParams, activeFileContent: "" };
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

    const codiconStylePath = vscode.Uri.joinPath(
      this._extensionUri,
      ...CodiconStylePathSegments
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