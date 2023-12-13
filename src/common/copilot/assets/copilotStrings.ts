/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */


import vscode from "vscode";

export const COPILOT_STRINGS = {
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
    WELCOME_MESSAGE: vscode.l10n.t(`In your own words, describe what you need. You can get help with writing code for Power Pages sites in HTML, CSS, and JS languages.`),
    DOCUMENTATION_LINK: vscode.l10n.t("To know more, see <a href=\"https://go.microsoft.com/fwlink/?linkid=2206366\">Copilot in Power Pages documentation."),
    WORKING_ON_IT_MESSAGE: vscode.l10n.t("Working on it...")
}
