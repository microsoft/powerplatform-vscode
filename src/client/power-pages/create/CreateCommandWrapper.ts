/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { GeneratorAcquisition } from "../../lib/GeneratorAcquisition";
import { sendTelemetryEvent, TriggerPoint, UserFileCreateEvent } from "../../../common/OneDSLoggerTelemetry/telemetry/telemetry";
import { createContentSnippet } from "./Contentsnippet";
import { CONTENT_SNIPPET, Tables, WEBFILE } from "./CreateOperationConstants";
import { createPageTemplate } from "./PageTemplate";
import { getSelectedWorkspaceFolder } from "./utils/CommonUtils";
import { createWebfile } from "./Webfile";
import { createWebpage } from "./Webpage";
import { createWebTemplate } from "./WebTemplate";
const activeEditor = vscode.window.activeTextEditor;

function showGeneratorNotAvailableError(generator: GeneratorAcquisition): void {
    const retryAction = vscode.l10n.t('Retry Installation');
    vscode.window.showErrorMessage(
        vscode.l10n.t('Power Pages generator is not available. Please ensure npm is installed and try again.'),
        retryAction
    ).then(selection => {
        if (selection === retryAction) {
            const result = generator.ensureInstalled();
            if (result) {
                vscode.window.showInformationMessage(
                    vscode.l10n.t('Power Pages generator installed successfully. Please reload the window to use the commands.')
                );
            }
        }
    });
}

export function initializeGenerator(
    context: vscode.ExtensionContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliContext: any
): void {
    const generator = new GeneratorAcquisition(cliContext);
    generator.ensureInstalled();
    context.subscriptions.push(generator);
    const yoCommandPath = generator.yoCommandPath;
    
    // Always register commands, even if generator installation failed
    // Commands will show appropriate error messages if generator is not available
    registerCreateCommands(context, yoCommandPath, generator);
    
    if (yoCommandPath) {
        vscode.workspace
            .getConfiguration("powerPlatform")
            .update("generatorInstalled", true, true);
    }
}

function registerCreateCommands(
    context: vscode.ExtensionContext,
    yoCommandPath: string | null,
    generator: GeneratorAcquisition
) {
    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.contentsnippet",
        async (uri) => {
            const triggerPoint = uri ? TriggerPoint.CONTEXT_MENU : TriggerPoint.COMMAND_PALETTE;
            sendTelemetryEvent({ methodName: registerCreateCommands.name, eventName: UserFileCreateEvent, fileEntityType: CONTENT_SNIPPET, triggerPoint: triggerPoint });
            
            if (!yoCommandPath) {
                showGeneratorNotAvailableError(generator);
                return;
            }
            
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor,
            );
            createContentSnippet(
                context,
                selectedWorkspaceFolder,
                yoCommandPath
            );
        }
    );

    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.webtemplate",
        async (uri) => {
            const triggerPoint = uri ? TriggerPoint.CONTEXT_MENU : TriggerPoint.COMMAND_PALETTE;
            sendTelemetryEvent({ methodName: registerCreateCommands.name, eventName: UserFileCreateEvent, fileEntityType: Tables.WEBTEMPLATE, triggerPoint: triggerPoint });
            
            if (!yoCommandPath) {
                showGeneratorNotAvailableError(generator);
                return;
            }
            
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor,
            );
            createWebTemplate(
                context,
                selectedWorkspaceFolder,
                yoCommandPath
            );
        }
    );

    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.webpage",
        async (uri) => {
            const triggerPoint = uri ? TriggerPoint.CONTEXT_MENU : TriggerPoint.COMMAND_PALETTE;
            sendTelemetryEvent({ methodName: registerCreateCommands.name, eventName: UserFileCreateEvent, fileEntityType: Tables.WEBPAGE, triggerPoint: triggerPoint });
            
            if (!yoCommandPath) {
                showGeneratorNotAvailableError(generator);
                return;
            }
            
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor,
            );
            createWebpage(
                context,
                selectedWorkspaceFolder,
                yoCommandPath
            );
        }
    );

    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.pagetemplate",
        async (uri) => {
            const triggerPoint = uri ? TriggerPoint.CONTEXT_MENU : TriggerPoint.COMMAND_PALETTE;
            sendTelemetryEvent({ methodName: registerCreateCommands.name, eventName: UserFileCreateEvent, fileEntityType: Tables.PAGETEMPLATE, triggerPoint: triggerPoint });
            
            if (!yoCommandPath) {
                showGeneratorNotAvailableError(generator);
                return;
            }
            
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor,
            );
            createPageTemplate(
                context,
                selectedWorkspaceFolder,
                yoCommandPath
            );
        }
    );

    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.webfile",
        async (uri) => {
            const triggerPoint = uri ? TriggerPoint.CONTEXT_MENU : TriggerPoint.COMMAND_PALETTE;
            sendTelemetryEvent({ methodName: registerCreateCommands.name, eventName: UserFileCreateEvent, fileEntityType: WEBFILE, triggerPoint: triggerPoint });
            
            if (!yoCommandPath) {
                showGeneratorNotAvailableError(generator);
                return;
            }
            
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor,
            );
            createWebfile(
                selectedWorkspaceFolder,
                yoCommandPath
            );
        }
    );
}
