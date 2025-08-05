/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

/**
 * Interface for Server API method definitions
 */
interface IServerApiMethod {
    name: string;
    description: string;
    parameters?: IParameter[];
    returnType?: string;
    example?: string;
}

/**
 * Interface for method parameters
 */
interface IParameter {
    name: string;
    type: string;
    description?: string;
    optional?: boolean;
}

/**
 * Interface for Server API namespace definitions
 */
interface IServerApiNamespace {
    name: string;
    description: string;
    methods: IServerApiMethod[];
    properties?: IServerApiMethod[];
}

/**
 * Server API definitions for autocomplete
 */
export class ServerApiDefinitions {
    private static readonly apiDefinitions: IServerApiNamespace[] = [
        {
            name: "Logger",
            description: "Provides logging functionality for Power Pages server-side scripts",
            methods: [
                {
                    name: "Log",
                    description: "Logs a message",
                    parameters: [
                        { name: "message", type: "string", description: "The message to log" }
                    ],
                    example: "Server.Logger.Log('Application started');"
                }
            ]
        },
        {
            name: "Connector",
            description: "Provides connector functionality for external services",
            methods: [],
            properties: [
                {
                    name: "HttpClient",
                    description: "HTTP client for external API calls",
                    returnType: "HttpClient",
                    example: "Server.Connector.HttpClient.Get(url, headers);"
                },
                {
                    name: "Dataverse",
                    description: "Dataverse operations and data access",
                    returnType: "Dataverse",
                    example: "Server.Connector.Dataverse.RetrieveRecord(entitySetName, id, options);"
                }
            ]
        },
        {
            name: "Connector.HttpClient",
            description: "Provides HTTP client functionality for external API calls (blocks access to Dataverse)",
            methods: [
                {
                    name: "Get",
                    description: "Performs an HTTP GET request",
                    parameters: [
                        { name: "url", type: "string", description: "The URL to request" },
                        { name: "headers", type: "IDictionary<string, string>", description: "Request headers" }
                    ],
                    returnType: "HttpResponse",
                    example: "Server.Connector.HttpClient.Get('https://api.example.com/data', headers);"
                },
                {
                    name: "Post",
                    description: "Performs an HTTP POST request",
                    parameters: [
                        { name: "url", type: "string", description: "The URL to request" },
                        { name: "jsonBody", type: "string", description: "The JSON body to send" },
                        { name: "headers", type: "IDictionary<string, string>", description: "Request headers" }
                    ],
                    returnType: "HttpResponse",
                    example: "Server.Connector.HttpClient.Post('https://api.example.com/data', jsonBody, headers);"
                },
                {
                    name: "Patch",
                    description: "Performs an HTTP PATCH request",
                    parameters: [
                        { name: "url", type: "string", description: "The URL to request" },
                        { name: "jsonBody", type: "string", description: "The JSON body to send" },
                        { name: "headers", type: "IDictionary<string, string>", description: "Request headers" }
                    ],
                    returnType: "HttpResponse",
                    example: "Server.Connector.HttpClient.Patch('https://api.example.com/data/1', jsonBody, headers);"
                },
                {
                    name: "Put",
                    description: "Performs an HTTP PUT request",
                    parameters: [
                        { name: "url", type: "string", description: "The URL to request" },
                        { name: "jsonBody", type: "string", description: "The JSON body to send" },
                        { name: "headers", type: "IDictionary<string, string>", description: "Request headers" }
                    ],
                    returnType: "HttpResponse",
                    example: "Server.Connector.HttpClient.Put('https://api.example.com/data/1', jsonBody, headers);"
                },
                {
                    name: "Delete",
                    description: "Performs an HTTP DELETE request",
                    parameters: [
                        { name: "url", type: "string", description: "The URL to request" },
                        { name: "headers", type: "IDictionary<string, string>", description: "Request headers" }
                    ],
                    returnType: "HttpResponse",
                    example: "Server.Connector.HttpClient.Delete('https://api.example.com/data/1', headers);"
                }
            ]
        },
        {
            name: "Connector.Dataverse",
            description: "Provides access to Dataverse operations and data",
            methods: [
                {
                    name: "CreateRecord",
                    description: "Creates a new record in Dataverse",
                    parameters: [
                        { name: "entitySetName", type: "string", description: "The entity set name" },
                        { name: "payload", type: "string", description: "The JSON payload for the new record" }
                    ],
                    returnType: "string",
                    example: "Server.Connector.Dataverse.CreateRecord('contacts', payload);"
                },
                {
                    name: "RetrieveRecord",
                    description: "Retrieves a single record from Dataverse",
                    parameters: [
                        { name: "entitySetName", type: "string", description: "The entity set name" },
                        { name: "id", type: "string", description: "The ID of the record to retrieve" },
                        { name: "options", type: "string", description: "Query options (e.g., $select, $expand)" }
                    ],
                    returnType: "DataverseRecord",
                    example: "Server.Connector.Dataverse.RetrieveRecord('contacts', contactId, '$select=firstname,lastname');"
                },
                {
                    name: "RetrieveMultipleRecords",
                    description: "Retrieves multiple records from Dataverse",
                    parameters: [
                        { name: "entitySetName", type: "string", description: "The entity set name" },
                        { name: "options", type: "string", description: "Query options (e.g., $filter, $select, $orderby)" }
                    ],
                    returnType: "DataverseRecord[]",
                    example: "Server.Connector.Dataverse.RetrieveMultipleRecords('contacts', '$filter=lastname eq Smith');"
                },
                {
                    name: "UpdateRecord",
                    description: "Updates an existing record in Dataverse",
                    parameters: [
                        { name: "entitySetName", type: "string", description: "The entity set name" },
                        { name: "id", type: "string", description: "The ID of the record to update" },
                        { name: "payload", type: "string", description: "The JSON payload with updated data" }
                    ],
                    returnType: "void",
                    example: "Server.Connector.Dataverse.UpdateRecord('contacts', contactId, payload);"
                },
                {
                    name: "DeleteRecord",
                    description: "Deletes a record from Dataverse",
                    parameters: [
                        { name: "entitySetName", type: "string", description: "The entity set name" },
                        { name: "id", type: "string", description: "The ID of the record to delete" }
                    ],
                    returnType: "void",
                    example: "Server.Connector.Dataverse.DeleteRecord('contacts', contactId);"
                }
            ]
        }
    ];

