/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ServerApiCompletionProvider, ServerApiDefinitions } from '../ServerApiCompletionProvider';

/**
 * Test suite for Server API autocomplete functionality
 */
suite('Server API Autocomplete Tests', () => {

    suite('ServerApiDefinitions', () => {
        test('should return all API definitions', () => {
            const definitions = ServerApiDefinitions.getDefinitions();

            assert.strictEqual(definitions.length, 3);
            assert.ok(definitions.find(d => d.name === 'Logger'));
            assert.ok(definitions.find(d => d.name === 'Connector'));
            assert.ok(definitions.find(d => d.name === 'Connector.HttpClient'));
            assert.ok(definitions.find(d => d.name === 'Connector.Dataverse'));
        });

        test('should return specific namespace definition', () => {
            const loggerDef = ServerApiDefinitions.getNamespace('Logger');

            assert.ok(loggerDef);
            assert.strictEqual(loggerDef.name, 'Logger');
            assert.ok(loggerDef.methods);
            assert.ok(loggerDef.methods.find(m => m.name === 'Log'));
        });

        test('should return HttpClient namespace definition', () => {
            const httpClientDef = ServerApiDefinitions.getNamespace('Connector.HttpClient');

            assert.ok(httpClientDef);
            assert.strictEqual(httpClientDef.name, 'Connector.HttpClient');
            assert.ok(httpClientDef.methods);
            assert.ok(httpClientDef.methods.find(m => m.name === 'Get'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'Post'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'Patch'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'Put'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'Delete'));
        });

        test('should return Dataverse namespace definition', () => {
            const dataverseDef = ServerApiDefinitions.getNamespace('Connector.Dataverse');

            assert.ok(dataverseDef);
            assert.strictEqual(dataverseDef.name, 'Connector.Dataverse');
            assert.ok(dataverseDef.methods);
            assert.ok(dataverseDef.methods.find(m => m.name === 'CreateRecord'));
            assert.ok(dataverseDef.methods.find(m => m.name === 'RetrieveRecord'));
            assert.ok(dataverseDef.methods.find(m => m.name === 'RetrieveMultipleRecords'));
            assert.ok(dataverseDef.methods.find(m => m.name === 'UpdateRecord'));
            assert.ok(dataverseDef.methods.find(m => m.name === 'DeleteRecord'));
        });

        test('should return undefined for unknown namespace', () => {
            const unknownDef = ServerApiDefinitions.getNamespace('UnknownNamespace');
            assert.strictEqual(unknownDef, undefined);
        });
    });

    suite('ServerApiCompletionProvider', () => {
        let provider: ServerApiCompletionProvider;

        setup(() => {
            provider = new ServerApiCompletionProvider();
        });

        test('should provide namespace completions after "Server."', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 7); // After "Server."
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            // Should include top-level namespace completions
            assert.ok(completionArray.find(c => c.label === 'Logger'));
            assert.ok(completionArray.find(c => c.label === 'Connector'));
        });

        test('should provide sub-namespace completions for Connector', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Connector.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 17); // After "Server.Connector."
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            // Should include Connector sub-namespace completions
            assert.ok(completionArray.find(c => c.label === 'HttpClient'));
            assert.ok(completionArray.find(c => c.label === 'Dataverse'));
        });

        test('should provide method completions for Logger namespace', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Logger.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 14); // After "Server.Logger."
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            // Should include Logger method completions
            assert.ok(completionArray.find(c => c.label === 'Log'));
        });

        test('should provide method completions for HttpClient namespace', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Connector.HttpClient.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 28); // After "Server.Connector.HttpClient."
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            // Should include HttpClient method completions
            assert.ok(completionArray.find(c => c.label === 'Get'));
            assert.ok(completionArray.find(c => c.label === 'Post'));
            assert.ok(completionArray.find(c => c.label === 'Patch'));
            assert.ok(completionArray.find(c => c.label === 'Put'));
            assert.ok(completionArray.find(c => c.label === 'Delete'));
        });

        test('should provide method completions for Dataverse namespace', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Connector.Dataverse.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 27); // After "Server.Connector.Dataverse."
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            // Should include Dataverse method completions
            assert.ok(completionArray.find(c => c.label === 'CreateRecord'));
            assert.ok(completionArray.find(c => c.label === 'RetrieveRecord'));
            assert.ok(completionArray.find(c => c.label === 'RetrieveMultipleRecords'));
            assert.ok(completionArray.find(c => c.label === 'UpdateRecord'));
            assert.ok(completionArray.find(c => c.label === 'DeleteRecord'));
        });

        test('should not provide completions for non-Server context', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'console.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 8); // After "console."
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            // Should not provide any completions for non-Server context
            assert.strictEqual(completionArray.length, 0);
        });

        test('should provide completions with proper documentation', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Logger.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 14); // After "Server.Logger."
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            const logCompletion = completionArray.find(c => c.label === 'Log');
            assert.ok(logCompletion);
            assert.ok(logCompletion.documentation);
            assert.strictEqual(logCompletion.kind, vscode.CompletionItemKind.Method);
        });
    });
});

/**
 * Sample usage examples for testing Server API autocomplete in JavaScript files
 */
export const ServerApiUsageExamples = {
    logger: `
// Logger examples - type "Server.Logger." to see autocomplete in .js files
Server.Logger.Log('Application started');
Server.Logger.Log('User logged in: ' + userId);
Server.Logger.Log('Processing request for: ' + requestData);
`,

    httpClient: `
// HTTP Client examples - type "Server.Connector.HttpClient." to see autocomplete in .js files
// Note: This will block access to Dataverse
const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
const response = Server.Connector.HttpClient.Get('https://api.example.com/data', headers);
const postResult = Server.Connector.HttpClient.Post('https://api.example.com/users', JSON.stringify(userData), headers);
const patchResult = Server.Connector.HttpClient.Patch('https://api.example.com/users/123', JSON.stringify(updatedData), headers);
const putResult = Server.Connector.HttpClient.Put('https://api.example.com/users/123', JSON.stringify(updatedData), headers);
Server.Connector.HttpClient.Delete('https://api.example.com/users/123', headers);
`,

    dataverse: `
// Dataverse examples - type "Server.Connector.Dataverse." to see autocomplete in .js files
const contactPayload = JSON.stringify({ firstname: 'John', lastname: 'Doe', emailaddress1: 'john@example.com' });
const newContactId = Server.Connector.Dataverse.CreateRecord('contacts', contactPayload);

const contact = Server.Connector.Dataverse.RetrieveRecord('contacts', contactId, '$select=firstname,lastname,emailaddress1');
const contacts = Server.Connector.Dataverse.RetrieveMultipleRecords('contacts', '$filter=lastname eq \\'Smith\\'&$select=firstname,lastname');

const updatePayload = JSON.stringify({ firstname: 'Jane' });
Server.Connector.Dataverse.UpdateRecord('contacts', contactId, updatePayload);

Server.Connector.Dataverse.DeleteRecord('contacts', contactId);
`,

    connector: `
// Connector examples - type "Server.Connector." to see sub-namespace options in .js files
// Choose between HttpClient or Dataverse:
Server.Connector.HttpClient.Get(url, headers);  // For external API calls
Server.Connector.Dataverse.RetrieveRecord(entitySetName, id, options);  // For Dataverse operations
`
};
