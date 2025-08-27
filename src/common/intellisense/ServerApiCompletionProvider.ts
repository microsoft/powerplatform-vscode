/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { getServerApiTelemetryContext } from "./ServerApiTelemetryContext";
import { ServerApiTelemetryEventNames } from "./ServerApiTelemetryEventNames";

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
                },
                {
                    name: "InvokeCustomApi",
                    description: "Invokes a custom API endpoint",
                    parameters: [
                        { name: "httpMethod", type: "string", description: "The HTTP method to use (e.g., GET, POST)" },
                        { name: "url", type: "string", description: "The API endpoint URL" },
                        { name: "payload", type: "string", description: "The JSON payload to send with the request" }
                    ],
                    returnType: "void",
                    example: "Server.Connector.Dataverse.InvokeCustomApi('POST', '/api/data/v9.0/contacts', payload);"
                }
            ]
        },
        // New: Server.Context namespace with properties
        {
            name: "Context",
            description: "Provides request context information for the current server execution",
            methods: [],
            properties: [
                { name: "ActivityId", description: "Unique activity identifier for the current execution", returnType: "string" },
                { name: "Body", description: "Request body content", returnType: "string" },
                { name: "FunctionName", description: "Invoked function name", returnType: "string" },
                { name: "Headers", description: "HTTP request headers", returnType: "IDictionary<string, string>" },
                { name: "HttpMethod", description: "HTTP method for the request", returnType: "string" },
                { name: "QueryParameters", description: "Query string parameters", returnType: "IDictionary<string, string>" },
                { name: "ServerLogicName", description: "The server logic name being executed", returnType: "string" },
                { name: "Url", description: "Request URL", returnType: "string" }
            ]
        },
        // New: Server.Sitesetting with Get(name)
        {
            name: "Sitesetting",
            description: "Provides access to site settings",
            methods: [
                {
                    name: "Get",
                    description: "Gets a site setting value by name",
                    parameters: [
                        { name: "name", type: "string", description: "The site setting name" }
                    ],
                    returnType: "string",
                    example: "Server.Sitesetting.Get('Authentication/OpenIdConnect/Authority');"
                }
            ]
        },
        // New: Server.Website top-level properties and nested entity references
        {
            name: "Website",
            description: "Provides metadata of the current Power Pages website",
            methods: [],
            properties: [
                { name: "statecode", description: "Website state code", returnType: "number" },
                { name: "statuscode", description: "Website status code", returnType: "number" },
                { name: "adx_websiteid", description: "Website ID (GUID)", returnType: "string" },
                { name: "adx_primarydomainname", description: "Primary domain name", returnType: "string" },
                { name: "adx_name", description: "Website name", returnType: "string" },
                { name: "adx_defaultlanguage", description: "Default language reference", returnType: "EntityReference" },
                { name: "adx_footerwebtemplateid", description: "Footer web template reference", returnType: "EntityReference" },
                { name: "adx_headerwebtemplateid", description: "Header web template reference", returnType: "EntityReference" },
                { name: "adx_defaultbotconsumerid", description: "Default bot consumer reference", returnType: "EntityReference" },
                { name: "isCoreEntity", description: "Indicates whether the website is a core entity", returnType: "boolean" }
            ]
        },
        {
            name: "Website.adx_defaultlanguage",
            description: "Default language entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        {
            name: "Website.adx_footerwebtemplateid",
            description: "Footer web template entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        {
            name: "Website.adx_headerwebtemplateid",
            description: "Header web template entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        {
            name: "Website.adx_defaultbotconsumerid",
            description: "Default bot consumer entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        // New: Server.User with extensive properties and entity references
        {
            name: "User",
            description: "Provides information about the current user (contact)",
            methods: [],
            properties: [
                { name: "customertypecode", description: "Customer type code", returnType: "number" },
                { name: "address2_addresstypecode", description: "Address 2 type code", returnType: "number" },
                { name: "merged", description: "Indicates whether the record is merged", returnType: "boolean" },
                { name: "adx_identity_securitystamp", description: "Identity security stamp", returnType: "string" },
                { name: "territorycode", description: "Territory code", returnType: "number" },
                { name: "emailaddress1", description: "Primary email address", returnType: "string" },
                { name: "haschildrencode", description: "Has children code", returnType: "number" },
                { name: "adx_identity_passwordhash", description: "Identity password hash", returnType: "string" },
                { name: "preferredappointmenttimecode", description: "Preferred appointment time code", returnType: "number" },
                { name: "adx_profilemodifiedon", description: "Profile last modified on", returnType: "string" },
                { name: "isbackofficecustomer", description: "Is back office customer", returnType: "boolean" },
                { name: "owningbusinessunit", description: "Owning business unit reference", returnType: "EntityReference" },
                { name: "owninguser", description: "Owning user reference", returnType: "EntityReference" },
                { name: "adx_profilealert", description: "Profile alert text", returnType: "string" },
                { name: "lastname", description: "Last name", returnType: "string" },
                { name: "donotpostalmail", description: "Do not send postal mail", returnType: "boolean" },
                { name: "marketingonly", description: "Marketing only", returnType: "boolean" },
                { name: "donotphone", description: "Do not phone", returnType: "boolean" },
                { name: "preferredcontactmethodcode", description: "Preferred contact method code", returnType: "number" },
                { name: "adx_identity_locallogindisabled", description: "Local login disabled", returnType: "boolean" },
                { name: "educationcode", description: "Education code", returnType: "number" },
                { name: "ownerid", description: "Owner reference", returnType: "EntityReference" },
                { name: "adx_identity_logonenabled", description: "Login enabled", returnType: "boolean" },
                { name: "customersizecode", description: "Customer size code", returnType: "number" },
                { name: "firstname", description: "First name", returnType: "string" },
                { name: "yomifullname", description: "Yomi full name", returnType: "string" },
                { name: "adx_identity_lockoutenabled", description: "Lockout enabled", returnType: "boolean" },
                { name: "adx_profileisanonymous", description: "Profile is anonymous", returnType: "boolean" },
                { name: "donotemail", description: "Do not email", returnType: "boolean" },
                { name: "address2_shippingmethodcode", description: "Address 2 shipping method code", returnType: "number" },
                { name: "fullname", description: "Full name", returnType: "string" },
                { name: "timezoneruleversionnumber", description: "Timezone rule version number", returnType: "number" },
                { name: "address1_addressid", description: "Address 1 ID", returnType: "string" },
                { name: "address2_freighttermscode", description: "Address 2 freight terms code", returnType: "number" },
                { name: "statuscode", description: "Status code", returnType: "number" },
                { name: "createdon", description: "Created on", returnType: "string" },
                { name: "donotsendmm", description: "Do not send marketing materials", returnType: "boolean" },
                { name: "donotfax", description: "Do not fax", returnType: "boolean" },
                { name: "leadsourcecode", description: "Lead source code", returnType: "number" },
                { name: "adx_identity_accessfailedcount", description: "Identity access failed count", returnType: "number" },
                { name: "adx_confirmremovepassword", description: "Confirm remove password", returnType: "boolean" },
                { name: "modifiedon", description: "Modified on", returnType: "string" },
                { name: "creditonhold", description: "Credit on hold", returnType: "boolean" },
                { name: "adx_identity_emailaddress1confirmed", description: "Email address confirmed", returnType: "boolean" },
                { name: "msdyn_isminor", description: "Is minor", returnType: "boolean" },
                { name: "adx_identity_username", description: "Identity username", returnType: "string" },
                { name: "msdyn_isminorwithparentalconsent", description: "Is minor with parental consent", returnType: "boolean" },
                { name: "address3_addressid", description: "Address 3 ID", returnType: "string" },
                { name: "donotbulkemail", description: "Do not bulk email", returnType: "boolean" },
                { name: "adx_identity_twofactorenabled", description: "Two factor enabled", returnType: "boolean" },
                { name: "modifiedby", description: "Modified by reference", returnType: "EntityReference" },
                { name: "followemail", description: "Follow email", returnType: "boolean" },
                { name: "shippingmethodcode", description: "Shipping method code", returnType: "number" },
                { name: "createdby", description: "Created by reference", returnType: "EntityReference" },
                { name: "donotbulkpostalmail", description: "Do not bulk postal mail", returnType: "boolean" },
                { name: "contactid", description: "Contact ID", returnType: "string" },
                { name: "msdyn_disablewebtracking", description: "Disable web tracking", returnType: "boolean" },
                { name: "adx_identity_mobilephoneconfirmed", description: "Mobile phone confirmed", returnType: "boolean" },
                { name: "participatesinworkflow", description: "Participates in workflow", returnType: "boolean" },
                { name: "statecode", description: "State code", returnType: "number" },
                { name: "address2_addressid", description: "Address 2 ID", returnType: "string" }
            ]
        },
        {
            name: "User.owningbusinessunit",
            description: "Owning business unit entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        {
            name: "User.owninguser",
            description: "Owning user entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        {
            name: "User.ownerid",
            description: "Owner entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        {
            name: "User.modifiedby",
            description: "Modified by entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
            ]
        },
        {
            name: "User.createdby",
            description: "Created by entity reference",
            methods: [],
            properties: [
                { name: "LogicalName", description: "Logical name of the referenced record", returnType: "string" },
                { name: "Id", description: "ID (GUID) of the referenced record", returnType: "string" },
                { name: "Name", description: "Name of the referenced record", returnType: "string" }
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

        try {
            const ctx = getServerApiTelemetryContext();
            oneDSLoggerWrapper.getLogger()?.traceInfo(ServerApiTelemetryEventNames.SERVER_API_AUTOCOMPLETE_TRIGGERED, {
                languageId: document.languageId,
                prefix: textBeforeCursor.trim().slice(-50),
                tenantId: ctx?.tenantId,
                envId: ctx?.envId,
                userId: ctx?.userId,
                orgId: ctx?.orgId,
                geo: ctx?.geo,
            });

            // Check what level of completion we need
            if (textBeforeCursor.endsWith('Server.')) {
                // Provide top-level namespace completions
                const items = this.getNamespaceCompletions();
                completions.push(...items);

                oneDSLoggerWrapper.getLogger()?.traceInfo(ServerApiTelemetryEventNames.SERVER_API_AUTOCOMPLETE_NAMESPACES_SHOWN, {
                    count: String(items.length),
                    tenantId: ctx?.tenantId,
                    envId: ctx?.envId,
                    userId: ctx?.userId,
                    orgId: ctx?.orgId,
                    geo: ctx?.geo,
                });
            } else if (textBeforeCursor.endsWith('Server.Connector.')) {
                // Provide Connector sub-namespace completions
                const items = this.getConnectorSubNamespaces();
                completions.push(...items);

                oneDSLoggerWrapper.getLogger()?.traceInfo(ServerApiTelemetryEventNames.SERVER_API_AUTOCOMPLETE_SUB_NAMESPACES_SHOWN, {
                    parent: 'Connector',
                    count: String(items.length),
                    tenantId: ctx?.tenantId,
                    envId: ctx?.envId,
                    userId: ctx?.userId,
                    orgId: ctx?.orgId,
                    geo: ctx?.geo,
                });
            } else {
                // Check for nested completions
                const match = textBeforeCursor.match(/Server\.([^.]+(?:\.[^.]+)?)\.?$/);
                if (match) {
                    const namespaceName = match[1];
                    const items = this.getMethodCompletions(namespaceName);
                    completions.push(...items);

                    oneDSLoggerWrapper.getLogger()?.traceInfo(ServerApiTelemetryEventNames.SERVER_API_AUTOCOMPLETE_ITEMS_SHOWN, {
                        namespace: namespaceName,
                        count: String(items.length),
                        tenantId: ctx?.tenantId,
                        envId: ctx?.envId,
                        userId: ctx?.userId,
                        orgId: ctx?.orgId,
                        geo: ctx?.geo,
                    });
                }
            }
        } catch (err) {
            try {
                const e = err as Error;
                const ctx = getServerApiTelemetryContext();
                oneDSLoggerWrapper.getLogger()?.traceError(ServerApiTelemetryEventNames.SERVER_API_AUTOCOMPLETE_ERROR, e.message, e, {
                    tenantId: ctx?.tenantId,
                    envId: ctx?.envId,
                    userId: ctx?.userId,
                    orgId: ctx?.orgId,
                    geo: ctx?.geo
                });
            } catch { /* no-op */ }
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

            if (namespace.name === 'Logger') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.Log('\${1:message}');`);
            } else if (namespace.name === 'Connector') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.\${1|HttpClient,Dataverse|}`);
            } else if (namespace.name === 'Sitesetting') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.Get('\${1:name}')`);
            } else if (namespace.name === 'Context') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.\${1|ActivityId,Body,FunctionName,Headers,HttpMethod,QueryParameters,ServerLogicName,Url|}`);
            } else if (namespace.name === 'Website') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.\${1|statecode,statuscode,adx_websiteid,adx_primarydomainname,adx_name,adx_defaultlanguage,adx_footerwebtemplateid,adx_headerwebtemplateid,adx_defaultbotconsumerid,isCoreEntity|}`);
            } else if (namespace.name === 'User') {
                completion.insertText = new vscode.SnippetString(`${namespace.name}.\${1|customertypecode,address2_addresstypecode,merged,adx_identity_securitystamp,territorycode,emailaddress1,haschildrencode,adx_identity_passwordhash,preferredappointmenttimecode,adx_profilemodifiedon,isbackofficecustomer,owningbusinessunit,owninguser,adx_profilealert,lastname,donotpostalmail,marketingonly,donotphone,preferredcontactmethodcode,adx_identity_locallogindisabled,educationcode,ownerid,adx_identity_logonenabled,customersizecode,firstname,yomifullname,adx_identity_lockoutenabled,adx_profileisanonymous,donotemail,address2_shippingmethodcode,fullname,timezoneruleversionnumber,address1_addressid,address2_freighttermscode,statuscode,createdon,donotsendmm,donotfax,leadsourcecode,adx_identity_accessfailedcount,adx_confirmremovepassword,modifiedon,creditonhold,adx_identity_emailaddress1confirmed,msdyn_isminor,adx_identity_username,msdyn_isminorwithparentalconsent,address3_addressid,donotbulkemail,adx_identity_twofactorenabled,modifiedby,followemail,shippingmethodcode,createdby,donotbulkpostalmail,contactid,msdyn_disablewebtracking,adx_identity_mobilephoneconfirmed,participatesinworkflow,statecode,address2_addressid|}`);
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
