# Server API Autocomplete for Power Platform VS Code Extension

This module provides intelligent autocomplete support for Power Pages Server APIs in JavaScript files within both web and desktop VS Code environments.

## Overview

The Server API autocomplete feature helps developers write server-side JavaScript code for Power Pages by providing IntelliSense support for the following APIs:

- `Server.Logger` - Logging functionality
- `Server.Connector.HttpClient` - HTTP client for external API calls (blocks access to Dataverse)
- `Server.Connector.Dataverse` - Dataverse operations and data access

## Features

- **Intelligent Autocomplete**: Type `Server.` to see available namespaces
- **Sub-namespace Support**: Navigate through `Server.Connector.` to access HttpClient and Dataverse APIs
- **Method Suggestions**: Get method completions with proper parameter information
- **Parameter Hints**: Get parameter information and types for each method
- **Documentation**: Rich documentation with examples for each API
- **Snippet Support**: Smart snippets with placeholders for required parameters
- **Cross-Platform**: Works in both desktop VS Code and VS Code for Web
- **JavaScript Only**: Specifically designed for `.js` files where Power Pages server-side scripting occurs

## File Structure

```text
src/common/intellisense/
├── index.ts                           # Public API exports
├── ServerApiCompletionProvider.ts     # Main completion provider implementation
├── ServerApiAutocompleteRegistrar.ts  # Registration utilities
├── test/
│   └── ServerApiAutocomplete.test.ts  # Test suite and usage examples
└── README.md                          # This documentation
```

## Usage

### For Extension Developers

The autocomplete functionality is automatically registered when the extension activates:

```typescript
import { activateServerApiAutocomplete } from '../common/intellisense';

// In your extension's activate function
export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Register Server API autocomplete for JavaScript files only
    activateServerApiAutocomplete(context, [
        { languageId: 'javascript', triggerCharacters: ['.'] }
    ]);
}
```

### For Power Pages Developers

In any JavaScript file (`.js`), start typing `Server.` to see the available APIs:

```javascript
// Type "Server." to see all available namespaces
Server.Logger.Log('Application started');

// Type "Server.Connector." to see Connector sub-namespaces
Server.Connector.HttpClient.Get(url, headers);
Server.Connector.Dataverse.RetrieveRecord(entitySetName, id, options);

// Type "Server.Connector.HttpClient." to see HTTP client methods
const response = Server.Connector.HttpClient.Get('https://api.example.com/data', headers);
const postResult = Server.Connector.HttpClient.Post('https://api.example.com/users', jsonBody, headers);

// Type "Server.Connector.Dataverse." to see Dataverse operations
const contact = Server.Connector.Dataverse.RetrieveRecord('contacts', contactId, '$select=firstname,lastname');
const newContactId = Server.Connector.Dataverse.CreateRecord('contacts', payload);
```

## API Reference

### Server.Logger

Provides logging functionality for Power Pages server-side scripts.

**Methods:**

- `Log(message: string)` - Logs a message

**Example:**

```javascript
Server.Logger.Log('Application started');
Server.Logger.Log('User logged in: ' + userId);
```

### Server.Connector.HttpClient

Provides HTTP client functionality for external API calls. **Note: This will block access to Dataverse.**

**Methods:**

- `Get(url: string, headers: IDictionary<string, string>): HttpResponse` - Performs HTTP GET
- `Post(url: string, jsonBody: string, headers: IDictionary<string, string>): HttpResponse` - Performs HTTP POST
- `Patch(url: string, jsonBody: string, headers: IDictionary<string, string>): HttpResponse` - Performs HTTP PATCH
- `Put(url: string, jsonBody: string, headers: IDictionary<string, string>): HttpResponse` - Performs HTTP PUT
- `Delete(url: string, headers: IDictionary<string, string>): HttpResponse` - Performs HTTP DELETE

**Example:**

