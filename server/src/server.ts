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
	InitializeResult,
    WorkspaceFolder
} from 'vscode-languageserver/node';
import { URL } from 'url';
import * as path from 'path';
import * as fs from 'fs';
import * as YAML from 'yaml';

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
let workspaceRootFolder: WorkspaceFolder[] | null = null;
const portalConfigFolderName = '.portalconfig';


connection.onInitialize((params: InitializeParams) => {
	let capabilities = params.capabilities;
    workspaceRootFolder = params.workspaceFolders;
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
	// const YAML = require('yaml');

	const portalAttributeKeyPattern = /"(.*?)":/; // "adx_pagetemplateid":
	const matches = getEditedLineContent(rowIndex, fileUrl).match(portalAttributeKeyPattern);
	const completionItems: CompletionItem[] = [];
	if (matches) {
		const keyForCompletion = getKeyForCompletion(matches);
		let matchedManifestRecords:string[] = [];

		const portalConfigFolderUrl = getPortalConfigFolderUrl() as URL | null; //https://github.com/Microsoft/TypeScript/issues/11498
		if (portalConfigFolderUrl) {
			const portalConfigFolderPath = portalConfigFolderUrl.href;
			if (portalConfigFolderUrl && portalConfigFolderPath) {
				const configFiles: string[] = fs.readdirSync(portalConfigFolderUrl);
				configFiles.forEach(configFile => {
					if (configFile.includes('manifest')) {
						const manifestFilePath = path.join(portalConfigFolderPath, configFile);
						const manifestData = fs.readFileSync(new URL(manifestFilePath), 'utf8');
						const parsedManifestData = YAML.parse(manifestData);
						matchedManifestRecords = parsedManifestData[keyForCompletion];
					}
				})
			}

			if (matchedManifestRecords) {
				matchedManifestRecords.forEach((element: any) => {
					const item: CompletionItem = {
						label: element.DisplayName + "("+ element.RecordId + ")",
						insertText: "\"" + element.RecordId + "\"",
						kind: CompletionItemKind.Value
					}
					completionItems.push(item);
				});
			}
		}

	}
	return completionItems;
}

function getPortalConfigFolderUrl() {
	let workspaceRootFolderUri = workspaceRootFolder && workspaceRootFolder[0].uri;
	let portalConfigFolderUrl = null;
	if (workspaceRootFolderUri !== null) {
		let workspaceRootFolderUrl = new URL(workspaceRootFolderUri);
		const workspaceRootFolderContents: string[] = fs.readdirSync(workspaceRootFolderUrl);
		for (let i = 0; i <  workspaceRootFolderContents.length; i++) {
			const fileName = workspaceRootFolderContents[i];
			const filePath = path.join(workspaceRootFolderUrl.href, fileName);
			const fileUrl = new URL(filePath);
			const isDirectory = fs.statSync(fileUrl).isDirectory();
			if (isDirectory && fileName === portalConfigFolderName) {
				portalConfigFolderUrl = fileUrl;
				return portalConfigFolderUrl;
			}
		}
	}
	return portalConfigFolderUrl;
}

function getEditedLineContent(rowIndex: number, fileUrl: URL) {
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
	return userEditedLine;
}

function getKeyForCompletion(matches: RegExpMatchArray) {
	let portalAttributeKeyForCompletion = matches[1].toString(); // returns text from the capture group e.g. adx_pagetemplateid
	if (portalAttributeKeyForCompletion.length > 2 && portalAttributeKeyForCompletion.endsWith('id')) {
		portalAttributeKeyForCompletion = portalAttributeKeyForCompletion.substring(0, portalAttributeKeyForCompletion.length - 2); // we remove the id
	}
	return portalAttributeKeyForCompletion;
}


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
