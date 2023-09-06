/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
import { sendApiRequest } from "./IntelligenceApiService";
import { dataverseAuthentication, intelligenceAPIAuthentication } from "../../web/client/common/authenticationProvider";
import { v4 as uuidv4 } from 'uuid'
import { PacWrapper } from "../../client/pac/PacWrapper";
import { ITelemetry } from "../../client/telemetry/ITelemetry";
import { AUTH_CREATE_FAILED, AUTH_CREATE_MESSAGE, AuthProfileNotFound, COPILOT_UNAVAILABLE, CopilotDisclaimer, CopilotStylePathSegments, DataverseEntityNameMap, EntityFieldMap, FieldTypeMap, PAC_SUCCESS, WebViewMessage, sendIconSvg } from "./constants";
import { IActiveFileParams, IActiveFileData} from './model';
import { escapeDollarSign, getLastThreePartsOfFileName, getNonce, getUserName, showConnectedOrgMessage, showInputBoxAndGetOrgUrl, showProgressWithNotification } from "../Utils";
import { CESUserFeedback } from "./user-feedback/CESSurvey";
import { GetAuthProfileWatchPattern } from "../../client/lib/AuthPanelView";
import { PacActiveOrgListOutput } from "../../client/pac/PacTypes";
import { CopilotWalkthroughEvent, CopilotCopyCodeToClipboardEvent, CopilotInsertCodeToEditorEvent, CopilotLoadedEvent, CopilotOrgChangedEvent, CopilotUserFeedbackThumbsDownEvent, CopilotUserFeedbackThumbsUpEvent, CopilotUserPromptedEvent, CopilotCodeLineCountEvent, CopilotClearChatEvent } from "./telemetry/telemetryConstants";
import { sendTelemetryEvent } from "./telemetry/copilotTelemetry";
import { getEntityColumns, getEntityName } from "./dataverseMetadata";
import { INTELLIGENCE_SCOPE_DEFAULT, PROVIDER_ID } from "../../web/client/common/constants";
import { getIntelligenceEndpoint } from "../ArtemisService";

let apiToken: string;
let userName: string;
let orgID: string;
let environmentName: string;
let userID: string;
let activeOrgUrl: string;
let sessionID: string;

//TODO: Check if it can be converted to singleton
export class PowerPagesCopilot implements vscode.WebviewViewProvider {
  public static readonly viewType = "powerpages.copilot";
  private _view?: vscode.WebviewView;
  private readonly _pacWrapper: PacWrapper;
  private _extensionContext: vscode.ExtensionContext;
  private readonly _disposables: vscode.Disposable[] = [];
  private loginButtonRendered = false;
  private telemetry: ITelemetry;
  private aibEndpoint: string | null = null;

  constructor(private readonly _extensionUri: vscode.Uri, _context: vscode.ExtensionContext, telemetry: ITelemetry, pacWrapper: PacWrapper) {
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
    this.setupFileWatcher();
  }


  private isDesktop: boolean = vscode.env.uiKind === vscode.UIKind.Desktop;

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
      const pacOutput = await this._pacWrapper.activeOrg();
  