```javascript
const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
const response = Server.Connector.HttpClient.Get('https://api.example.com/data', headers);
const postResult = Server.Connector.HttpClient.Post('https://api.example.com/users', JSON.stringify(userData), headers);
```

### Server.Connector.Dataverse

Provides access to Dataverse operations and data.

**Methods:**

- `CreateRecord(entitySetName: string, payload: string): string` - Creates a new record
- `RetrieveRecord(entitySetName: string, id: string, options: string): DataverseRecord` - Retrieves a single record
- `RetrieveMultipleRecords(entitySetName: string, options: string): DataverseRecord[]` - Retrieves multiple records
- `UpdateRecord(entitySetName: string, id: string, payload: string): void` - Updates a record
- `DeleteRecord(entitySetName: string, id: string): void` - Deletes a record

**Example:**

```javascript
// Create a new contact
const contactPayload = JSON.stringify({ firstname: 'John', lastname: 'Doe', emailaddress1: 'john@example.com' });
const newContactId = Server.Connector.Dataverse.CreateRecord('contacts', contactPayload);

// Retrieve a contact with specific fields
const contact = Server.Connector.Dataverse.RetrieveRecord('contacts', contactId, '$select=firstname,lastname,emailaddress1');

// Retrieve multiple contacts with filtering
const contacts = Server.Connector.Dataverse.RetrieveMultipleRecords('contacts', '$filter=lastname eq \\'Smith\\'&$select=firstname,lastname');

// Update a contact
const updatePayload = JSON.stringify({ firstname: 'Jane' });
Server.Connector.Dataverse.UpdateRecord('contacts', contactId, updatePayload);

// Delete a contact
Server.Connector.Dataverse.DeleteRecord('contacts', contactId);
```

## Implementation Details

### Architecture

The autocomplete system is built with the following components:

1. **ServerApiDefinitions**: Static class containing all API definitions
2. **ServerApiCompletionProvider**: Main completion provider implementing VS Code's `CompletionItemProvider`
3. **ServerApiAutocompleteRegistrar**: Utility for registering the provider with specific language configurations

### Nested Namespace Support

The completion provider supports multi-level namespaces:

- `Server.` → Shows top-level namespaces (Logger, Connector)
- `Server.Connector.` → Shows Connector sub-namespaces (HttpClient, Dataverse)
- `Server.Connector.HttpClient.` → Shows HttpClient methods (Get, Post, Patch, Put, Delete)
- `Server.Connector.Dataverse.` → Shows Dataverse methods (CreateRecord, RetrieveRecord, etc.)

### Trigger Characters

The autocomplete is triggered by the `.` character, which allows for contextual completion as users navigate through the Server API hierarchy.

### Language Support

Currently, the autocomplete is **only supported for JavaScript files** (`.js` files) as this is where Power Pages server-side scripting is typically implemented.

### Context Detection

The completion provider uses smart context detection to determine when to provide Server API completions:

- Detects `Server.` prefix for top-level namespace completions
- Detects `Server.Connector.` for sub-namespace completions
- Detects specific namespace patterns for method completions
- Ignores non-Server related contexts to avoid interfering with other autocomplete providers

## Testing

The module includes comprehensive tests covering:

- API definition structure validation
- Completion provider functionality for nested namespaces
- Context-aware completion suggestions
- Documentation and snippet generation

Run tests using:

```bash
npm run test
```

## Browser Compatibility

This implementation works in both:

- **Desktop VS Code**: Full Node.js environment
- **VS Code for Web**: Browser-based environment with limited APIs

The code uses only VS Code extension APIs that are available in both environments.

## Important Notes

- **HttpClient vs Dataverse**: Using `Server.Connector.HttpClient` will block access to Dataverse operations
- **Parameter Types**: All methods expect specific parameter types as shown in the API reference
- **JSON Payloads**: Dataverse operations require JSON string payloads, not JavaScript objects
- **Entity Set Names**: Use plural entity set names (e.g., 'contacts' not 'contact') for Dataverse operations
