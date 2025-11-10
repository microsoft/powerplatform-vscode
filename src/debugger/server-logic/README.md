# Server Logic Debugging

This directory contains the implementation for debugging Power Pages Server Logic files locally with mock SDK support.

## Features

- **Mock Server SDK**: Complete mock implementation of `Server.Logger`, `Server.Connector.HttpClient`, `Server.Connector.Dataverse`, `Server.Context`, `Server.User`, and `Server.Environment`
- **Breakpoint Debugging**: Set breakpoints and step through your server logic code
- **Variable Inspection**: Inspect variables and call stack in VS Code debugger
- **Custom Mock Data**: Provide custom mock data via `.vscode/mock-data.json`
- **IntelliSense Support**: Full autocomplete for all Server APIs

## How It Works

1. When debugging is initiated, the extension generates a runtime loader file (`.vscode/server-logic-runtime-loader.js`)
2. This loader injects the mock `Server` object into the global scope
3. Node.js debugger attaches with the loader pre-required via `--require` flag
4. Your server logic code runs with full debugging capabilities

## Usage

### Quick Start
1. Open a server logic file from `server-logics/` folder
2. Start debugging using any of these methods:
   - Click the **Debug** button in the editor toolbar
   - Click **▶ Debug** CodeLens above your function
   - Right-click and select "Debug Current Server Logic File"
   - Press F5
   - Use Command Palette: `Power Pages: Debug Current Server Logic File`
3. Set breakpoints and debug!

### Running Without Debugging
- Click **▶ Run** CodeLens to execute without stopping at breakpoints
- Use Command Palette: `Power Pages: Run Server Logic File`

### Commands
- `Power Pages: Debug Current Server Logic File` - Start debugging the active file
- `Power Pages: Run Server Logic File` - Run without debugging
- `Power Pages: Generate Mock Data Template` - Create a template for custom mock data

### Configuration
Add to your `launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server Logic",
  "program": "${workspaceFolder}/server-logics/MyLogic.js",
  "skipFiles": ["<node_internals>/**"]
}
```

### Custom Mock Data
Create `.vscode/mock-data.json`:
```json
{
  "User": {
    "id": "custom-user-id",
    "fullname": "John Doe",
    "email": "john.doe@example.com"
  },
  "Context": {
    "Method": "POST"
  },
  "QueryParameters": {
    "id": "123"
  }
}
```

## UI Features

### Editor Toolbar
When viewing a server logic file, you'll see a debug icon (🐛) in the editor toolbar for quick access.

### CodeLens
Above functions in your server logic file, you'll see inline actions:
- **▶ Debug** - Start debugging
- **▶ Run** - Run without debugging

### Context Menu
Right-click in any server logic file to access debug commands.

### Welcome Notification
First time you open a workspace with server logic files, you'll see a helpful notification with quick actions.

## Files

- `ServerLogicMockSdk.ts` - Mock SDK implementation generator
- `ServerLogicDebugger.ts` - Debug configuration provider, commands, and activation logic
- `ServerLogicCodeLensProvider.ts` - CodeLens provider for inline debug/run actions
- `index.ts` - Public exports
- `sample-server-logic.js` - Example file demonstrating all Server API patterns

## Technical Details

The debugger uses Node.js's `--require` flag to inject the mock SDK before the user's code runs. This ensures the `Server` global object is available throughout execution, matching the Power Pages runtime behavior.
