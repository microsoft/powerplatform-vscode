/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { GeneratorAcquisition } from "../../lib/GeneratorAcquisition";
import { ITelemetry } from "../../telemetry/ITelemetry";
import { sendTelemetryEventWithTriggerPoint } from "../telemetry";
import { createContentSnippet } from "./Contentsnippet";
import { Tables} from "./CreateOperationConstants";
import { getSelectedWorkspaceFolder} from "./utils/CommonUtils";
import { createWebTemplate } from "./WebTemplate";
const activeEditor = vscode.window.activeTextEditor;

export function initializeGenerator(
    context: vscode.ExtensionContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cliContext: any,
    telemetry: ITelemetry
): void {
    const generator = new GeneratorAcquisition(cliContext);
    generator.ensureInstalled();
    context.subscriptions.push(generator);
    const yoCommandPath = generator.yoCommandPath;
    if (yoCommandPath) {
        registerCreateCommands(context, yoCommandPath, telemetry);
    }
}

function registerCreateCommands(
    context: vscode.ExtensionContext,
    yoCommandPath: string,
    telemetry: ITelemetry
) {
    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.contentsnippet",
        async (uri) => {
            sendTelemetryEventWithTriggerPoint(Tables.CONTENT_SNIPPET, uri, telemetry);
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor,
            );
            createContentSnippet(
                context,
                selectedWorkspaceFolder,
                yoCommandPath,
                telemetry
            );
        }
    );

    vscode.commands.registerCommand(
        "microsoft-powerapps-portals.webtemplate",
        async (uri) => {
            sendTelemetryEventWithTriggerPoint(Tables.WEBTEMPLATE, uri, telemetry);
            const selectedWorkspaceFolder = await getSelectedWorkspaceFolder(
                uri,
                activeEditor,
            );
            createWebTemplate(
                context,
                selectedWorkspaceFolder,
                yoCommandPath,
                telemetry
            );
        }
    );
}
