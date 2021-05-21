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

// eslint-disable-next-line @typescript-eslint/no-var-requires
const lineByLine = require('n-readlines');
interface ManifestElement {
    DisplayName: string;
    RecordId: string;
}

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let workspaceRootFolder: WorkspaceFolder[] | null = null;
const portalConfigFolderName = '.portalconfig';
const manifest = '-manifest';


connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;
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
        connection.workspace.onDidChangeWorkspaceFolders(() => {
            // connection.console.log('Workspace folder change event received.');
        });
    }
});



// This handler provides the initial list of the completion items.
connection.onCompletion(
	(_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
		// The pass parameter contains the position of the text document in
		// which code complete got requested. For the example we ignore this
		// info and always provide the same completion items.
		return [
			{
				label: 'SampleList (03b2a4a1-4eb9-eb11-bacd-0022481ec6a2)',
                insertText: 'SampleList',
				kind: CompletionItemKind.Value,
			},
            {
				label: 'AdsList (0b02a354-08ba-eb11-bacd-0022481eb3c7)',
                insertText: 'AdsList',
				kind: CompletionItemKind.Value,
			},
            {
				label: 'PollsList (34775e70-08ba-eb11-bacd-0022481eb3c7)',
                insertText: 'PollsList',
				kind: CompletionItemKind.Value,
			}
		];
	}
);


// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(
    (item: CompletionItem): CompletionItem => {
        return item;
    }
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
