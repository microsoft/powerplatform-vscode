/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { URI_CONSTANTS } from '../constants/uriConstants';
import { URI_HANDLER_STRINGS } from '../constants/uriStrings';
import { AgenticCreateHandler } from '../handlers/agenticCreateHandler';
import {
    AgenticCreateLinkStrings,
    buildSampleAgenticCreateLink,
    DEFAULT_ALLOWED_SCHEMES,
    validateAgenticCreateLink
} from '../utils/agenticCreateSampleLink';

/**
 * Minimal persistence contract used to remember the last link the developer ran.
 */
export interface AgenticCreateLocalTriggerStore {
    get<T>(key: string): T | undefined;
    update(key: string, value: unknown): Thenable<void> | void;
}

/**
 * Injectable dependencies so the command body can be exercised without driving real UI.
 */
export interface AgenticCreateLocalTriggerDependencies {
    isEnabled: () => boolean;
    showInputBox: (options: vscode.InputBoxOptions) => Thenable<string | undefined>;
    showWarningMessage: (message: string) => Thenable<string | undefined>;
    uriScheme: string;
}

const LINK_STRINGS: AgenticCreateLinkStrings = {
    required: URI_HANDLER_STRINGS.LOCAL_TRIGGER.LINK_REQUIRED,
    invalid: URI_HANDLER_STRINGS.LOCAL_TRIGGER.LINK_INVALID,
    unsupportedScheme: URI_HANDLER_STRINGS.LOCAL_TRIGGER.LINK_SCHEME_INVALID,
    unsupportedPath: URI_HANDLER_STRINGS.LOCAL_TRIGGER.LINK_PATH_INVALID,
    placeholdersRemaining: URI_HANDLER_STRINGS.LOCAL_TRIGGER.LINK_PLACEHOLDERS
};

const DEFAULT_DEPENDENCIES: AgenticCreateLocalTriggerDependencies = {
    isEnabled: () => AgenticCreateHandler.isEnabled(),
    showInputBox: (options) => vscode.window.showInputBox(options),
    showWarningMessage: (message) => vscode.window.showWarningMessage(message),
    uriScheme: vscode.env.uriScheme
};

/**
 * Fully-qualified id of the setting that turns the flow (and this command) on.
 */
const OVERRIDE_SETTING_ID =
    `${URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.NAMESPACE}.${URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.AGENTIC_CREATE_ENABLED}`;

/**
 * Prompts for an `/agenticCreate` deep link and dispatches it through the production URI
 * handler, so local testing exercises exactly the same code path Power Pages Home triggers.
 *
 * The input box is prefilled with the last link the developer ran (falling back to an editable
 * sample) and keeps focus, so a stray click cannot discard a half-typed link.
 *
 * @param handleUri Production deep-link dispatcher.
 * @param store Global state used to remember the last link.
 * @param dependencies Injectable dependencies used by tests.
 */
export async function runAgenticCreateLocalTrigger(
    handleUri: (uri: vscode.Uri) => Promise<void>,
    store?: AgenticCreateLocalTriggerStore,
    dependencies: AgenticCreateLocalTriggerDependencies = DEFAULT_DEPENDENCIES
): Promise<void> {
    if (!dependencies.isEnabled()) {
        await dependencies.showWarningMessage(
            URI_HANDLER_STRINGS.LOCAL_TRIGGER.DISABLED.replace('{0}', OVERRIDE_SETTING_ID)
        );
        return;
    }

    const allowedSchemes = Array.from(new Set([dependencies.uriScheme, ...DEFAULT_ALLOWED_SCHEMES]));
    const lastLink = store?.get<string>(URI_CONSTANTS.LOCAL_TRIGGER.LAST_LINK_KEY);

    const entered = await dependencies.showInputBox({
        title: URI_HANDLER_STRINGS.LOCAL_TRIGGER.INPUT_TITLE,
        prompt: URI_HANDLER_STRINGS.LOCAL_TRIGGER.INPUT_PROMPT,
        value: lastLink ?? buildSampleAgenticCreateLink(dependencies.uriScheme),
        ignoreFocusOut: true,
        validateInput: (input) => validateAgenticCreateLink(input, LINK_STRINGS, allowedSchemes)
    });

    if (entered === undefined) {
        return;
    }

    const link = entered.trim();
    // showInputBox already blocks invalid input; re-check so programmatic callers cannot bypass it.
    if (validateAgenticCreateLink(link, LINK_STRINGS, allowedSchemes)) {
        return;
    }

    await store?.update(URI_CONSTANTS.LOCAL_TRIGGER.LAST_LINK_KEY, link);
    await handleUri(vscode.Uri.parse(link));
}

/**
 * Registers the developer-only command that replays an agentic-create deep link locally.
 * @param handleUri Production deep-link dispatcher.
 * @param store Global state used to remember the last link.
 * @returns Disposable that unregisters the command.
 */
export function registerAgenticCreateLocalTrigger(
    handleUri: (uri: vscode.Uri) => Promise<void>,
    store?: AgenticCreateLocalTriggerStore
): vscode.Disposable {
    return vscode.commands.registerCommand(
        URI_CONSTANTS.LOCAL_TRIGGER.COMMAND_ID,
        () => runAgenticCreateLocalTrigger(handleUri, store)
    );
}
