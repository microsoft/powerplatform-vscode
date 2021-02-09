// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { CliAcquisition } from './lib/CliAcquisition';
import { PacTerminal } from './lib/PacTerminal';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const cli = new CliAcquisition(context, '1.5.2');
    const cliPath = await cli.ensureInstalled();
    context.subscriptions.push(cli);
    context.subscriptions.push(new PacTerminal(context, cliPath));
}

// export function deactivate(): void {}
