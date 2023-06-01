/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import * as vscode from "vscode";
// import { createAiWebpage } from "./Utils";
import { sendApiRequest } from "./IntelligenceApi";
// import { getTemplates } from "./Utils";

declare const IS_DESKTOP: boolean;

export let conversation = [
    {
        role: "system",
        content:
            "You are a web developer well versed with css, html, and javascript who is using the power pages platform which was formerly known as powerapps portals. It mostly uses html, css, javascript for development. Uses liquid as a templating language and Bootstrap v3.3.6. You always put code block in markdown syntax",
    },
];


export class PowerPagesCopilot implements vscode.WebviewViewProvider {
    public static readonly viewType = "powerpages.copilot";
    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    private isDesktop: boolean = vscode.env.uiKind === vscode.UIKind.Desktop;

    public async resolveWebviewView(
        webviewView: vscode.WebviewView,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        context: vscode.WebviewViewResolveContext,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _token: vscode.CancellationToken
    ) {
        this._view = webviewView;


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
                    this.sendMessageToWebview({ type: 'env', value: this.isDesktop });
                    break;
                }
                case "newUserPrompt": {
                    //const engineeredPrompt = this.promptEngine(data.value);
                    //const apiResponse = await sendApiRequest(engineeredPrompt);
                    const apiResponse = await sendApiRequest(data.value);
                    this.sendMessageToWebview({ type: 'apiResponse', value: apiResponse });
                    break;
                }
                case "insertCode": {
                    console.log("code ready to be inserted " + data.value);
                    vscode.window.activeTextEditor?.insertSnippet(
                        new vscode.SnippetString(`${data.value}`)
                    );
                    break;
                }
                case "copyCodeToClipboard": {
                    console.log(
                        "code ready to be copied to clipboard " + data.value
                    );
                    vscode.env.clipboard.writeText(data.value);
                    break;
                }
                case "createWebpage": {
                    console.log("create webpage with code = " + data.value);

                    if (IS_DESKTOP) {
                        try {
                            const { createAiWebpage } = await import("./Utils");
                            createAiWebpage(data.value);
                        } catch (e) {
                            console.error(e);
                        }
                    }
                    break;
                }
                case "createWebfile": {
                    console.log("create webfile with image = " + data.value);
                    break;
                }
                case "createTablePermission": {
                    console.log(
                        "create table permission with code = " + data.value
                    );
                    break;
                }
                case "clearChat": {
                    console.log("clear chat ");
                    conversation = [
                        {
                            role: "system",
                            content:
                                "You are a web developer well versed with css, html, and javascript who is using the power pages platform which was formerly known as powerapps portals. It mostly uses html, css, javascript for development. Uses liquid as a templating language and Bootstrap v3.3.6. You always put code block in markdown syntax",
                        },
                    ];
                    break;
                    //createNewFile(data.value);
                    break;
                }
                case "hello": {
                    vscode.window.showInformationMessage(data.value)
                    break;
                }
            }
        });
    }

    public promptEngine(message: string) {
        const type = message.split(" ")[0].slice(1);
        const templates: { [key: string]: string } = getTemplates();
        let realPrompt = "";
        let template = templates[type];
        if (template === undefined) {
            template = "";
            realPrompt = message;
        } else {
            // template = "Here is an example. " + template;
            realPrompt = message.split(type).slice(1).join("");
            console.log("realPrompt = " + realPrompt);
        }
        message =
            " based on this information, respond to the prompt mentioned after hyphen -  " +
            realPrompt;
        const prompt = template + message;
        console.log("Generated prompt : " + prompt);
        return prompt;
    }


    private getActiveEditorContent() {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor) {
            return activeEditor.document.getText();
        }
        return "";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public sendMessageToWebview(message: any) {
        if (this._view) {
            this._view.webview.postMessage(message);
        } else {
            console.log("webview not found");
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {

        
        // const copilotScriptPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'common', 'copilot', 'assets', 'scripts', 'copilot.js');
       // const copilotScriptUri = webview.asWebviewUri(copilotScriptPath);
        const webviewPath = vscode.Uri.joinPath(this._extensionUri, "dist", "webview.js");
        const webviewUri = webview.asWebviewUri(webviewPath);


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


        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${copilotStyleUri}" rel="stylesheet"></link>
            <link href="${codiconStyleUri}" rel="stylesheet"></link>
          <title>Chat View</title>
        </head>
        <body>
        <div class="copilot-window">
        <div class="chat-messages" id="chat-messages">
 
        </div>

        <div class="chat-input">
          <vscode-text-field placeholder="Ask Copilot a question or type '/' for tables"  id="chat-input" class="input-field">
            <section slot="end" style="display:flex; align-items: center;">
              <vscode-button appearance="icon" aria-label="Match Case" id="send-button">
                <span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.17683 1.1185C1.32953 0.989145 1.54464 0.963297 1.72363 1.05279L14.7236 7.55279C14.893 7.63748 15 7.81061 15 8C15 8.18939 14.893 8.36252 14.7236 8.44721L1.72363 14.9472C1.54464 15.0367 1.32953 15.0109 1.17683 14.8815C1.02414 14.7522 0.96328 14.5442 1.02213 14.353L2.97688 8L1.02213 1.64705C0.96328 1.45578 1.02414 1.24785 1.17683 1.1185ZM3.8693 8.5L2.32155 13.5302L13.382 8L2.32155 2.46979L3.8693 7.5H9.50001C9.77615 7.5 10 7.72386 10 8C10 8.27614 9.77615 8.5 9.50001 8.5H3.8693Z" fill="#F3F2F1"/>
                  </svg>
                </span>
              </vscode-button>
            </section>
          </vscode-text-field>
          <p class="disclaimer">Make sure AI-generated content is accurate and appropriate before using. <vscode-link href="#">See terms</vscode-link></p>
        </div>
      </div>
          
          <script type="module" nonce="${nonce}" src="${webviewUri}"></script>
        </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

function getTemplates() {
    const templates = {
        base: `You are a web developer using power portal or power pages platform for development. Power Pages uses liquid as a templating language and Bootstrap v3.3.6. Always give code snippets enclosed within \`+"${"```"}" +\` and never without it.`,

        entityList: `The list gets its data asynchronously, and when it's complete it will trigger an event 'loaded' that your custom JavaScript can listen for and do something with items in the grid. The following code is a sample javascript code: \`+"${"```"}" +\` $(document).ready(function () { $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("tr").each(function () { // do something with each row $(this).css("background-color", "yellow"); }); }); }); \`+"${"```"}" +\` Find a particular attribute field and get its value to possibly modify the rendering of the value. The following code gets each table cell that contains the value of the accountnumber attribute. Replace accountnumber with an attribute appropriate for your table and view. \`+"${"```"}" +\` $(document).ready(function (){ $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("td[data-attribute='accountnumber']").each(function (i, e){ var value = $(this).data(value); \`+"${"```"}" +\` // now that you have the value you can do something to the value }); }); });`,

        entityForm: `In a form On click of the Next/Submit button, a function named entityFormClientValidate is executed. You can extend this method to add custom validation logic for example refer the following javascript code: \`+"${"```"}" +\` if (window.jQuery) { (function ($) { if (typeof (entityFormClientValidate) != 'undefined') { var originalValidationFunction = entityFormClientValidate; if (originalValidationFunction && typeof (originalValidationFunction) == 'function') { entityFormClientValidate = function() { originalValidationFunction.apply(this, arguments); // do your custom validation here // return false; // to prevent the form submit you need to return false // end custom validation. return true; }; } } }(window.jQuery)); } To customize the validation of fields on the form you can write something like this: if (window.jQuery) { (function ($) { $(document).ready(function () { if (typeof (Page_Validators) == 'undefined') return; // Create new validator var newValidator = document.createElement('span'); newValidator.style.display = 'none'; newValidator.id = 'emailaddress1Validator'; newValidator.controltovalidate = 'emailaddress1'; newValidator.errormessage = '<a href="#emailaddress1_label" referencecontrolid="emailaddress1" onclick="javascript:scrollToAndFocus(\\"emailaddress1_label\\",\\"emailaddress1\\");return false;">Email is a required field.</a>'; newValidator.validationGroup = ''; // Set this if you have set ValidationGroup on the form newValidator.initialvalue = ''; newValidator.evaluationfunction = function () { var contactMethod = $('#preferredcontactmethodcode').val(); if (contactMethod != 2) return true; // check if contact method is not 'Email'. // only require email address if preferred contact method is email. var value = $('#emailaddress1').val(); if (value == null || value == '') { return false; } else { return true; } }; // Add the new validator to the page validators array: Page_Validators.push(newValidator); }); }(window.jQuery)); } \`+"${"```"}" +\`  Note: The above code is just an example for adding validations to the form. The actual prompt might be different based on the requirement`,

        webPage: "You are an intelligent assistant that helps users build pages in Microsoft Power Pages. The user wants to build a new page. This is the title of their website: 'Woodland Bank'. Use HTML for the body and use Bootstrap grid system. Each row element should look like this: <div data-component-theme=\"portalThemeColor{colorNum}\" class=\"row sectionBlockLayout\" style=\"min-height: auto;\"> where {colorNum} must have a value of 1, 5, or 7. The first row should not have {colorNum} value of 1. There should be a container immediately within each row like this: <div class=\"container\">. Each column element should look like this: <div class=\"col-md-{colNum} columnBlockLayout\"> where {colNum} must have a value of 4, 6, 8, or 12. Once the columns reach 12, start a new row. The \"min-height\" property must be defined for each row and column. Each row must have the following styles=\"display: flex; flex-wrap: wrap;\". Each column must have the following styles=\"flex-grow: 1; display: flex; flex-direction: column;\". These are the standard elements available to choose from: [ <h1>, <h2>, <h3>, <h4>, <h5>, <p>, <img style=\"width: 100%; height: auto;\" alt=\"\" src=\"\">, <button class=\"button1\">, <button class=\"button2\"> ]. Each image must have a descriptive alt text and a src attribute. The hero section should have a background image. Use spacers to add spacing between elements within a column. Each spacer should look like this: <div class=\"row sectionBlockLayout\" style=\"min-height: {space}px;\"> where {space} is a number greater than or equal to 15. Here are some examples of row elements: [<div data-component-theme=\"portalThemeColor7\" class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: 50%; background-image: linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(''); background-position: center center; background-repeat: no-repeat; background-size: cover;\"><div class=\"container\"><div class=\"col-md-12 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column; margin: 120px 0px;\"><h1 style=\"text-align: center; color: var(--portalThemeColor8);\">...</h1><div class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: 15px;\"></div><h4 style=\"text-align: center; color: var(--portalThemeColor8);\">...</h4><div class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: 15px;\"></div><button class=\"button1\" style=\"text-align: center; margin-left: auto; margin-right: auto;\">...</button></div></div></div>,<div data-component-theme=\"portalThemeColor5\" class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: auto;\"><div class=\"container\"><div class=\"col-md-8 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column; margin: 30px 0px; padding: 30px;\"><img style=\"width: 100%; height: auto;\" alt=\"\" src=\"\"></div><div class=\"col-md-4 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column; margin: 30px 0px; padding: 30px;\"><h2>...</h2><p>...</p><div class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: 15px;\"></div><button class=\"button2\">...</button></div></div></div>,<div data-component-theme=\"portalThemeColor5\" class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: auto;\"><div class=\"container\"><div class=\"col-md-4 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column; margin: 30px 0px; padding: 30px;\"><h2>...</h2><p>...</p><div class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: 15px;\"></div><button class=\"button2\">...</button></div><div class=\"col-md-8 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column; margin: 30px 0px; padding: 30px;\"><img style=\"width: 100%; height: auto;\" alt=\"\" src=\"\"></div></div></div>,<div data-component-theme=\"portalThemeColor7\" class=\"row sectionBlockLayout\" style=\"display: flex; flex-wrap: wrap; min-height: auto;\"><div class=\"container\"><div class=\"col-md-4 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column;\"><img style=\"width: 100%; height: auto;\" alt=\"\" src=\"\"><h2 style=\"text-align: center;\">...</h2><p style=\"text-align: center;\">...</p></div><div class=\"col-md-4 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column;\"><img style=\"width: 100%; height: auto;\" alt=\"\" src=\"\"><h2 style=\"text-align: center;\">...</h2><p style=\"text-align: center;\">...</p></div><div class=\"col-md-4 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column;\"><img style=\"width: 100%; height: auto;\" alt=\"\" src=\"\"><h2 style=\"text-align: center;\">...</h2><p style=\"text-align: center;\">...</p></div></div></div>,<div data-component-theme=\"portalThemeColor1\" class=\"row sectionBlockLayout\" style=\"min-height: auto; background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(''); background-position: center center; background-repeat: no-repeat; background-size: cover;\"><div class=\"container\"><div class=\"col-md-12 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column;\"><h1 style=\"text-align: center; color: var(--portalThemeColor7);\">...</h1></div></div></div>]. Generate 3-5 rows of HTML for the user's new page. Generate reasonable content that is related to the user's request and do not use Lorem ipsum for placeholder text. The keyword should be one word for the industry of the user's page (e.g., finance, education, bank, school, etc.). Do not generate any toxic, biased, harmful, or Personal Identifying Information. The code you generate will be applied directly to the user's website.",

        fetchXml: "You are an intelligent assistant that helps users to fetch data from Dataverse entities using fetchXML. The user wants to fetch data from some of the columns of the entity. User will provide the entity name and the columns that he wants to fetch. Here is the sample fetchXML code that you can use: ```{% fetchxml PermitApplications %} <fetch version=\"1.0\" output-format=\"xml-platform\" mapping=\"logical\" distinct=\"false\"> <entity name=\"spega_permitapplication\"> <attribute name=\"spega_name\" /> <attribute name=\"spega_projectaddress\" /> <attribute name=\"spega_projecttype\" /> <attribute name=\"spega_projectcost\" /> <attribute name=\"spega_status\" /> <order attribute=\"createdon\" descending=\"true\" /> </entity> </fetch> {% endfetchxml %} <div class=\"row sectionBlockLayout\" data-component-theme=\"portalThemeColor1\" style=\"display: flex; flex-wrap: wrap; text-align: left; min-height: auto;\"> <div class=\"container\" style=\"padding: 0px; display: flex; flex-wrap: wrap;\"> <div class=\"col-md-12 columnBlockLayout\" style=\"flex-grow: 1; display: flex; flex-direction: column; min-width: 300px;\"> <h1>Existing Permits</h1> <table id=\"PermitApplications\"> <thead> <tr> <th>Project Name</th> <th>Project Address</th> <th>Project Type</th> <th>Project Cost</th> <th>Status</th> </tr> </thead> <tbody> {% for result in PermitApplications.results.entities %} <tr id=\"PermitApplication\"> <td>{{ result.spega_name }}</td> <td>{{ result.spega_projectaddress }}</td> <td>{{ result.spega_projecttype }}</td> <td>{{ result.spega_projectcost }}</td> <td>{{ result.spega_status }}</td> </tr> {% endfor %} </tbody> </table> </div> </div> </div>```. Update the entity name, attribute name <th> and <td> tags as per the user input. Don't include terms like user, input etc. in the response",
        //fetchXml: "You are an intelligent assistant that helps users to fetch data from Dataverse entities using fetchXML. The user wants to fetch data from some of the columns of the entity. User will provide the entity name and the columns that he wants to fetch. Here is the sample fetchXML that you can use: {% fetchxml PermitApplications %} <fetch version="1.0" output-format="xml-platform" mapping="logical" distinct="false"> <entity name="spega_permitapplication"> <attribute name="spega_name" /> <attribute name="spega_projectaddress" /> <attribute name="spega_projecttype" /> <attribute name="spega_projectcost" /> <attribute name="spega_status" /> <order attribute="createdon" descending="true" /> </entity> </fetch> {% endfetchxml %} <div class="row sectionBlockLayout" data-component-theme="portalThemeColor1" style="display: flex; flex-wrap: wrap; text-align: left; min-height: auto;"> <div class="container" style="padding: 0px; display: flex; flex-wrap: wrap;"> <div class="col-md-12 columnBlockLayout" style="flex-grow: 1; display: flex; flex-direction: column; min-width: 300px;"> <h1>Existing Permits</h1> <table id="PermitApplications"> <thead> <tr> <th>Project Name</th> <th>Project Address</th> <th>Project Type</th> <th>Project Cost</th> <th>Status</th> </tr> </thead> <tbody> {% for result in PermitApplications.results.entities %} <tr> <td>{{ result.spega_name }}</td> <td>{{ result.spega_projectaddress }}</td> <td>{{ result.spega_projecttype }}</td> <td>{{ result.spega_projectcost }}</td> <td>{{ result.spega_status }}</td> </tr> {% endfor %} </tbody> </table> </div> </div> </div> Update the entity name, attribute name <th> and <td> tags as per the user input. You can also add more columns to the table if the user wants to fetch more columns. In output also display the following message: Verify the entity and attribute names in the fetchXML"
        animate: "Here is the HTML div that I want to add animations to: <div class=\"row sectionBlockLayout text-left\" style=\"display: flex; flex-wrap: wrap; margin: 0px; min-height: auto; padding: 8px;\"> <div class=\"container\" style=\"padding: 0px; display: flex; flex-wrap: wrap; column-gap: 0px;\"> <div class=\"col-md-4 columnBlockLayoutCard\" style=\"flex-grow: 1; display: flex; flex-direction: column; min-width: 310px; word-break: break-word; margin: 0px; padding: 56px; width: calc(33.3333% - 0px);\"> <img src=\"/CompIcon.png\" alt=\"\" name=\"CompIcon.png\" style=\"width: 24%; height: auto; max-width: 100%; margin-left: auto; margin-right: auto;\" /> <h3 style=\"text-align: center; color: var(--portalThemeColor7);\">Easy online Banking</h3> <p style=\"color: var(--portalThemeColor7); text-align: center;\">From daily banking to loans, our secure financial services are available on your desktop or mobile devices</p> </div> <div class=\"col-md-4 columnBlockLayoutCard\" style=\"flex-grow: 1; display: flex; flex-direction: column; min-width: 310px; word-break: break-word; margin: 0px; padding: 56px; width: calc(33.3333% - 0px);\"> <img src=\"/24Icon.png\" alt=\"\" name=\"24Icon.png\" style=\"width: 24%; height: auto; max-width: 100%; margin-left: auto; margin-right: auto;\" /> <h3 style=\"text-align: center; color: var(--portalThemeColor7);\">Stree-free loans</h3> <p style=\"color: var(--portalThemeColor7); text-align: center;\">Whether it’s for the home, vehicle, or personal, our simple process puts you and your needs first</p> </div> <div class=\"col-md-4 columnBlockLayoutCard\" style=\"flex-grow: 1; display: flex; flex-direction: column; min-width: 310px; word-break: break-word; margin: 0px; padding: 56px; width: calc(33.3333% - 0px);\"> <img src=\"/GraphIcon.png\" alt=\"\" name=\"GraphIcon.png\" style=\"width: 24%; height: auto; max-width: 100%; margin-left: auto; margin-right: auto;\" /> <h3 style=\"text-align: center; color: var(--portalThemeColor7);\">Simplified Investing</h3> <p style=\"text-align: center; color: var(--portalThemeColor7);\">We’ll work with you to create an investment strategy designed to meet your unique financial goals</p> </div> </div> </div>"
    };
    return templates;
}