    if (pacOutput.Status === PAC_SUCCESS) {
        this.handleOrgChangeSuccess(pacOutput);
      } else if (this._view?.visible) {

        const userOrgUrl = await showInputBoxAndGetOrgUrl();
        if (!userOrgUrl) {
          return;
        }
        const pacAuthCreateOutput = await showProgressWithNotification(vscode.l10n.t(AUTH_CREATE_MESSAGE), async() => { return await this._pacWrapper.authCreateNewAuthProfileForOrg(userOrgUrl)});
        if (pacAuthCreateOutput.Status !== PAC_SUCCESS) {
          vscode.window.showErrorMessage(AUTH_CREATE_FAILED); // TODO: Provide Experience to create auth profile
          return;
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

    webviewView.description = "PREVIEW"
    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    const pacOutput = await this._pacWrapper.activeOrg();

    if (pacOutput.Status === PAC_SUCCESS) { 
      this.handleOrgChangeSuccess(pacOutput);
    }

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case "webViewLoaded": {
          sendTelemetryEvent(this.telemetry, { eventName: CopilotLoadedEvent, copilotSessionId: sessionID, orgId: orgID });
          this.sendMessageToWebview({ type: 'env'}); //TODO Use IS_DESKTOP
          await this.checkAuthentication();
          if(orgID && userName) {
            this.sendMessageToWebview({type: 'isLoggedIn', value: true});
            this.sendMessageToWebview({ type: 'userName', value: userName });
          }else
          {
            this.sendMessageToWebview({type: 'isLoggedIn', value: false});
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
          sendTelemetryEvent(this.telemetry, { eventName: CopilotUserPromptedEvent, copilotSessionId: sessionID, aibEndpoint: this.aibEndpoint ?? '', orgId: orgID }); //TODO: Add active Editor info
          orgID
            ? (() => {
              const { activeFileParams } = this.getActiveEditorContent();
              this.authenticateAndSendAPIRequest(data.value, activeFileParams, orgID, this.telemetry);
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
            CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsUp", this.telemetry)
          } else if (data.value === "thumbsDown") {

            sendTelemetryEvent(this.telemetry, { eventName: CopilotUserFeedbackThumbsDownEvent, copilotSessionId: sessionID, orgId: orgID });
            CESUserFeedback(this._extensionContext, sessionID, userID, "thumbsDown", this.telemetry)
          }
          break;
        }
        case "walkthrough": {
          sendTelemetryEvent(this.telemetry, { eventName: CopilotWalkthroughEvent, copilotSessionId: sessionID, orgId: orgID });
          this.openWalkthrough();
          break;
        }
        case "codeLineCount": {
          sendTelemetryEvent(this.telemetry, { eventName: CopilotCodeLineCountEvent, copilotSessionId: sessionID, codeLineCount: data.value ?? 0, orgId: orgID });
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

    const pacOutput = await this._pacWrapper.activeOrg();
    if (pacOutput.Status === PAC_SUCCESS) {
      this.handleOrgChangeSuccess.call(this, pacOutput);

      intelligenceAPIAuthentication(this.telemetry, sessionID).then(({ accessToken, user }) => {
        this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user);
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
      const pacAuthCreateOutput = await showProgressWithNotification(AUTH_CREATE_MESSAGE, async() => { return await this._pacWrapper.authCreateNewAuthProfileForOrg(userOrgUrl)});
      pacAuthCreateOutput.Status === PAC_SUCCESS
        ? intelligenceAPIAuthentication(this.telemetry, sessionID).then(({ accessToken, user }) =>
          this.intelligenceAPIAuthenticationHandler.call(this, accessToken, user)
        )
        : vscode.window.showErrorMessage(AUTH_CREATE_FAILED);


    }
  }

  private async checkAuthentication() {
    const session = await vscode.authentication.getSession(PROVIDER_ID, [`${INTELLIGENCE_SCOPE_DEFAULT}`], { silent: true });
    if (session) {
        apiToken = session.accessToken;
        userName = getUserName(session.account.label);
    } else {
        apiToken = "";
        userName = "";
    }
}

  private openWalkthrough() {
    const walkthroughUri = vscode.Uri.joinPath(this._extensionUri, 'src', 'common', 'copilot', 'assets', 'walkthrough', 'Copilot-In-PowerPages.md');
    vscode.commands.executeCommand("markdown.showPreview", walkthroughUri);
  }

  private authenticateAndSendAPIRequest(data: string, activeFileParams: IActiveFileParams, orgID: string, telemetry: ITelemetry) {
    return intelligenceAPIAuthentication(telemetry, sessionID)
      .then(async ({ accessToken, user }) => {
        apiToken = accessToken;
        userName = getUserName(user);
        this.sendMessageToWebview({ type: 'userName', value: userName });

        let entityName = "";
        let entityColumns: string[] = [];

        if (activeFileParams.dataverseEntity == "adx_entityform" || activeFileParams.dataverseEntity == 'adx_entitylist') {
          entityName = getEntityName(telemetry, sessionID, activeFileParams.dataverseEntity);

          const dataverseToken = await dataverseAuthentication(activeOrgUrl, true);

          entityColumns = await getEntityColumns(entityName, activeOrgUrl, dataverseToken, telemetry, sessionID);
        }

        return sendApiRequest(data, activeFileParams, orgID, apiToken, sessionID, entityName, entityColumns, telemetry, this.aibEndpoint);
      })
      .then(apiResponse => {
        this.sendMessageToWebview({ type: 'apiResponse', value: apiResponse });
        this.sendMessageToWebview({ type: 'enableInput' });
      });
  }


  private async handleOrgChangeSuccess(pacOutput: PacActiveOrgListOutput) {
    const activeOrg = pacOutput.Results;
    if(orgID === activeOrg.OrgId) {
      return;
    }

    orgID = activeOrg.OrgId;
    environmentName = activeOrg.FriendlyName;
    userID = activeOrg.UserId;
    activeOrgUrl = activeOrg.OrgUrl;

    sessionID = uuidv4(); // Generate a new session ID on org change
    sendTelemetryEvent(this.telemetry, { eventName: CopilotOrgChangedEvent, copilotSessionId: sessionID, orgId: orgID });

    this.aibEndpoint = await getIntelligenceEndpoint(orgID, this.telemetry, sessionID);
    if(this.aibEndpoint === COPILOT_UNAVAILABLE) {
      this.sendMessageToWebview({ type: 'Unavailable'}); 
    } else {
      this.sendMessageToWebview({ type: 'Available'});
    }

    if (this._view?.visible) { 
      showConnectedOrgMessage(environmentName, activeOrgUrl);
    }
  }

  private async intelligenceAPIAuthenticationHandler(accessToken: string, user: string) {
    if (accessToken && user) {
      apiToken = accessToken;
      userName = getUserName(user);
      this.sendMessageToWebview({ type: 'isLoggedIn', value: true})
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