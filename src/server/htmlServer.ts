/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { TagToken, Tokenizer, TokenKind } from 'liquidjs';
import { OutputToken } from 'liquidjs/dist/tokens';
import {
    TextDocument
} from 'vscode-languageserver-textdocument';
import {
    CompletionItem, createConnection, DidChangeConfigurationNotification, InitializeParams, InitializeResult, ProposedFeatures, TextDocumentPositionParams, TextDocuments, TextDocumentSyncKind, WorkspaceFolder
} from 'vscode-languageserver/node';
import { getEditedLineContent } from './lib/LineReader';
import { AUTO_COMPLETE_PLACEHOLDER } from './lib/LiquidAutoCompleteRule';
import { getSuggestionsFromRules, initLiquidRuleEngine } from './lib/LiquidAutoCompleteRuleEngine';



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
let workspaceRootFolders: WorkspaceFolder[] | null = null;
let editedTextDocument: TextDocument;
const liquidTagStartExpression = '{%';
const liquidTagEndExpression = '%}';

const liquidOutputStartExpression = '{{';
const liquidOutputEndExpression = '}}';




connection.onInitialize((params: InitializeParams) => {
    const capabilities = params.capabilities;
    workspaceRootFolders = params.workspaceFolders;
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
    initLiquidRuleEngine();

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
        const pathOfFileBeingEdited = _textDocumentPosition.textDocument.uri;
        const rowIndex = _textDocumentPosition.position.line;
        const colIndex = _textDocumentPosition.position.character;
        return getSuggestions(rowIndex, colIndex, pathOfFileBeingEdited);
    }
);

function getSuggestions(rowIndex: number, colIndex: number, pathOfFileBeingEdited: string) {
    const editedLine = getEditedLineContent(rowIndex, editedTextDocument);
    const liquidForAutocomplete = getEditedLiquidExpression(colIndex, editedLine);
    if (!liquidForAutocomplete) {
        return []
    }
    try {
        const tokenizer = new Tokenizer(
            liquidForAutocomplete.LiquidExpression.slice(0, liquidForAutocomplete.AutoCompleteAtIndex)
            + AUTO_COMPLETE_PLACEHOLDER
            + liquidForAutocomplete.LiquidExpression.slice(liquidForAutocomplete.AutoCompleteAtIndex
            ));
        const liquidTokens = tokenizer.readTopLevelTokens();
        if (liquidTokens[0].kind === TokenKind.HTML) {
            return []
        }
        return getSuggestionsFromRules(liquidTokens[0] as TagToken | OutputToken, { workspaceRootFolders, pathOfFileBeingEdited })
    } catch (e) {
        // Add telemetry log. Failed to parse liquid expression. (This may bloat up the logs so double check about this)
    }
    return []
}

function getEditedLiquidExpression(colIndex: number, editedLine: string) {
    try {
        return getLiquidExpression(editedLine, colIndex, liquidTagStartExpression, liquidTagEndExpression) || getLiquidExpression(editedLine, colIndex, liquidOutputStartExpression, liquidOutputEndExpression)
    } catch (e) {
        // Add Telemetry for index out of bounds...not a proper liquid expression. This may again bloat up the logs (since the autocomplete events can be fired even for non-portal html files)
    }
}

function getLiquidExpression(editedLine: string, colIndex: number, startDelimiter: string, endDelimiter: string) {
    const contentOnLeftOfCursor = editedLine.substring(0, colIndex);
    const startIndexOfEditedLiquidExpression = contentOnLeftOfCursor.lastIndexOf(startDelimiter)
    const editedLiquidExpressionOnLeftOfCursor = contentOnLeftOfCursor.substring(startIndexOfEditedLiquidExpression, contentOnLeftOfCursor.length);
    const contentOnRightOfCursor = editedLine.substring(colIndex, editedLine.length);
    const endIndexOfEditedLiquidExpression = contentOnRightOfCursor.indexOf(endDelimiter);
    const editedLiquidExpressionOnRightOfCursor = contentOnRightOfCursor.substring(0, endIndexOfEditedLiquidExpression + liquidTagEndExpression.length);
    if (startIndexOfEditedLiquidExpression >= 0 && endIndexOfEditedLiquidExpression >= 0) {
        return {
            LiquidExpression: editedLiquidExpressionOnLeftOfCursor + editedLiquidExpressionOnRightOfCursor,
            AutoCompleteAtIndex: colIndex - startIndexOfEditedLiquidExpression,
        } as ILiquidAutoComplete
    } else {
        return;
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
