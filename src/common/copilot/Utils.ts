/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { createWebpage } from "../../client/power-pages/create/Webpage";
import * as vscode from "vscode";
import path from "path";
let _context: vscode.ExtensionContext;

export function createAiWebpage(_prompt: string):void {
    const yoGenPackagePath = path.join("node_modules", ".bin", "yo");
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    createWebpage(
        _context,
        workspaceFolder,
        yoGenPackagePath,
        _prompt
    )
}

export function getTemplates() {
    const templates = {
        base: `You are a web developer using power portal or power pages platform for development. Power Pages uses liquid as a templating language and Bootstrap v3.3.6. Always give code snippets enclosed within \`+"${"```"}" +\` and never without it.`,

        entityList: `The list gets its data asynchronously, and when it's complete it will trigger an event 'loaded' that your custom JavaScript can listen for and do something with items in the grid. The following code is a sample javascript code: \`+"${"```"}" +\` $(document).ready(function () { $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("tr").each(function () { // do something with each row $(this).css("background-color", "yellow"); }); }); }); \`+"${"```"}" +\` Find a particular attribute field and get its value to possibly modify the rendering of the value. The following code gets each table cell that contains the value of the accountnumber attribute. Replace accountnumber with an attribute appropriate for your table and view. \`+"${"```"}" +\` $(document).ready(function (){ $(".entitylist.entity-grid").on("loaded", function () { $(this).children(".view-grid").find("td[data-attribute='accountnumber']").each(function (i, e){ var value = $(this).data(value); \`+"${"```"}" +\` // now that you have the value you can do something to the value }); }); });`,

        entityForm: `In a form On click of the Next/Submit button, a function named entityFormClientValidate is executed. You can extend this method to add custom validation logic for example refer the following javascript code: \`+"${"```"}" +\` if (window.jQuery) { (function ($) { if (typeof (entityFormClientValidate) != 'undefined') { var originalValidationFunction = entityFormClientValidate; if (originalValidationFunction && typeof (originalValidationFunction) == 'function') { entityFormClientValidate = function() { originalValidationFunction.apply(this, arguments); // do your custom validation here // return false; // to prevent the form submit you need to return false // end custom validation. return true; }; } } }(window.jQuery)); } To customize the validation of fields on the form you can write something like this: if (window.jQuery) { (function ($) { $(document).ready(function () { if (typeof (Page_Validators) == 'undefined') return; // Create new validator var newValidator = document.createElement('span'); newValidator.style.display = 'none'; newValidator.id = 'emailaddress1Validator'; newValidator.controltovalidate = 'emailaddress1'; newValidator.errormessage = '<a href="#emailaddress1_label" referencecontrolid="emailaddress1" onclick="javascript:scrollToAndFocus(\\"emailaddress1_label\\",\\"emailaddress1\\");return false;">Email is a required field.</a>'; newValidator.validationGroup = ''; // Set this if you have set ValidationGroup on the form newValidator.initialvalue = ''; newValidator.evaluationfunction = function () { var contactMethod = $('#preferredcontactmethodcode').val(); if (contactMethod != 2) return true; // check if contact method is not 'Email'. // only require email address if preferred contact method is email. var value = $('#emailaddress1').val(); if (value == null || value == '') { return false; } else { return true; } }; // Add the new validator to the page validators array: Page_Validators.push(newValidator); }); }(window.jQuery)); } \`+"${"```"}" +\`  Note: The above code is just an example for adding validations to the form. The actual prompt might be different based on the requirement`,

        webPage: `Power pages webpages have the following HTML code structure: \`+"${"```"}" +\` <div class="row sectionBlockLayout" data-component-theme="portalThemeColor6" style="display: flex; flex-wrap: wrap; height: 15px; min-height: 15px;"></div>\n<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap; text-align: left; min-height: auto;">\n  <div class="container" style="padding: 0px; display: flex; flex-wrap: wrap;">\n    <div class="col-md-12 columnBlockLayout" style="flex-grow: 1; display: flex; flex-direction: column; min-width: 300px;">\n      <h1>Contact us</h1>\n    </div>\n  </div>\n</div>\n<div class="row sectionBlockLayout" style="display: flex; flex-wrap: wrap;text-align: left; min-height: 374px;">\n  <div class="container" style="padding: 0px; display: flex; flex-wrap: wrap;">\n    <div class="col-md-12 columnBlockLayout" style="flex-grow: 1; display: flex; flex-direction: column; min-width: 300px;">\n      {% entityform name: 'simple contact us form' %}\n    </div>\n  </div>\n</div>\n<div class="row sectionBlockLayout" data-component-theme="portalThemeColor2" style="display: flex; flex-wrap: wrap; min-height: 28px;"></div>\n<div class="row sectionBlockLayout" data-component-theme="portalThemeColor6" style="display: flex; flex-wrap: wrap; min-height: 52px;"></div> \`+"${"```"}"`,
    };
    return templates;
}