/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Generates the Mock SDK Runtime Loader for Power Pages Server Logic debugging.
 */
export function generateServerMockSdk(): string {
    return `
/**
 * Power Pages Server Logic - Mock SDK Runtime Loader
 *
 * This file provides mock implementations of the Server.* APIs for local debugging.
 *
 * HOW TO USE:
 * 1. Edit the mock data below to match your test scenarios
 * 2. Customize Server.Context with your test inputs (query params, body, headers)
 * 3. Set breakpoints in your server logic file and press F5 to debug
 *
 * DIRECT DATAVERSE CALLS:
 * When authenticated to Power Platform (via PAC CLI), Dataverse calls will
 * automatically use your authenticated credentials. No additional configuration needed!
 *
 * If not authenticated, mock responses will be returned instead.
 * This file is auto-generated and added to .gitignore.
 */

const DataverseConfig = {
    getUrl: function() {
        return process.env.DATAVERSE_URL || '';
    },

    getToken: function() {
        return process.env.DATAVERSE_TOKEN || '';
    },

    getApiVersion: function() {
        return process.env.DATAVERSE_API_VERSION || 'v9.2';
    },

    isConfigured: function() {
        return this.getUrl() && this.getToken();
    },

    getApiUrl: function() {
        const baseUrl = this.getUrl().endsWith('/') ? this.getUrl().slice(0, -1) : this.getUrl();
        return \`\${baseUrl}/api/data/\${this.getApiVersion()}\`;
    },

    getHeaders: function() {
        return {
            'Authorization': \`Bearer \${this.getToken()}\`,
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json; charset=utf-8',
            'Prefer': 'return=representation'
        };
    }
};

/**
 * Helper function to make HTTP requests to Dataverse
 */
async function makeDataverseRequest(method, endpoint, body = null) {
    const https = require('https');
    const urlLib = require('url');

    const apiUrl = DataverseConfig.getApiUrl();
    const fullUrl = \`\${apiUrl}/\${endpoint}\`;
    const parsedUrl = urlLib.parse(fullUrl);

    return new Promise((resolve, reject) => {
        const headers = DataverseConfig.getHeaders();
        if (body) {
            headers['Content-Length'] = Buffer.byteLength(body);
        }

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || 443,
            path: parsedUrl.path,
            method: method,
            headers: headers
        };

        Server.Logger.Log(\`[DATAVERSE] Making \${method} request to: \${fullUrl}\`);

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const responseHeaders = {};
                for (const [key, value] of Object.entries(res.headers)) {
                    responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
                }

                // Extract entity ID from OData-EntityId header if present
                let entityId = null;
                if (responseHeaders['odata-entityid']) {
                    const match = responseHeaders['odata-entityid'].match(/\\(([^)]+)\\)/);
                    if (match) {
                        entityId = match[1];
                    }
                }

                const response = {
                    StatusCode: res.statusCode,
                    Body: data || '',
                    IsSuccessStatusCode: res.statusCode >= 200 && res.statusCode < 300,
                    ReasonPhrase: res.statusMessage || '',
                    ServerError: false,
                    ServerErrorMessage: null,
                    Headers: responseHeaders
                };

                if (entityId) {
                    response.Headers.entityId = entityId;
                }

                Server.Logger.Log(\`[DATAVERSE] Request completed with status: \${res.statusCode}\`);
                resolve(response);
            });
        });

        req.on('error', (error) => {
            Server.Logger.Error(\`[DATAVERSE] Request failed: \${error.message}\`);
            const errorResponse = {
                StatusCode: 0,
                Body: null,
                IsSuccessStatusCode: false,
                ReasonPhrase: null,
                ServerError: true,
                ServerErrorMessage: \`Error executing \${method} request to '\${fullUrl}': \${error.message}\`,
                Headers: {}
            };
            resolve(errorResponse);
        });

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

const Server = {
    Logger: {
        Log: function (message) {
            console.log(\`[LOG] \${new Date().toISOString()} - \${message}\`);
        },
        Error: function (message) {
            console.error(\`[ERROR] \${new Date().toISOString()} - \${message}\`);
        },
        Warning: function (message) {
            console.warn(\`[WARNING] \${new Date().toISOString()} - \${message}\`);
        },
        Info: function (message) {
            console.info(\`[INFO] \${new Date().toISOString()} - \${message}\`);
        }
    },

    Context: {
        QueryParameters: {
            "id": "12345-test-guid"
        },
        Headers: {
            "Authorization": "Bearer mock-token",
            "Content-Type": "application/json",
            "User-Agent": "MockClient/1.0"
        },
        Body: JSON.stringify({
            name: "Test Account",
            telephone1: "555-0100"
        }),
        Method: "POST", // GET, POST, PUT, PATCH, DELETE
        Url: "https://mock-server.example.com/api/test"
    },

    Connector: {
        HttpClient: {
            GetAsync: async function (url, headers = {}) {
                Server.Logger.Log(\`[MOCK] HttpClient.GetAsync called with URL: \${url}\`);

                const isNodeJs = typeof process !== 'undefined' &&
                    process.versions != null &&
                    process.versions.node != null;

                if (isNodeJs) {
                    Server.Logger.Log(\`[NODE.JS] Making actual GET request to: \${url}\`);

                    try {
                        const https = require('https');
                        const http = require('http');
                        const urlLib = require('url');

                        const parsedUrl = urlLib.parse(url);
                        const protocol = parsedUrl.protocol === 'https:' ? https : http;

                        return new Promise((resolve, reject) => {
                            const options = {
                                hostname: parsedUrl.hostname,
                                port: parsedUrl.port,
                                path: parsedUrl.path,
                                method: 'GET',
                                headers: headers
                            };

                            const req = protocol.request(options, (res) => {
                                let data = '';

                                res.on('data', (chunk) => {
                                    data += chunk;
                                });

                                res.on('end', () => {
                                    const responseHeaders = {};
                                    for (const [key, value] of Object.entries(res.headers)) {
                                        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
                                    }

                                    const response = {
                                        StatusCode: res.statusCode,
                                        Body: data,
                                        IsSuccessStatusCode: res.statusCode >= 200 && res.statusCode < 300,
                                        ReasonPhrase: res.statusMessage || '',
                                        ServerError: false,
                                        ServerErrorMessage: null,
                                        Headers: responseHeaders
                                    };
                                    Server.Logger.Log(\`[NODE.JS] GET request completed with status: \${res.statusCode}\`);
                                    resolve(JSON.stringify(response));
                                });
                            });

                            req.on('error', (error) => {
                                Server.Logger.Error(\`[NODE.JS] GET request failed: \${error.message}\`);

                                const errorResponse = {
                                    StatusCode: 0,
                                    Body: null,
                                    IsSuccessStatusCode: false,
                                    ReasonPhrase: null,
                                    ServerError: true,
                                    ServerErrorMessage: \`Error executing GET request to '\${url}': \${error.message}\`,
                                    Headers: {}
                                };
                                resolve(JSON.stringify(errorResponse));
                            });

                            req.end();
                        });
                    } catch (error) {
                        Server.Logger.Error(\`[NODE.JS] Error making GET request: \${error.message}\`);

                        const errorResponse = {
                            StatusCode: 0,
                            Body: null,
                            IsSuccessStatusCode: false,
                            ReasonPhrase: null,
                            ServerError: true,
                            ServerErrorMessage: \`Error executing GET request to '\${url}': \${error.message}\`,
                            Headers: {}
                        };
                        return JSON.stringify(errorResponse);
                    }
                } else {
                    Server.Logger.Log(\`[BROWSER] Returning mock response\`);

                    await new Promise(resolve => setTimeout(resolve, 100));

                    const mockResponse = {
                        StatusCode: 200,
                        Body: "{}",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "OK",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "Content-Type": "application/json",
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(mockResponse);
                }
            },

            PostAsync: async function (url, body, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.PostAsync called with URL: \${url}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                const isNodeJs = typeof process !== 'undefined' &&
                    process.versions != null &&
                    process.versions.node != null;

                if (isNodeJs) {
                    Server.Logger.Log(\`[NODE.JS] Making actual POST request to: \${url}\`);

                    try {
                        const https = require('https');
                        const http = require('http');
                        const urlLib = require('url');

                        const parsedUrl = urlLib.parse(url);
                        const protocol = parsedUrl.protocol === 'https:' ? https : http;

                        return new Promise((resolve, reject) => {
                            const requestHeaders = {
                                ...headers,
                                'Content-Type': contentType,
                                'Content-Length': Buffer.byteLength(body || '')
                            };

                            const options = {
                                hostname: parsedUrl.hostname,
                                port: parsedUrl.port,
                                path: parsedUrl.path,
                                method: 'POST',
                                headers: requestHeaders
                            };

                            const req = protocol.request(options, (res) => {
                                let data = '';

                                res.on('data', (chunk) => {
                                    data += chunk;
                                });

                                res.on('end', () => {
                                    const responseHeaders = {};
                                    for (const [key, value] of Object.entries(res.headers)) {
                                        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
                                    }

                                    const response = {
                                        StatusCode: res.statusCode,
                                        Body: data,
                                        IsSuccessStatusCode: res.statusCode >= 200 && res.statusCode < 300,
                                        ReasonPhrase: res.statusMessage || '',
                                        ServerError: false,
                                        ServerErrorMessage: null,
                                        Headers: responseHeaders
                                    };
                                    Server.Logger.Log(\`[NODE.JS] POST request completed with status: \${res.statusCode}\`);
                                    resolve(JSON.stringify(response));
                                });
                            });

                            req.on('error', (error) => {
                                Server.Logger.Error(\`[NODE.JS] POST request failed: \${error.message}\`);
                                const errorResponse = {
                                    StatusCode: 0,
                                    Body: null,
                                    IsSuccessStatusCode: false,
                                    ReasonPhrase: null,
                                    ServerError: true,
                                    ServerErrorMessage: \`Error executing POST request to '\${url}': \${error.message}\`,
                                    Headers: {}
                                };
                                resolve(JSON.stringify(errorResponse));
                            });

                            if (body) {
                                req.write(body);
                            }
                            req.end();
                        });
                    } catch (error) {
                        Server.Logger.Error(\`[NODE.JS] Error making POST request: \${error.message}\`);
                        const errorResponse = {
                            StatusCode: 0,
                            Body: null,
                            IsSuccessStatusCode: false,
                            ReasonPhrase: null,
                            ServerError: true,
                            ServerErrorMessage: \`Error executing POST request to '\${url}': \${error.message}\`,
                            Headers: {}
                        };
                        return JSON.stringify(errorResponse);
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const mockResponse = {
                        StatusCode: 201,
                        Body: "{}",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "Created",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "Content-Type": contentType,
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(mockResponse);
                }
            },

            PatchAsync: async function (url, body, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.PatchAsync called with URL: \${url}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                const isNodeJs = typeof process !== 'undefined' &&
                    process.versions != null &&
                    process.versions.node != null;

                if (isNodeJs) {
                    Server.Logger.Log(\`[NODE.JS] Making actual PATCH request to: \${url}\`);

                    try {
                        const https = require('https');
                        const http = require('http');
                        const urlLib = require('url');

                        const parsedUrl = urlLib.parse(url);
                        const protocol = parsedUrl.protocol === 'https:' ? https : http;

                        return new Promise((resolve, reject) => {
                            const requestHeaders = {
                                ...headers,
                                'Content-Type': contentType,
                                'Content-Length': Buffer.byteLength(body || '')
                            };

                            const options = {
                                hostname: parsedUrl.hostname,
                                port: parsedUrl.port,
                                path: parsedUrl.path,
                                method: 'PATCH',
                                headers: requestHeaders
                            };

                            const req = protocol.request(options, (res) => {
                                let data = '';

                                res.on('data', (chunk) => {
                                    data += chunk;
                                });

                                res.on('end', () => {
                                    const responseHeaders = {};
                                    for (const [key, value] of Object.entries(res.headers)) {
                                        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
                                    }

                                    const response = {
                                        StatusCode: res.statusCode,
                                        Body: data,
                                        IsSuccessStatusCode: res.statusCode >= 200 && res.statusCode < 300,
                                        ReasonPhrase: res.statusMessage || '',
                                        ServerError: false,
                                        ServerErrorMessage: null,
                                        Headers: responseHeaders
                                    };
                                    Server.Logger.Log(\`[NODE.JS] PATCH request completed with status: \${res.statusCode}\`);
                                    resolve(JSON.stringify(response));
                                });
                            });

                            req.on('error', (error) => {
                                Server.Logger.Error(\`[NODE.JS] PATCH request failed: \${error.message}\`);
                                const errorResponse = {
                                    StatusCode: 0,
                                    Body: null,
                                    IsSuccessStatusCode: false,
                                    ReasonPhrase: null,
                                    ServerError: true,
                                    ServerErrorMessage: \`Error executing PATCH request to '\${url}': \${error.message}\`,
                                    Headers: {}
                                };
                                resolve(JSON.stringify(errorResponse));
                            });

                            if (body) {
                                req.write(body);
                            }
                            req.end();
                        });
                    } catch (error) {
                        Server.Logger.Error(\`[NODE.JS] Error making PATCH request: \${error.message}\`);
                        const errorResponse = {
                            StatusCode: 0,
                            Body: null,
                            IsSuccessStatusCode: false,
                            ReasonPhrase: null,
                            ServerError: true,
                            ServerErrorMessage: \`Error executing PATCH request to '\${url}': \${error.message}\`,
                            Headers: {}
                        };
                        return JSON.stringify(errorResponse);
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const mockResponse = {
                        StatusCode: 200,
                        Body: "{}",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "OK",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "Content-Type": contentType,
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(mockResponse);
                }
            },

            PutAsync: async function (url, body, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.PutAsync called with URL: \${url}\`);
                Server.Logger.Log(\`[MOCK] Body: \${body}\`);

                const isNodeJs = typeof process !== 'undefined' &&
                    process.versions != null &&
                    process.versions.node != null;

                if (isNodeJs) {
                    Server.Logger.Log(\`[NODE.JS] Making actual PUT request to: \${url}\`);

                    try {
                        const https = require('https');
                        const http = require('http');
                        const urlLib = require('url');

                        const parsedUrl = urlLib.parse(url);
                        const protocol = parsedUrl.protocol === 'https:' ? https : http;

                        return new Promise((resolve, reject) => {
                            const requestHeaders = {
                                ...headers,
                                'Content-Type': contentType,
                                'Content-Length': Buffer.byteLength(body || '')
                            };

                            const options = {
                                hostname: parsedUrl.hostname,
                                port: parsedUrl.port,
                                path: parsedUrl.path,
                                method: 'PUT',
                                headers: requestHeaders
                            };

                            const req = protocol.request(options, (res) => {
                                let data = '';

                                res.on('data', (chunk) => {
                                    data += chunk;
                                });

                                res.on('end', () => {
                                    const responseHeaders = {};
                                    for (const [key, value] of Object.entries(res.headers)) {
                                        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
                                    }

                                    const response = {
                                        StatusCode: res.statusCode,
                                        Body: data,
                                        IsSuccessStatusCode: res.statusCode >= 200 && res.statusCode < 300,
                                        ReasonPhrase: res.statusMessage || '',
                                        ServerError: false,
                                        ServerErrorMessage: null,
                                        Headers: responseHeaders
                                    };
                                    Server.Logger.Log(\`[NODE.JS] PUT request completed with status: \${res.statusCode}\`);
                                    resolve(JSON.stringify(response));
                                });
                            });

                            req.on('error', (error) => {
                                Server.Logger.Error(\`[NODE.JS] PUT request failed: \${error.message}\`);
                                const errorResponse = {
                                    StatusCode: 0,
                                    Body: null,
                                    IsSuccessStatusCode: false,
                                    ReasonPhrase: null,
                                    ServerError: true,
                                    ServerErrorMessage: \`Error executing PUT request to '\${url}': \${error.message}\`,
                                    Headers: {}
                                };
                                resolve(JSON.stringify(errorResponse));
                            });

                            if (body) {
                                req.write(body);
                            }
                            req.end();
                        });
                    } catch (error) {
                        Server.Logger.Error(\`[NODE.JS] Error making PUT request: \${error.message}\`);
                        const errorResponse = {
                            StatusCode: 0,
                            Body: null,
                            IsSuccessStatusCode: false,
                            ReasonPhrase: null,
                            ServerError: true,
                            ServerErrorMessage: \`Error executing PUT request to '\${url}': \${error.message}\`,
                            Headers: {}
                        };
                        return JSON.stringify(errorResponse);
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const mockResponse = {
                        StatusCode: 200,
                        Body: "{}",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "OK",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "Content-Type": contentType,
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(mockResponse);
                }
            },

            DeleteAsync: async function (url, headers = {}, contentType = "application/json") {
                Server.Logger.Log(\`[MOCK] HttpClient.DeleteAsync called with URL: \${url}\`);

                const isNodeJs = typeof process !== 'undefined' &&
                    process.versions != null &&
                    process.versions.node != null;

                if (isNodeJs) {
                    Server.Logger.Log(\`[NODE.JS] Making actual DELETE request to: \${url}\`);

                    try {
                        const https = require('https');
                        const http = require('http');
                        const urlLib = require('url');

                        const parsedUrl = urlLib.parse(url);
                        const protocol = parsedUrl.protocol === 'https:' ? https : http;

                        return new Promise((resolve, reject) => {
                            const options = {
                                hostname: parsedUrl.hostname,
                                port: parsedUrl.port,
                                path: parsedUrl.path,
                                method: 'DELETE',
                                headers: headers
                            };

                            const req = protocol.request(options, (res) => {
                                let data = '';

                                res.on('data', (chunk) => {
                                    data += chunk;
                                });

                                res.on('end', () => {
                                    const responseHeaders = {};
                                    for (const [key, value] of Object.entries(res.headers)) {
                                        responseHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
                                    }

                                    const response = {
                                        StatusCode: res.statusCode,
                                        Body: data,
                                        IsSuccessStatusCode: res.statusCode >= 200 && res.statusCode < 300,
                                        ReasonPhrase: res.statusMessage || '',
                                        ServerError: false,
                                        ServerErrorMessage: null,
                                        Headers: responseHeaders
                                    };
                                    Server.Logger.Log(\`[NODE.JS] DELETE request completed with status: \${res.statusCode}\`);
                                    resolve(JSON.stringify(response));
                                });
                            });

                            req.on('error', (error) => {
                                Server.Logger.Error(\`[NODE.JS] DELETE request failed: \${error.message}\`);
                                const errorResponse = {
                                    StatusCode: 0,
                                    Body: null,
                                    IsSuccessStatusCode: false,
                                    ReasonPhrase: null,
                                    ServerError: true,
                                    ServerErrorMessage: \`Error executing DELETE request to '\${url}': \${error.message}\`,
                                    Headers: {}
                                };
                                resolve(JSON.stringify(errorResponse));
                            });

                            req.end();
                        });
                    } catch (error) {
                        Server.Logger.Error(\`[NODE.JS] Error making DELETE request: \${error.message}\`);
                        const errorResponse = {
                            StatusCode: 0,
                            Body: null,
                            IsSuccessStatusCode: false,
                            ReasonPhrase: null,
                            ServerError: true,
                            ServerErrorMessage: \`Error executing DELETE request to '\${url}': \${error.message}\`,
                            Headers: {}
                        };
                        return JSON.stringify(errorResponse);
                    }
                } else {
                    await new Promise(resolve => setTimeout(resolve, 100));

                    const mockResponse = {
                        StatusCode: 204,
                        Body: "",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "No Content",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(mockResponse);
                }
            }
        },

        Dataverse: {
            CreateRecord: async function (entitySetName, payload) {
                Server.Logger.Log(\`Dataverse.CreateRecord called for entity: \${entitySetName}\`);

                try {
                    // Check if direct Dataverse calls are configured
                    if (DataverseConfig.isConfigured()) {
                        const response = await makeDataverseRequest('POST', entitySetName, payload);
                        return JSON.stringify(response);
                    }

                    // Return mock response if not configured
                    const response = {
                        StatusCode: 204,
                        Body: "",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "No Content",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "Location": "",
                            "entityId": "xxxxxxxx-74cc-f011-8545-7ced8d3b4d9e",
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(response);
                } catch (error) {
                    const errorResponse = {
                        StatusCode: 500,
                        Body: null,
                        IsSuccessStatusCode: false,
                        ReasonPhrase: "Internal Server Error",
                        ServerError: true,
                        ServerErrorMessage: \`Error executing POST request to '\${entitySetName}': \${error.message}\`,
                        Headers: {}
                    };
                    return JSON.stringify(errorResponse);
                }
            },

            RetrieveRecord: async function (entitySetName, id, options = null, skipCache = false) {
                Server.Logger.Log(\`Dataverse.RetrieveRecord called for entity: \${entitySetName}, id: \${id}\`);

                try {
                    // Check if direct Dataverse calls are configured
                    if (DataverseConfig.isConfigured()) {
                        let endpoint = \`\${entitySetName}(\${id})\`;
                        if (options) {
                            endpoint += options;
                        }
                        const response = await makeDataverseRequest('GET', endpoint);
                        return JSON.stringify(response);
                    }

                    // Return mock response if not configured
                    const response = {
                        StatusCode: 200,
                        Body: "{}",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "OK",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "OData-Version": "4.0",
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(response);
                } catch (error) {
                    const errorResponse = {
                        StatusCode: 500,
                        Body: null,
                        IsSuccessStatusCode: false,
                        ReasonPhrase: "Internal Server Error",
                        ServerError: true,
                        ServerErrorMessage: \`Error executing GET request to '\${entitySetName}(\${id})': \${error.message}\`,
                        Headers: {}
                    };
                    return JSON.stringify(errorResponse);
                }
            },

            RetrieveMultipleRecords: async function (entitySetName, options = null, skipCache = false) {
                Server.Logger.Log(\`Dataverse.RetrieveMultipleRecords called for entity: \${entitySetName}\`);

                try {
                    // Check if direct Dataverse calls are configured
                    if (DataverseConfig.isConfigured()) {
                        let endpoint = entitySetName;
                        if (options) {
                            endpoint += options;
                        }
                        const response = await makeDataverseRequest('GET', endpoint);
                        return JSON.stringify(response);
                    }

                    // Return mock response if not configured
                    const response = {
                        StatusCode: 200,
                        Body: "{}",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "OK",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "OData-Version": "4.0",
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(response);
                } catch (error) {
                    const errorResponse = {
                        StatusCode: 500,
                        Body: null,
                        IsSuccessStatusCode: false,
                        ReasonPhrase: "Internal Server Error",
                        ServerError: true,
                        ServerErrorMessage: \`Error executing GET request to '\${entitySetName}': \${error.message}\`,
                        Headers: {}
                    };
                    return JSON.stringify(errorResponse);
                }
            },

            UpdateRecord: async function (entitySetName, id, payload) {
                Server.Logger.Log(\`Dataverse.UpdateRecord called for entity: \${entitySetName}, id: \${id}\`);

                try {
                    // Check if direct Dataverse calls are configured
                    if (DataverseConfig.isConfigured()) {
                        const endpoint = \`\${entitySetName}(\${id})\`;
                        const response = await makeDataverseRequest('PATCH', endpoint, payload);
                        return JSON.stringify(response);
                    }

                    // Return mock response if not configured
                    const response = {
                        StatusCode: 204,
                        Body: "",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "No Content",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "Location": "",
                            "entityId": "xxxxxxxx-74cc-f011-8545-7ced8d3b4d9e",
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(response);
                } catch (error) {
                    const errorResponse = {
                        StatusCode: 500,
                        Body: null,
                        IsSuccessStatusCode: false,
                        ReasonPhrase: "Internal Server Error",
                        ServerError: true,
                        ServerErrorMessage: \`Error executing PATCH request to '\${entitySetName}(\${id})': \${error.message}\`,
                        Headers: {}
                    };
                    return JSON.stringify(errorResponse);
                }
            },

            DeleteRecord: async function (entitySetName, id) {
                Server.Logger.Log(\`Dataverse.DeleteRecord called for entity: \${entitySetName}, id: \${id}\`);

                try {
                    // Check if direct Dataverse calls are configured
                    if (DataverseConfig.isConfigured()) {
                        const endpoint = \`\${entitySetName}(\${id})\`;
                        const response = await makeDataverseRequest('DELETE', endpoint);
                        return JSON.stringify(response);
                    }

                    // Return mock response if not configured
                    const response = {
                        StatusCode: 204,
                        Body: "",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "No Content",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(response);
                } catch (error) {
                    const errorResponse = {
                        StatusCode: 500,
                        Body: null,
                        IsSuccessStatusCode: false,
                        ReasonPhrase: "Internal Server Error",
                        ServerError: true,
                        ServerErrorMessage: \`Error executing DELETE request to '\${entitySetName}(\${id})': \${error.message}\`,
                        Headers: {}
                    };
                    return JSON.stringify(errorResponse);
                }
            },

            InvokeCustomApi: async function (method, url, payload = null) {
                Server.Logger.Log(\`Dataverse.InvokeCustomApi called with method: \${method}, url: \${url}\`);

                try {
                    // Validate method (only GET and POST supported)
                    const upperMethod = method?.toUpperCase();
                    if (upperMethod !== 'GET' && upperMethod !== 'POST') {
                        const errorResponse = {
                            StatusCode: 400,
                            Body: null,
                            IsSuccessStatusCode: false,
                            ReasonPhrase: \`The HTTP method '\${method}' is not supported for invoking custom APIs. Only 'GET' and 'POST' are supported.\`,
                            ServerError: true,
                            ServerErrorMessage: \`Error executing \${method} request to '\${url}'\`,
                            Headers: {}
                        };
                        return JSON.stringify(errorResponse);
                    }

                    // Check if direct Dataverse calls are configured
                    if (DataverseConfig.isConfigured()) {
                        const response = await makeDataverseRequest(upperMethod, url, upperMethod === 'POST' ? payload : null);
                        return JSON.stringify(response);
                    }

                    // Return mock response if not configured
                    const response = {
                        StatusCode: 200,
                        Body: "",
                        IsSuccessStatusCode: true,
                        ReasonPhrase: "OK",
                        ServerError: false,
                        ServerErrorMessage: null,
                        Headers: {
                            "X-Mock-Response": "true"
                        }
                    };

                    return JSON.stringify(response);
                } catch (error) {
                    const errorResponse = {
                        StatusCode: 500,
                        Body: null,
                        IsSuccessStatusCode: false,
                        ReasonPhrase: "Internal Server Error",
                        ServerError: true,
                        ServerErrorMessage: \`Error executing \${method} request to '\${url}': \${error.message}\`,
                        Headers: {}
                    };
                    return JSON.stringify(errorResponse);
                }
            }
        }
    },

    User: {
        fullname: "Mock Test User",
        email: "mockuser@example.com",
        Roles: ["System Administrator", "Portal User"],
        contactid: "contact-mock-guid-12345",
    },

    SiteSetting: {
        Get: function (name) {
            Server.Logger.Log(\`[MOCK] SiteSetting.Get called for: \${name}\`);

            return \`mock-value-for-\${name}\`;
        }
    },

    Website: {
        adx_name: "Mock Website Name",
        adx_websiteid: "website-mock-guid-67890"
    },

    EnvironmentVariable: {
        Get: function (variableName) {
            Server.Logger.Log(\`[MOCK] Environment.GetVariable called for: \${variableName}\`);

            return \`mock-value-for-\${variableName}\`;
        }
    }
};


// Make available globally for browser/script environments
if (typeof global !== 'undefined') {
    global.Server = Server;
    global.DataverseConfig = DataverseConfig;
}

// Log Dataverse configuration status
if (DataverseConfig.isConfigured()) {
    console.log('\\n[PowerPages] ✅ Server Logic Mock SDK loaded successfully');
    console.log('[PowerPages] 🔗 Dataverse direct calls ENABLED');
    console.log(\`[PowerPages] 📍 Dataverse URL: \${DataverseConfig.getUrl()}\`);
    console.log('[PowerPages] 📝 All Server.* APIs are now available for debugging\\n');
} else {
    console.log('\\n[PowerPages] ✅ Server Logic Mock SDK loaded successfully');
    console.log('[PowerPages] ⚠️  Dataverse direct calls DISABLED (mock mode)');
    console.log('[PowerPages] 💡 Authenticate via PAC CLI to enable direct Dataverse calls:');
    console.log('[PowerPages]    pac auth create --environment https://yourorg.crm.dynamics.com');
    console.log('[PowerPages] 📝 All Server.* APIs are now available for debugging (with mock responses)\\n');
}
`;
}
