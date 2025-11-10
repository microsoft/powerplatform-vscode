/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Generates the complete mock SDK implementation for Power Pages Server Logic
 * This SDK is injected at runtime to provide debugging capabilities
 */
export function generateServerMockSdk(): string {
    return `
/**
 * Mock Server Object for Power Pages Server Logic SDK
 *
 * This provides a complete mock implementation for testing Server Logic locally
 * without requiring the actual Power Pages runtime environment.
 */

const Server = {
    /**
     * Logger - Diagnostic logging functionality
     */
    Logger: {
        Log: function(message) {
            console.log(\`[LOG] \${new Date().toISOString()} - \${message}\`);
        },
        Error: function(message) {
            console.error(\`[ERROR] \${new Date().toISOString()} - \${message}\`);
        },
        Warning: function(message) {
            console.warn(\`[WARNING] \${new Date().toISOString()} - \${message}\`);
        },
        Info: function(message) {
            console.info(\`[INFO] \${new Date().toISOString()} - \${message}\`);
        }
    },

    /**
     * Context - Request context including query params, headers, body
     */
    Context: {
        QueryParameters: {
            // Mock query parameters - customize as needed
            "id": "12345-test-guid"
        },
        Headers: {
            // Mock headers - customize as needed
            "Authorization": "Bearer mock-token",
            "Content-Type": "application/json",
            "User-Agent": "MockClient/1.0"
        },
        Body: JSON.stringify({
            // Mock request body - customize as needed
            name: "Test Account",
            telephone1: "555-0100"
        }),
        Method: "GET", // GET, POST, PUT, PATCH, DELETE
        Url: "https://mock-server.example.com/api/test"
    },

    /**
     * Connector - External integrations
     */
    Connector: {
        /**
         * HttpClient - Make HTTP requests to external APIs
         */
        HttpClient: {
            GetAsync: async function(url, headers = {}) {
                Server.Logger.Log(\`[MOCK] HttpClient.GetAsync called with URL: \${url}\`);

                // Simulate async delay
                await new Promise(resolve => setTimeout(resolve, 100));

                // Mock response structure
                const mockResponse = {
                    StatusCode: 200,
                    Headers: {
                        "Content-Type": "application/json",
                        "X-Mock-Response": "true",
                        "Date": new Date().toUTCString()
                    },
                    Body: JSON.stringify({
                        version: "3.0.0",
                        resources: [
                            { "@id": "https://api.nuget.org/v3/registration5-gz-semver2/index.json", "@type": "RegistrationsBaseUrl" },
                            { "@id": "https://api.nuget.org/v3/catalog0/index.json", "@type": "Catalog/3.0.0" }
                        ],
                        "@context": {
                            "@vocab": "https://schema.nuget.org/schema#"
                        }
                    })
                };

                return JSON.stringify(mockResponse);
            },

            PostAsync: async function(url, body, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.PostAsync called with URL: \${url}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                await new Promise(resolve => setTimeout(resolve, 100));

                const mockResponse = {
                    StatusCode: 201,
                    Headers: {
                        "Content-Type": contentType,
                        "Location": \`\${url}/new-resource-id\`,
                        "X-Mock-Response": "true"
                    },
                    Body: JSON.stringify({
                        id: "new-resource-id",
                        ...JSON.parse(body),
                        createdAt: new Date().toISOString()
                    })
                };

                return JSON.stringify(mockResponse);
            },

            PatchAsync: async function(url, body, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.PatchAsync called with URL: \${url}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                await new Promise(resolve => setTimeout(resolve, 100));

                const mockResponse = {
                    StatusCode: 200,
                    Headers: {
                        "Content-Type": contentType,
                        "X-Mock-Response": "true"
                    },
                    Body: JSON.stringify({
                        ...JSON.parse(body),
                        updatedAt: new Date().toISOString()
                    })
                };

                return JSON.stringify(mockResponse);
            },

            PutAsync: async function(url, body, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.PutAsync called with URL: \${url}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                await new Promise(resolve => setTimeout(resolve, 100));

                const mockResponse = {
                    StatusCode: 200,
                    Headers: {
                        "Content-Type": contentType,
                        "X-Mock-Response": "true"
                    },
                    Body: JSON.stringify({
                        ...JSON.parse(body),
                        updatedAt: new Date().toISOString()
                    })
                };

                return JSON.stringify(mockResponse);
            },

            DeleteAsync: async function(url, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.DeleteAsync called with URL: \${url}\`);

                await new Promise(resolve => setTimeout(resolve, 100));

                const mockResponse = {
                    StatusCode: 204,
                    Headers: {
                        "X-Mock-Response": "true"
                    },
                    Body: ""
                };

                return JSON.stringify(mockResponse);
            }
        },

        /**
         * Dataverse - CRUD operations on Dataverse tables and Custom APIs
         */
        Dataverse: {
            CreateRecord: function(entityName, body) {
                Server.Logger.Log(\`[MOCK] Dataverse.CreateRecord called for entity: \${entityName}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                const parsedBody = JSON.parse(body);
                const newId = \`\${entityName}-\${Date.now()}-mock-guid\`;

                return JSON.stringify({
                    id: newId,
                    ...parsedBody,
                    createdon: new Date().toISOString(),
                    [\`\${entityName}id\`]: newId
                });
            },

            RetrieveRecord: function(entityName, id, query = "") {
                Server.Logger.Log(\`[MOCK] Dataverse.RetrieveRecord called for entity: \${entityName}, id: \${id}, query: \${query}\`);

                return JSON.stringify({
                    [\`\${entityName}id\`]: id,
                    name: \`Mock \${entityName} Record\`,
                    telephone1: "555-0100",
                    createdon: new Date().toISOString(),
                    modifiedon: new Date().toISOString()
                });
            },

            UpdateRecord: function(entityName, id, body) {
                Server.Logger.Log(\`[MOCK] Dataverse.UpdateRecord called for entity: \${entityName}, id: \${id}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                const parsedBody = JSON.parse(body);

                return JSON.stringify({
                    [\`\${entityName}id\`]: id,
                    ...parsedBody,
                    modifiedon: new Date().toISOString()
                });
            },

            DeleteRecord: function(entityName, id) {
                Server.Logger.Log(\`[MOCK] Dataverse.DeleteRecord called for entity: \${entityName}, id: \${id}\`);

                return JSON.stringify({
                    success: true,
                    message: \`Record \${id} deleted from \${entityName}\`
                });
            },

            ExecuteCustomApi: function(apiName, parameters) {
                Server.Logger.Log(\`[MOCK] Dataverse.ExecuteCustomApi called for API: \${apiName}\`);
                Server.Logger.Log(\`[MOCK] Parameters: \${parameters}\`);

                return JSON.stringify({
                    success: true,
                    apiName: apiName,
                    result: {
                        message: \`Custom API \${apiName} executed successfully\`,
                        timestamp: new Date().toISOString()
                    }
                });
            },

            RetrieveMultiple: function(entityName, query) {
                Server.Logger.Log(\`[MOCK] Dataverse.RetrieveMultiple called for entity: \${entityName}, query: \${query}\`);

                return JSON.stringify({
                    value: [
                        {
                            [\`\${entityName}id\`]: \`\${entityName}-1-mock-guid\`,
                            name: \`Mock \${entityName} 1\`,
                            createdon: new Date().toISOString()
                        },
                        {
                            [\`\${entityName}id\`]: \`\${entityName}-2-mock-guid\`,
                            name: \`Mock \${entityName} 2\`,
                            createdon: new Date().toISOString()
                        }
                    ],
                    "@odata.count": 2
                });
            }
        }
    },

    /**
     * User - Information about the signed-in user
     */
    User: {
        id: "mock-user-id-12345",
        fullname: "Mock Test User",
        email: "mockuser@example.com",
        username: "mockuser",
        Roles: ["System Administrator", "Portal User"],
        IsAuthenticated: true,
        contactid: "contact-mock-guid-12345",

        HasRole: function(roleName) {
            return this.Roles.includes(roleName);
        }
    },

    /**
     * Environment - Environment variables and settings
     */
    Environment: {
        GetVariable: function(variableName) {
            Server.Logger.Log(\`[MOCK] Environment.GetVariable called for: \${variableName}\`);

            // Mock environment variables
            const mockVariables = {
                "ApiBaseUrl": "https://api.mock.com",
                "ApiKey": "mock-api-key-12345",
                "DebugMode": "true",
                "MaxRetries": "3"
            };

            return mockVariables[variableName] || \`mock-value-for-\${variableName}\`;
        }
    },

    /**
     * Utility methods for testing
     */
    Mock: {
        /**
         * Reset mock data to defaults
         */
        Reset: function() {
            Server.Context.QueryParameters = { "id": "12345-test-guid" };
            Server.Context.Headers = {
                "Authorization": "Bearer mock-token",
                "Content-Type": "application/json"
            };
            Server.Context.Body = JSON.stringify({ name: "Test Account" });
            Server.Context.Method = "GET";
            Server.Logger.Log("[MOCK] Server mock reset to defaults");
        },

        /**
         * Set custom query parameters
         */
        SetQueryParameters: function(params) {
            Server.Context.QueryParameters = params;
            Server.Logger.Log(\`[MOCK] Query parameters set: \${JSON.stringify(params)}\`);
        },

        /**
         * Set custom headers
         */
        SetHeaders: function(headers) {
            Server.Context.Headers = headers;
            Server.Logger.Log(\`[MOCK] Headers set: \${JSON.stringify(headers)}\`);
        },

        /**
         * Set request body
         */
        SetBody: function(body) {
            Server.Context.Body = typeof body === 'string' ? body : JSON.stringify(body);
            Server.Logger.Log(\`[MOCK] Body set: \${Server.Context.Body}\`);
        },

        /**
         * Set HTTP method
         */
        SetMethod: function(method) {
            Server.Context.Method = method;
            Server.Logger.Log(\`[MOCK] Method set: \${method}\`);
        }
    }
};

// Make Server available globally
global.Server = Server;

// Load custom mock data if provided via environment variable
try {
    const mockDataPath = process.env.MOCK_DATA_PATH;
    if (mockDataPath) {
        const fs = require('fs');
        const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

        // Merge custom mock data into Server.Context
        if (mockData.User) {
            Object.assign(global.Server.User, mockData.User);
        }
        if (mockData.Context) {
            Object.assign(global.Server.Context, mockData.Context);
        }
        if (mockData.QueryParameters) {
            Object.assign(global.Server.Context.QueryParameters, mockData.QueryParameters);
        }
        if (mockData.Headers) {
            Object.assign(global.Server.Context.Headers, mockData.Headers);
        }

        console.log('[PowerPages] Custom mock data loaded from:', mockDataPath);
    }
} catch (e) {
    // Silently ignore if no custom mock data is available
}

console.log('\\n[PowerPages] ✅ Server Logic Mock SDK loaded successfully');
console.log('[PowerPages] 📝 All Server.* APIs are now available for debugging\\n');
`;
}
