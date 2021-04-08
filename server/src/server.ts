/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
	createConnection,
	TextDocuments,
	ProposedFeatures,
	InitializeParams,
	DidChangeConfigurationNotification,
	CompletionItem,
	CompletionItemKind,
	TextDocumentPositionParams,
	TextDocumentSyncKind,
	InitializeResult
} from 'vscode-languageserver/node';
import { URL } from 'url';
import * as fs from 'fs';

import {
	TextDocument
} from 'vscode-languageserver-textdocument';

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;


connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;

	// Does the client support the `workspace/configuration` request?
	// If not, we fall back using global settings.
	hasConfigurationCapability = !!(
		capabilities.workspace && !!capabilities.workspace.configuration
	);
	hasWorkspaceFolderCapability = !!(
		capabilities.workspace && !!capabilities.workspace.workspaceFolders
	);
	hasDiagnosticRelatedInformationCapability = !!(
		capabilities.textDocument &&
		capabilities.textDocument.publishDiagnostics &&
		capabilities.textDocument.publishDiagnostics.relatedInformation
	);

	const result: InitializeResult = {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Incremental,
			// Tell the client that this server supports code completion.
			completionProvider: {
				resolveProvider: true
			}
		}
	};
	if (hasWorkspaceFolderCapability) {
		result.capabilities.workspace = {
			workspaceFolders: {
				supported: true
			}
		};
	}
	return result;
});

connection.onInitialized(() => {
	if (hasConfigurationCapability) {
		// Register for all configuration changes.
		connection.client.register(DidChangeConfigurationNotification.type, undefined);
	}
	if (hasWorkspaceFolderCapability) {
		connection.workspace.onDidChangeWorkspaceFolders(_event => {
			connection.console.log('Workspace folder change event received.');
		});
	}
});



// This handler provides the initial list of the completion items.
connection.onCompletion(
	async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		const editPath = _textDocumentPosition.textDocument.uri;
		const editFileUrl = new URL(editPath);
  		const rowIndex = _textDocumentPosition.position.line;
		return await getSuggestions(rowIndex ,editFileUrl);
	}
);

function getSuggestions(rowIndex: number, fileUrl: URL) {
	const lineByLine = require('n-readlines');
	const liner = new lineByLine(fileUrl);
	let line;
	let lineNumber = 0;
	let userEditedLine = '';

	while (line = liner.next()) {
		if (lineNumber == rowIndex) {
			userEditedLine = line.toString('ascii');
			break;
		}
		lineNumber++;
	}

	const portalAttributeKeyPattern = /"(.*?)":/;
	const matches = userEditedLine.match(portalAttributeKeyPattern);
	const completionItems: CompletionItem[] = [];
	if (matches) {
		var portalAttributeKeyForCompletion = matches[1].toString();
		// add a conditional check for "id"
		portalAttributeKeyForCompletion = portalAttributeKeyForCompletion.substring(0, portalAttributeKeyForCompletion.length - 2);
		// check for .portalConfig folder
		fileUrl.pathname = '/e%3A/pac_Demo/starter-portal/.portalconfig/orgb2f4db70.crm10.dynamics.com-manifest.json';
		const manifestData = fs.readFileSync(fileUrl, 'utf8');
		const manifest = JSON.parse(manifestData);
		const matchingManifestObject = manifest[portalAttributeKeyForCompletion];


		if (matchingManifestObject) {
			matchingManifestObject.forEach((element: any) => {
				const item: CompletionItem = {
					label: element.DisplayName + "("+ element.RecordId + ")",
					insertText: "\"" + element.RecordId + "\"",
					kind: CompletionItemKind.Value
				}
				completionItems.push(item);
			});
		}
	}
	return completionItems;
}

// function getPortalManifestFilePath(editFileUri: string) {
// 	const workspaceFolder = vscode.workspace.getWorkspaceFolder(URI.file(editFileUri));
// }

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
	(item: CompletionItem): CompletionItem => {
		if (item.data === 1) {
			item.detail = 'TypeScript details';
			item.documentation = 'TypeScript documentation';
		} else if (item.data === 2) {
			item.detail = 'JavaScript details';
			item.documentation = 'JavaScript documentation';
		}
		return item;
	}
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
