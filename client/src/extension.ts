// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { CliAcquisition } from './lib/CliAcquisition';
import { PacTerminal } from './lib/PacTerminal';
import * as path from 'path';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: vscode.ExtensionContext): Promise<void> {


    const isPaportalFeatureEnabled = vscode.workspace.getConfiguration('powerplatform-vscode').get('enablePortalFeatures');
    if (isPaportalFeatureEnabled) {
        // add  portal specific features in this block
    }

    const cli = new CliAcquisition(context, '1.5.2');
    const cliPath = await cli.ensureInstalled();
    context.subscriptions.push(cli);
    context.subscriptions.push(new PacTerminal(context, cliPath));
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
