# Technical Context - Power Platform Extension

## Technology Stack

### Core Technologies
- **TypeScript 5.9.2**: Primary language for type safety and modern JavaScript features
- **Node.js 14+**: Runtime for desktop extension host
- **VSCode Extension API**: Integration with Visual Studio Code platform
- **Webpack 5**: Module bundling for both desktop and web targets

### Build & Development Tools
- **Gulp 5.0**: Task automation and build orchestration
- **ESLint**: Code linting and style enforcement
- **Mocha 11**: Unit testing framework
- **NYC/Istanbul**: Code coverage reporting
- **TypeScript Compiler**: Source compilation and type checking

### Extension Architecture Technologies

#### Language Servers
- **Language Server Protocol**: Communication between client and servers
- **vscode-languageserver 7.0**: Server-side LSP implementation
- **vscode-languageclient 7.0**: Client-side LSP integration

#### Authentication & Identity
- **@vscode/extension-telemetry**: Privacy-compliant telemetry
- **Azure AD Integration**: Enterprise authentication flows
- **jwt-decode**: Token parsing and validation

#### Web Extension Support
- **Webpack Browser Polyfills**: Node.js compatibility in browsers
- **Stream/HTTP Browserify**: Network operations in web context
- **Worker Loader**: Web Worker support for background processing

## Development Environment Requirements

### Minimum System Requirements
- **VSCode**: 1.91.0 or higher
- **Node.js**: 14+ (npm 8.3.0+)
- **.NET Framework**: 4.8 (Windows) or .NET 6.0+ SDK (macOS/Linux)

### Platform Support
```yaml
Desktop Environments:
  - Windows 10/11
  - macOS (Intel/Apple Silicon)
  - Linux (various distributions)
  - WSL (Windows Subsystem for Linux)

Web Environments:
  - VSCode for Web (vscode.dev)
  - Browser-based development
  - Limited functionality compared to desktop
```

### Development Setup
```bash
# Install dependencies
npm install

# Build extension
npm run build

# Run tests
npm test

# Package for distribution
npm run dist
```

## Key Dependencies

### Production Dependencies
```json
{
  "@microsoft/generator-powerpages": "1.21.19",      // Code generators
  "@vscode/extension-telemetry": "0.6.2",           // Telemetry
  "@xmldom/xmldom": "0.8.10",                       // XML processing
  "liquidjs": "10.2.0",                             // Liquid template engine
  "puppeteer-core": "22.13.1",                      // Browser automation
  "vscode-languageclient": "7.0.0",                 // LSP client
  "vscode-languageserver": "7.0.0",                 // LSP server
  "yaml": "2.7.0"                                   // YAML processing
}
```

### Development Dependencies
- **@types/***: TypeScript definitions for all major dependencies
- **@typescript-eslint/***: TypeScript-aware linting
- **@vscode/test-***: Testing utilities for VSCode extensions
- **webpack-***: Build tool ecosystem

## Architecture Constraints

### VSCode Extension Limitations
- **Activation Events**: Extension must declare when it activates
- **Contribution Points**: UI elements must be declared in package.json
- **Security Context**: Limited file system and network access
- **Bundle Size**: Performance considerations for extension loading

### Multi-Target Compilation
```typescript
// Desktop target (Node.js)
main: "./dist/extension"

// Web target (Browser)
browser: "./dist/web/extension.js"
```

### Platform-Specific Features
- **Interactive Authentication**: Requires desktop environment
- **CLI Integration**: Native process execution (desktop only)
- **File System Access**: Full access on desktop, limited on web

## Integration Technologies

### Power Platform CLI Integration
```typescript
interface CliAcquisition {
  ensureInstalled(): Promise<string>;
  getVersion(): Promise<string>;
  updateCli(): Promise<boolean>;
}
```

**CLI Communication Pattern**:
- Process spawn for command execution
- JSON parsing for structured responses
- Error handling for CLI failures
- Automatic updates and version management

### Authentication Technologies
- **VSCode Authentication Provider API**: Unified login experience
- **Azure AD OAuth 2.0**: Enterprise authentication flows
- **Multi-cloud Support**: Different endpoints for government clouds
- **Token Management**: Secure storage and refresh

### Debugging Infrastructure
```typescript
// PCF Debugging Stack
Puppeteer → Chrome DevTools Protocol → Source Maps → VSCode Debug API
```

**Components**:
- **Browser Automation**: Puppeteer for Edge/Chrome control
- **Debug Adapter**: Custom implementation for PCF debugging
- **Source Maps**: TypeScript debugging support
- **Breakpoints**: Full debugging experience

## Performance Considerations

### Bundle Optimization
- **Tree Shaking**: Eliminate unused code
- **Code Splitting**: Separate common and feature-specific code
- **Lazy Loading**: Load features on demand
- **Minification**: Reduce bundle size for web environments

### Memory Management
- **Disposable Pattern**: Proper resource cleanup
- **Event Listener Management**: Prevent memory leaks
- **Webview Serialization**: Maintain state across sessions
- **CLI Process Management**: Prevent orphaned processes

### Network Optimization
- **Request Batching**: Combine multiple API calls
- **Caching Strategies**: Reduce redundant network requests
- **Retry Logic**: Handle transient network failures
- **Regional Routing**: Direct requests to appropriate data centers

## Security Architecture

### Data Protection
- **Token Storage**: VSCode SecretStorage API
- **Environment Isolation**: Separate contexts for different environments
- **Input Validation**: Sanitize user inputs and CLI parameters
- **Telemetry Privacy**: No PII in telemetry data

### Code Signing & Distribution
- **Extension Signing**: Microsoft's VSIX signing process
- **Marketplace Distribution**: Automated publishing pipeline
- **Update Mechanism**: Secure automatic updates
- **Integrity Validation**: Verify downloaded CLI tools

## Testing Infrastructure

### Test Types & Tools
```typescript
// Unit Tests
describe('PacWrapper', () => {
  it('should execute commands correctly', async () => {
    // Test implementation
  });
});

// Integration Tests
describe('Extension Activation', () => {
  it('should activate in Power Pages workspace', async () => {
    // End-to-end test
  });
});
```

### Testing Environments
- **VSCode Test Runner**: Extension host testing
- **Web Extension Testing**: Browser environment validation
- **CLI Mocking**: Isolated testing without external dependencies
- **Authentication Mocking**: Test flows without real credentials

## Deployment Pipeline

### Build Process
1. **Type Checking**: Ensure TypeScript correctness
2. **Linting**: Code style and quality validation
3. **Testing**: Unit and integration test execution
4. **Bundling**: Webpack compilation for multiple targets
5. **Packaging**: VSIX creation with proper manifest
6. **Signing**: Microsoft code signing for security

### Distribution Channels
- **VSCode Marketplace**: Primary distribution channel
- **Enterprise Distribution**: VSIX sideloading for organizations
- **Preview Builds**: Early access for testing
- **Automated Updates**: Seamless user experience

This technical foundation enables the extension to provide reliable, performant, and secure Power Platform development capabilities across multiple environments and platforms.
