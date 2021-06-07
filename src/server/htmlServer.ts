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
import {sendTelemetryEvent} from './telemetry/ServerTelemetry';
import * as nearley from 'nearley';
import { URL } from 'url';
import { getEditedLineContent } from './lib/LineReader';
import { getMatchedManifestRecords, IManifestElement } from './lib/PortalManifestReader';
import {
    TextDocument
} from 'vscode-languageserver-textdocument';
import { TelemetryData } from '../common/TelemetryData';
import * as TelemetryConstants from './telemetry/TelemetryConstants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const grammar = require('./Parser/liquidTagGrammar.js');

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
let workspaceRootFolder: WorkspaceFolder[] | null = null;
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



// This handler provides the initial list of the completion items.
connection.onCompletion(
    async (_textDocumentPosition: TextDocumentPositionParams): Promise<CompletionItem[]> => {
        const editPath = _textDocumentPosition.textDocument.uri;
        const editFileUrl = new URL(editPath);
        const rowIndex = _textDocumentPosition.position.line;
        const colIndex = _textDocumentPosition.position.character;
        return await getSuggestions(rowIndex, colIndex, editFileUrl);
    }
);

function getSuggestions(rowIndex: number, colIndex: number, fileUrl: URL) {
    const autoCompleteTelemetryData = new TelemetryData(TelemetryConstants.AUTOCOMPLETE);
    autoCompleteTelemetryData.addProperty(TelemetryConstants.SERVER, TelemetryConstants.HTML_SERVER);
    const completionItems: CompletionItem[] = [];
    const editedLine = getEditedLineContent(rowIndex, fileUrl);
    const editedLiquidExpression = getEditedLiquidExpression(colIndex, editedLine);
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
    let liquidTagForCompletion = null;
    let liquidKeyForCompletion = '';
    if (editedLiquidExpression) {
        const timeStampBeforeLiquidParsing = new Date().getTime();
        try {
            parser.feed(editedLiquidExpression);
            liquidTagForCompletion = (parser.results[0]?.output?.tag[0]?.output?.output) ?
                parser.results[0]?.output?.tag[0]?.output?.output :
                parser.results[0]?.output?.tag[0];
            liquidKeyForCompletion = parser.results[0]?.output?.key[0];
        } catch (e) {
            // Add telemetry log. Failed to parse liquid expression. (This may bloat up the logs so double check about this)
        }
        autoCompleteTelemetryData.addMeasurement(TelemetryConstants.TIME_TAKEN_TO_PARSE, new Date().getTime() - timeStampBeforeLiquidParsing);
        if (liquidTagForCompletion && liquidKeyForCompletion) {
            autoCompleteTelemetryData.addProperty(TelemetryConstants.TAG_FOR_COMPLETION, liquidTagForCompletion);
            autoCompleteTelemetryData.addProperty(TelemetryConstants.KEY_FOR_COMPLETION, liquidKeyForCompletion);
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
                        default: {
                            break;
                        }
                    }
                    completionItems.push(item);
                });
            }

        }
    }
    if(completionItems.length > 0) {
        autoCompleteTelemetryData.addProperty(TelemetryConstants.AUTO_COMPLETE_RESULT, TelemetryConstants.SUCCESS);
        autoCompleteTelemetryData.addMeasurement(TelemetryConstants.COUNT_OF_AUTOCOMPLETE_RESULTS, completionItems.length);
        sendTelemetryEvent(connection, autoCompleteTelemetryData); // we send telemetry data only in case of success otherwise the logs will be bloated with unnecessary data
    }
    return completionItems;
}

function getEditedLiquidExpression(colIndex: number, editedLine: string) {
    let editedLiquidExpression = '';
    try {
        const contentOnLeftOfCursor = editedLine.substring(0, colIndex);
        const startIndexOfEditedLiquidExpression = contentOnLeftOfCursor.lastIndexOf(startTagOfLiquidExpression);
        const editedLiquidExpressionOnLeftOfCursor = contentOnLeftOfCursor.substring(startIndexOfEditedLiquidExpression, contentOnLeftOfCursor.length);
        const contentOnRightOfCursor = editedLine.substring(colIndex, editedLine.length);
        const endIndexOfEditedLiquidExpression = contentOnRightOfCursor.indexOf(endTagOfLiquidExpression);
        const editedLiquidExpressionOnRightOfCursor = contentOnRightOfCursor.substring(0, endIndexOfEditedLiquidExpression + endTagOfLiquidExpression.length);
        if (editedLiquidExpressionOnLeftOfCursor && editedLiquidExpressionOnRightOfCursor) {
            editedLiquidExpression = editedLiquidExpressionOnLeftOfCursor + editedLiquidExpressionOnRightOfCursor;
        }
    } catch (e) {
        // Add Telemetry for index out of bounds...not a proper liquid expression. This may again bloat up the logs (since the autocomplete events can be fired even for non-portal html files)
    }
    return editedLiquidExpression;
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
