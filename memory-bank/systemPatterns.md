# System Patterns - Power Platform Extension Architecture

## Overall Architecture

### Extension Structure
The extension follows a multi-layered architecture supporting both desktop and web environments:

```
powerplatform-vscode/
├── src/client/          # Desktop VSCode extension host
├── src/web/             # Browser-based VSCode extension
├── src/server/          # Language servers (HTML, YAML)
├── src/debugger/        # PCF debugging capabilities
├── src/common/          # Shared utilities and services
└── dist/                # Compiled output
```

## Core Architectural Patterns

### 1. Extension Host Pattern
**Location**: `src/client/extension.ts`
**Purpose**: Main extension activation and lifecycle management

```typescript
export async function activate(context: vscode.ExtensionContext): Promise<void>
export async function deactivate(): Promise<void>
```

**Key Responsibilities**:
- Extension initialization and cleanup
- Command registration and context setup
- Authentication and environment management
- Service initialization and coordination

### 2. Service Layer Pattern
**Purpose**: Encapsulate business logic and external integrations

#### Authentication Service
- **Provider**: Azure AD authentication
- **Context**: Multi-cloud support (Public, USGov, China)
- **Session Management**: Token refresh and validation

#### CLI Integration Service
- **Auto-Acquisition**: Automatic Power Platform CLI installation
- **Version Management**: Updates and compatibility checking
- **Command Wrapping**: Type-safe CLI command execution

### 3. Language Server Protocol (LSP)
**Servers**: HTML (`src/server/HtmlServer.ts`) and YAML (`src/server/YamlServer.ts`)

**Communication Pattern**:
```
VSCode Client ←→ Language Client ←→ Language Server
```

**Features Provided**:
- IntelliSense and autocomplete
- Validation and diagnostics
- Hover information
- Server API autocomplete (feature-flagged)

### 4. Webview Provider Pattern
**Usage**: Custom UI panels and views

#### Portal WebView (`src/client/PortalWebView.ts`)
- Real-time HTML preview for Power Pages
- Document synchronization
- Serialization for session persistence

#### Copilot Integration
- Chat participant registration
- AI-powered code assistance
- Context-aware suggestions

### 5. Tree Data Provider Pattern
**Implementation**: Activity bar panels for environment and authentication management

```typescript
// Authentication Panel
class AuthPanelProvider implements vscode.TreeDataProvider<AuthItem>
// Environment Panel
class EnvPanelProvider implements vscode.TreeDataProvider<EnvItem>
```

## Key Component Relationships

### 1. CLI Wrapper Architecture
```
PacTerminal → PacWrapper → CLI Commands
     ↓
Authentication Context
     ↓
Organization Context
```

**Flow**:
1. `PacTerminal` manages CLI process lifecycle
2. `PacWrapper` provides type-safe command interface
3. Authentication context enables environment-specific operations

### 2. Context Management System
```
Extension Activation
     ↓
Artemis Service (Organization Data)
     ↓
PAC Context (Authentication)
     ↓
ECS Features Client (Feature Flags)
     ↓
UI Panel Registration
```

### 3. Event-Driven Updates
**Pattern**: Observer pattern for organization changes

```typescript
orgChangeEvent(async (orgDetails: ActiveOrgOutput) => {
    // Update contexts and reinitialize services
});
```

## Design Patterns in Use

### 1. Factory Pattern
**Usage**: Service initialization and configuration
- ECS Features Client creation
- Language server instantiation
- Webview panel creation

### 2. Observer Pattern
**Usage**: Event handling and state management
- Organization change notifications
- Authentication state changes
- File system watchers

### 3. Strategy Pattern
**Usage**: Multi-environment support
- Cloud-specific authentication flows
- Environment-specific CLI parameters
- Regional telemetry routing

### 4. Singleton Pattern
**Usage**: Global state management
- Telemetry logger instances
- Extension context sharing
- CLI wrapper instances

## Integration Patterns

### 1. Power Platform CLI Integration
```typescript
class CliAcquisition {
    async ensureInstalled(): Promise<string>  // Auto-install CLI
}

class PacWrapper {
    async executeCommand(command: string[]): Promise<Result>  // Type-safe execution
}
```

### 2. Authentication Flow
```
User Action → VSCode Auth API → Azure AD → Token Storage → CLI Context
```

### 3. Telemetry Pattern
```typescript
oneDSLoggerWrapper.getLogger().traceInfo(eventName, properties, measurements)
```

**Features**:
- Geographic telemetry routing
- Privacy-compliant data collection
- Performance metrics tracking

## Error Handling Patterns

### 1. Graceful Degradation
- Extension functions with limited capabilities if CLI unavailable
- Fallback UI states for authentication failures
- Feature flags for experimental capabilities

### 2. Retry Mechanisms
- Network operation retries with exponential backoff
- CLI command retry logic
- Authentication token refresh

### 3. User-Friendly Error Reporting
- Contextual error messages
- Actionable error resolutions
- Telemetry for error analysis

## Performance Patterns

### 1. Lazy Loading
- Language servers activate only when needed
- Copilot panels register only after authentication
- Feature flags control optional component loading

### 2. Caching Strategies
- Organization metadata caching
- Authentication token caching
- File system operation caching

### 3. Asynchronous Operations
- Promise-based CLI operations
- Non-blocking UI updates
- Background service initialization

## Testing Patterns

### 1. Unit Testing Structure
```
src/client/test/unit/     # Component unit tests
src/common/test/          # Shared utility tests
src/server/test/          # Language server tests
```

### 2. Integration Testing
```
src/client/test/Integration/  # End-to-end scenarios
```

### 3. Web Extension Testing
```
src/web/client/          # Browser-specific test coverage
```

## Deployment Patterns

### 1. Multi-Target Compilation
- Desktop extension: Node.js runtime
- Web extension: Browser-compatible bundle
- Shared common libraries

### 2. Feature Flag System
- ECS integration for gradual rollout
- A/B testing capabilities
- Environment-specific feature control

This architecture enables the extension to provide a cohesive Power Platform development experience while maintaining flexibility for different environments and use cases.
