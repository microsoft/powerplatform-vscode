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
import {
    TextDocument
} from 'vscode-languageserver-textdocument';
import * as nearley from 'nearley';
import { getEditedLineContent } from './lib/LineReader';
import { getMatchedManifestRecords, IManifestElement } from './lib/PortalManifestReader';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const grammar = require('./Parser/liquidTagGrammar.js');

interface ILiquidAutoComplete {
    LiquidExpression: string;
    AutoCompleteAtIndex: number;
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
let editedTextDocument: TextDocument;
const startTagOfLiquidExpression = '{%';
const endTagOfLiquidExpression = '%}';



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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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


// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent(change => {
	editedTextDocument = (change.document);
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
    async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
        const rowIndex = _textDocumentPosition.position.line;
        const colIndex = _textDocumentPosition.position.character;
        return await getSuggestions(rowIndex, colIndex);
    }
);

function getSuggestions(rowIndex: number, colIndex: number) {
    const completionItems: CompletionItem[] = [];
    const editedLine = getEditedLineContent(rowIndex, editedTextDocument);
    const liquidForAutocomplete = getEditedLiquidExpression(colIndex, editedLine);
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    let liquidTagForCompletion = null;
    let liquidKeyForCompletion = '';
    if (liquidForAutocomplete.LiquidExpression && liquidForAutocomplete.AutoCompleteAtIndex) {
        try {
            parser.feed(liquidForAutocomplete.LiquidExpression);
            liquidTagForCompletion = parser.results[0]?.tag;
            liquidKeyForCompletion = parser.results[0]?.map[liquidForAutocomplete.AutoCompleteAtIndex];
        } catch (e) {
            // Add telemetry log. Failed to parse liquid expression. (This may bloat up the logs so double check about this)
        }
        if (liquidTagForCompletion && liquidKeyForCompletion) {
            const keyForCompletion = getKeyForCompletion(liquidTagForCompletion);
            const matchedManifestRecords: IManifestElement[] = getMatchedManifestRecords(workspaceRootFolder, keyForCompletion);

            if (matchedManifestRecords) {
                matchedManifestRecords.forEach((element: IManifestElement) => {
                    const item: CompletionItem = {
                        label: '',
                        insertText: '',
                        kind: CompletionItemKind.Value
                    }
                    switch (liquidKeyForCompletion) {
                        case 'id': {
                            item.label = element.DisplayName + " (" + element.RecordId + ")";
                            item.insertText = element.RecordId;
                            break;
                        }
                        case 'name': {
                            item.label = element.DisplayName + " (" + element.RecordId + ")";
                            item.insertText = element.DisplayName;
                            break;
                        }
                        case 'key': {
                            item.label = element.DisplayName + " (" + element.RecordId + ")";
                            item.insertText = element.DisplayName;
                            break;
                        }
                        case 'editable_tag_value': {
                            item.label = element.DisplayName + " (" + element.RecordId + ")";
                            item.insertText = element.DisplayName;
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                    completionItems.push(item);
                });
            }

        }
    }
    return completionItems;
}

function getEditedLiquidExpression(colIndex: number, editedLine: string) {
    const liquidForAutocomplete: ILiquidAutoComplete = {
        LiquidExpression: '',
        AutoCompleteAtIndex: -1,
    }
    try {
        const contentOnLeftOfCursor = editedLine.substring(0, colIndex);
        const startIndexOfEditedLiquidExpression = contentOnLeftOfCursor.lastIndexOf(startTagOfLiquidExpression);
        const editedLiquidExpressionOnLeftOfCursor = contentOnLeftOfCursor.substring(startIndexOfEditedLiquidExpression, contentOnLeftOfCursor.length);
        const contentOnRightOfCursor = editedLine.substring(colIndex, editedLine.length);
        const endIndexOfEditedLiquidExpression = contentOnRightOfCursor.indexOf(endTagOfLiquidExpression);
        const editedLiquidExpressionOnRightOfCursor = contentOnRightOfCursor.substring(0, endIndexOfEditedLiquidExpression + endTagOfLiquidExpression.length);
        if (editedLiquidExpressionOnLeftOfCursor && editedLiquidExpressionOnRightOfCursor) {
            liquidForAutocomplete.LiquidExpression = editedLiquidExpressionOnLeftOfCursor + editedLiquidExpressionOnRightOfCursor;
            liquidForAutocomplete.AutoCompleteAtIndex = colIndex - startIndexOfEditedLiquidExpression;
        }
    } catch (e) {
        // Add Telemetry for index out of bounds...not a proper liquid expression
    }
    return liquidForAutocomplete;
}

function getKeyForCompletion(liquidTag: string): string {
    switch (liquidTag) {
        case 'entityList': {
            return 'adx_entitylist';
        }
        case 'entityform': {
            return 'adx_entityform';
        }
        case 'webform': {
            return 'adx_webform';
        }
        case 'snippets': {
            return 'adx_contentsnippet';
        }
        default: {
            return '';
        }
    }
}


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