    /**
     * Gets all Server API definitions
     */
    public static getDefinitions(): IServerApiNamespace[] {
        return this.apiDefinitions;
    }

    /**
     * Gets a specific API namespace definition
     */
    public static getNamespace(name: string): IServerApiNamespace | undefined {
        return this.apiDefinitions.find(api => api.name === name);
    }
}

/**
 * Completion provider for Server APIs in Power Pages
 */
export class ServerApiCompletionProvider implements vscode.CompletionItemProvider {

    /**
     * Provides completion items for Server API usage
     */
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {

        const lineText = document.lineAt(position.line).text;
        const textBeforeCursor = lineText.substring(0, position.character);

        // Check if we're in a context where Server API autocomplete should be provided
        if (!this.shouldProvideCompletions(textBeforeCursor)) {
            return [];
        }

        const completions: vscode.CompletionItem[] = [];

        // Check what level of completion we need
        if (textBeforeCursor.endsWith('Server.')) {
            // Provide top-level namespace completions
            completions.push(...this.getNamespaceCompletions());
        } else if (textBeforeCursor.endsWith('Server.Connector.')) {
            // Provide Connector sub-namespace completions
            completions.push(...this.getConnectorSubNamespaces());
        } else {
            // Check for nested completions
            const match = textBeforeCursor.match(/Server\.([^.]+(?:\.[^.]+)?)\.?$/);
            if (match) {
                const namespaceName = match[1];
                completions.push(...this.getMethodCompletions(namespaceName));
            }
        }

        return completions;
    }

    /**
     * Determines if completions should be provided based on the current context
     */
    private shouldProvideCompletions(textBeforeCursor: string): boolean {
        // Provide completions if we detect Server API usage
        return textBeforeCursor.includes('Server.') || textBeforeCursor.endsWith('Server');
    }

