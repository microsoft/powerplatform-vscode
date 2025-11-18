# Power Platform VSCode Extension - Project Brief

## Core Mission

The Power Platform Extension for VSCode is a comprehensive development toolkit that enables developers to create, manage, and deploy Power Platform solutions, packages, and portals directly from Visual Studio Code.

## Primary Goals

### 1. Developer Productivity

- Integrate Power Platform CLI (pac) seamlessly into VSCode
- Provide unified development environment for Power Platform solutions
- Enable local development workflows for Power Pages (formerly Power Apps Portals)
- Support debugging and testing of PCF (PowerApps Component Framework) controls

### 2. Multi-Service Integration

- **Power Pages**: Full-featured development environment with preview, debugging, and deployment
- **Power Apps**: Component framework development and debugging
- **Dataverse**: Solution management and deployment
- **Power Platform CLI**: Complete CLI integration with interactive authentication

### 3. Enhanced Development Experience

- Real-time preview and debugging capabilities
- Copilot integration for AI-assisted development
- Multi-language support with localization
- Rich IntelliSense and autocomplete features
- File system integration with version control

## Target Users

### Primary Audience

- **Power Platform Developers**: Building custom solutions, portals, and components
- **Professional Developers**: Integrating Power Platform into broader development workflows
- **Solution Architects**: Managing complex Power Platform solutions

### Secondary Audience

- **Citizen Developers**: Transitioning to pro-code development
- **DevOps Engineers**: Managing Power Platform deployment pipelines

## Key Capabilities

### Authentication & Environment Management

- Multi-cloud support (Public, USGov, China clouds)
- Interactive authentication with Azure AD
- Environment switching and management
- Organization context awareness

### Development Tools

- **Power Pages**: Complete portal development lifecycle
- **PCF Controls**: Debug and test custom components
- **Solutions**: Create, manage, and deploy Dataverse solutions
- **Packages**: Handle complex deployment scenarios

### AI & Assistance

- Copilot chat participant for Power Pages development
- Code generation and explanation capabilities
- Context-aware suggestions and completions

## Technical Foundation

### Architecture

- **Extension Host**: Desktop VSCode extension (`src/client/extension.ts`)
- **Web Extension**: Browser-based VSCode support (`src/web/`)
- **Language Servers**: HTML and YAML language support (`src/server/`)
- **Debugger**: PCF control debugging capabilities (`src/debugger/`)

### Core Dependencies

- Power Platform CLI integration
- VSCode Extension APIs
- Language Server Protocol
- Puppeteer for browser automation
- Azure authentication libraries

## Success Metrics

- Seamless Power Platform CLI integration
- Efficient Power Pages development workflow
- Reliable PCF debugging experience
- Strong developer adoption and satisfaction
- Reduced context switching between tools

## Project Constraints

- Must support both desktop and web VSCode environments
- Cross-platform compatibility (Windows, macOS, Linux)
- Integration with existing Power Platform toolchain
- Compliance with Microsoft security and privacy requirements

This extension serves as the primary development interface for Power Platform, bridging the gap between traditional development tools and the Power Platform ecosystem.
