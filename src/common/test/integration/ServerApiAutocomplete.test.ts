/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { ServerApiCompletionProvider, ServerApiDefinitions, ServerApiAutocompleteRegistrar } from '../../intellisense';

/**
 * Test suite for Server API autocomplete functionality
 */
suite('Server API Autocomplete Tests', () => {
    let mockContext: vscode.ExtensionContext;
    let disposables: vscode.Disposable[] = [];

    suiteSetup(async () => {
        // Create a mock extension context
        mockContext = {
            subscriptions: []
        } as unknown as vscode.ExtensionContext;

        // Register the completion provider for the tests
        disposables = ServerApiAutocompleteRegistrar.registerDefaultLanguages(mockContext);
    });

    suiteTeardown(() => {
        // Dispose all registered providers
        disposables.forEach(d => d.dispose());
    });

    suite('ServerApiDefinitions', () => {
        test('should return all required API namespace definitions', () => {
            const definitions = ServerApiDefinitions.getDefinitions();

            // Ensure key namespaces exist
            assert.ok(definitions.find(d => d.name === 'Logger'));
            assert.ok(definitions.find(d => d.name === 'Connector'));
            assert.ok(definitions.find(d => d.name === 'Connector.HttpClient'));
            assert.ok(definitions.find(d => d.name === 'Connector.Dataverse'));
            assert.ok(definitions.find(d => d.name === 'Context'));
            assert.ok(definitions.find(d => d.name === 'Sitesetting'));
            assert.ok(definitions.find(d => d.name === 'Website'));
            assert.ok(definitions.find(d => d.name === 'Website.adx_defaultlanguage'));
            assert.ok(definitions.find(d => d.name === 'Website.adx_footerwebtemplateid'));
            assert.ok(definitions.find(d => d.name === 'Website.adx_headerwebtemplateid'));
            assert.ok(definitions.find(d => d.name === 'Website.adx_defaultbotconsumerid'));
            // New: User
            assert.ok(definitions.find(d => d.name === 'User'));
            assert.ok(definitions.find(d => d.name === 'User.owningbusinessunit'));
            assert.ok(definitions.find(d => d.name === 'User.owninguser'));
            assert.ok(definitions.find(d => d.name === 'User.ownerid'));
            assert.ok(definitions.find(d => d.name === 'User.modifiedby'));
            assert.ok(definitions.find(d => d.name === 'User.createdby'));
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
            assert.ok(httpClientDef.methods.find(m => m.name === 'GetAsync'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'PostAsync'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'PatchAsync'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'PutAsync'));
            assert.ok(httpClientDef.methods.find(m => m.name === 'DeleteAsync'));
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
            assert.ok(completionArray.find(c => c.label === 'Context'));
            assert.ok(completionArray.find(c => c.label === 'Sitesetting'));
            assert.ok(completionArray.find(c => c.label === 'Website'));
            // New: User
            assert.ok(completionArray.find(c => c.label === 'User'));
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
            assert.ok(completionArray.find(c => c.label === 'GetAsync'));
            assert.ok(completionArray.find(c => c.label === 'PostAsync'));
            assert.ok(completionArray.find(c => c.label === 'PatchAsync'));
            assert.ok(completionArray.find(c => c.label === 'PutAsync'));
            assert.ok(completionArray.find(c => c.label === 'DeleteAsync'));
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

        test('should provide property completions for Context namespace', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Context.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 15);
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            const expectedProps = ['ActivityId','Body','FunctionName','Headers','HttpMethod','QueryParameters','ServerLogicName','Url'];
            expectedProps.forEach(p => assert.ok(completionArray.find(c => c.label === p), `Missing Context property: ${p}`));
        });

        test('should provide method completion for Sitesetting namespace', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Sitesetting.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 19);
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            assert.ok(completionArray.find(c => c.label === 'Get'));
        });

        test('should provide property completions for Website namespace', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Website.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 15);
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            const expectedTopProps = ['statecode','statuscode','adx_websiteid','adx_primarydomainname','adx_name','adx_defaultlanguage','adx_footerwebtemplateid','adx_headerwebtemplateid','adx_defaultbotconsumerid','isCoreEntity'];
            expectedTopProps.forEach(p => assert.ok(completionArray.find(c => c.label === p), `Missing Website property: ${p}`));
        });

        test('should provide nested property completions for Website entity references', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.Website.adx_defaultlanguage.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, document.lineAt(0).range.end.character);
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            ['LogicalName','Id','Name'].forEach(p => assert.ok(completionArray.find(c => c.label === p), `Missing nested property: ${p}`));
        });

        test('should provide property completions for User namespace', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.User.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 12);
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            const expectedProps = [
                'customertypecode','address2_addresstypecode','merged','adx_identity_securitystamp','territorycode','emailaddress1','haschildrencode','adx_identity_passwordhash','preferredappointmenttimecode','adx_profilemodifiedon','isbackofficecustomer','owningbusinessunit','owninguser','adx_profilealert','lastname','donotpostalmail','marketingonly','donotphone','preferredcontactmethodcode','adx_identity_locallogindisabled','educationcode','ownerid','adx_identity_logonenabled','customersizecode','firstname','yomifullname','adx_identity_lockoutenabled','adx_profileisanonymous','donotemail','address2_shippingmethodcode','statuscode','createdon','donotsendmm','donotfax','leadsourcecode','adx_identity_accessfailedcount','adx_confirmremovepassword','modifiedon','creditonhold','adx_identity_emailaddress1confirmed','msdyn_isminor','adx_identity_username','msdyn_isminorwithparentalconsent','address3_addressid','donotbulkemail','adx_identity_twofactorenabled','modifiedby','followemail','shippingmethodcode','createdby','donotbulkpostalmail','contactid','msdyn_disablewebtracking','adx_identity_mobilephoneconfirmed','participatesinworkflow','statecode','address2_addressid'
            ];
            expectedProps.forEach(p => assert.ok(completionArray.find(c => c.label === p), `Missing User property: ${p}`));
        });

        test('should provide nested property completions for User entity references', async () => {
            const document = await vscode.workspace.openTextDocument({
                content: 'Server.User.ownerid.',
                language: 'javascript'
            });

            const position = new vscode.Position(0, 22);
            const completions = provider.provideCompletionItems(document, position);

            assert.ok(Array.isArray(completions));
            const completionArray = completions as vscode.CompletionItem[];

            ['LogicalName','Id','Name'].forEach(p => assert.ok(completionArray.find(c => c.label === p), `Missing nested property: ${p}`));
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
const response = Server.Connector.HttpClient.GetAsync('https://api.example.com/data', headers);
const postResult = Server.Connector.HttpClient.PostAsync('https://api.example.com/users', JSON.stringify(userData), headers);
const patchResult = Server.Connector.HttpClient.PatchAsync('https://api.example.com/users/123', JSON.stringify(updatedData), headers);
const putResult = Server.Connector.HttpClient.PutAsync('https://api.example.com/users/123', JSON.stringify(updatedData), headers);
Server.Connector.HttpClient.DeleteAsync('https://api.example.com/users/123', headers);
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
Server.Connector.HttpClient.GetAsync(url, headers);  // For external API calls
Server.Connector.Dataverse.RetrieveRecord(entitySetName, id, options);  // For Dataverse operations
`
};
