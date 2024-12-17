/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import { Progress } from 'vscode';
import { CancellationToken } from 'vscode-languageserver';

export async function showProgressNotification<R>(title: string, task: (progress: Progress<{
    message: string;
    increment?: number;
}>, token: CancellationToken) => Thenable<R>) {
    await vscode.window.withProgress<R>({
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: false
    }, async (progress, token) => await task(progress, token));
}
