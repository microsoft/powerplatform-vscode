// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode';
import { AcquireCli } from './lib/AcquireCli';
import { PacTerminal } from './lib/PacTerminal';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    const acquisition = new AcquireCli(context, '1.4.4');
    const cliPath = await acquisition.ensureInstalled();
    context.subscriptions.push(acquisition);
    context.subscriptions.push(new PacTerminal(context, cliPath));
}

// export function deactivate(): void {}