    /**
     * Gets completion items for Server namespaces
     */
    private getNamespaceCompletions(): vscode.CompletionItem[] {
        const definitions = ServerApiDefinitions.getDefinitions();
        const topLevelNamespaces = definitions.filter(ns => !ns.name.includes('.'));

        return topLevelNamespaces.map(namespace => {
            const completion = new vscode.CompletionItem(namespace.name, vscode.CompletionItemKind.Module);
            completion.detail = `Server.${namespace.name}`;
            completion.documentation = new vscode.MarkdownString(namespace.description);
            completion.insertText = namespace.name;

            // Add snippet for common patterns
            if (namespace.name === 'Logger') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.Log('\${1:message}');`);
            } else if (namespace.name === 'Connector') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.\${1|HttpClient,Dataverse|}`);
            }

            return completion;
        });
    }

    /**
     * Gets completion items for Connector sub-namespaces
     */
    private getConnectorSubNamespaces(): vscode.CompletionItem[] {
        const connectorNamespace = ServerApiDefinitions.getNamespace('Connector');
        if (!connectorNamespace || !connectorNamespace.properties) {
            return [];
        }

        return connectorNamespace.properties.map(property => {
            const completion = new vscode.CompletionItem(property.name, vscode.CompletionItemKind.Module);
            completion.detail = `Server.Connector.${property.name}`;
            completion.documentation = new vscode.MarkdownString(property.description);
            completion.insertText = property.name;

            // Add snippets for common patterns
            if (property.name === 'HttpClient') {
                completion.insertText = new vscode.SnippetString(`${property.name}.\${1|Get,Post,Patch,Put,Delete|}`);
            } else if (property.name === 'Dataverse') {
                completion.insertText = new vscode.SnippetString(`${property.name}.\${1|CreateRecord,RetrieveRecord,RetrieveMultipleRecords,UpdateRecord,DeleteRecord|}`);
            }

            return completion;
        });
    }

    /**
     * Gets completion items for methods and properties within a namespace
     */
    private getMethodCompletions(namespaceName: string): vscode.CompletionItem[] {
        const namespace = ServerApiDefinitions.getNamespace(namespaceName);
        if (!namespace) {
            return [];
        }

        const completions: vscode.CompletionItem[] = [];

        // Add method completions
        if (namespace.methods) {
            completions.push(...namespace.methods.map(method => {
                const completion = new vscode.CompletionItem(method.name, vscode.CompletionItemKind.Method);
                completion.detail = this.getMethodSignature(method);
                completion.documentation = this.getMethodDocumentation(method);
                completion.insertText = this.getMethodSnippet(method);

                // Add commit characters for method calls
                completion.commitCharacters = ['('];

                return completion;
            }));
        }

        // Add property completions
        if (namespace.properties) {
            completions.push(...namespace.properties.map(property => {
                const completion = new vscode.CompletionItem(property.name, vscode.CompletionItemKind.Property);
                completion.detail = `(property) ${property.returnType || 'any'}`;
                completion.documentation = new vscode.MarkdownString(property.description);
                if (property.example) {
                    completion.documentation.appendCodeblock(property.example, 'javascript');
                }
                completion.insertText = property.name;

                return completion;
            }));
        }

        return completions;
    }

    /**
     * Generates method signature string
     */
    private getMethodSignature(method: IServerApiMethod): string {
        const params = method.parameters || [];
        const paramStrings = params.map(param => {
            const optionalMarker = param.optional ? '?' : '';
            return `${param.name}${optionalMarker}: ${param.type}`;
        });

        const returnType = method.returnType ? `: ${method.returnType}` : '';
        return `${method.name}(${paramStrings.join(', ')})${returnType}`;
    }

    /**
     * Generates method documentation
     */
    private getMethodDocumentation(method: IServerApiMethod): vscode.MarkdownString {
        const docs = new vscode.MarkdownString();
        docs.appendMarkdown(method.description);

        if (method.parameters && method.parameters.length > 0) {
            docs.appendMarkdown('\n\n**Parameters:**\n');
            method.parameters.forEach(param => {
                const optionalText = param.optional ? ' *(optional)*' : '';
                docs.appendMarkdown(`- \`${param.name}\` (${param.type})${optionalText}: ${param.description || ''}\n`);
            });
        }

        if (method.returnType) {
            docs.appendMarkdown(`\n**Returns:** \`${method.returnType}\``);
        }

        if (method.example) {
            docs.appendMarkdown('\n\n**Example:**\n');
            docs.appendCodeblock(method.example, 'javascript');
        }

        return docs;
    }

    /**
     * Generates method snippet for insertion
     */
    private getMethodSnippet(method: IServerApiMethod): vscode.SnippetString {
        if (!method.parameters || method.parameters.length === 0) {
            return new vscode.SnippetString(`${method.name}()`);
        }

        const requiredParams = method.parameters.filter(p => !p.optional);
        const optionalParams = method.parameters.filter(p => p.optional);

        let snippet = `${method.name}(`;
        let paramIndex = 1;

        // Add required parameters
        requiredParams.forEach((param, index) => {
            if (index > 0) snippet += ', ';
            snippet += `\${${paramIndex}:${param.name}}`;
            paramIndex++;
        });

        // Add optional parameters as choices
        if (optionalParams.length > 0 && requiredParams.length > 0) {
            snippet += `\${${paramIndex}:, \${${paramIndex + 1}:${optionalParams[0].name}}}`;
        } else if (optionalParams.length > 0) {
            snippet += `\${${paramIndex}:${optionalParams[0].name}}`;
        }

        snippet += ')';

        return new vscode.SnippetString(snippet);
    }
}
