/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext): void {

	console.log("Activated web extension!");

	context.subscriptions.push(vscode.commands.registerCommand("helloworld-web-sample.helloWorld", () => {

		vscode.window.showInformationMessage("Hello World from web extension!");
	}));
}
