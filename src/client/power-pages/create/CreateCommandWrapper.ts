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

export function initializeGenerator(
    context: vscode.ExtensionContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliContext: any
): void {
    const generator = new GeneratorAcquisition(cliContext);
    const yoCommandPath = generator.ensureInstalled();
    context.subscriptions.push(generator);
    if (yoCommandPath) {
        registerCreateCommands(context, yoCommandPath);
        vscode.workspace
            .getConfiguration("powerPlatform")
            .update("generatorInstalled", true, true);
    }
}

function registerCreateCommands(
    context: vscode.ExtensionContext,
    yoCommandPath: string
) {
    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.contentsnippet",
        async (uri) => {
            const triggerPoint = uri ? TriggerPoint.CONTEXT_MENU : TriggerPoint.COMMAND_PALETTE;
            sendTelemetryEvent({ methodName: registerCreateCommands.name, eventName: UserFileCreateEvent, fileEntityType: CONTENT_SNIPPET, triggerPoint: triggerPoint });
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
