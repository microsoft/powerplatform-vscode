# VS Code LLM API Integration for Power Pages Chat Participant

## Overview

This document summarizes the implementation of VS Code's native Language Model API integration for the Power Pages chat participant, replacing the custom backend LLM interaction.

## Feature Flag

The feature is controlled by an experimental setting:

```json
{
  "powerPlatform.experimental.useVsCodeLlm": true
}
```

- **Default**: `true` (VS Code LLM mode enabled)
- **When `false`**: Falls back to custom Intelligence API backend

## Architecture

### New Files Created

| File | Purpose |
|------|---------|
| `src/common/chat-participants/powerpages/tools/VsCodeLlmService.ts` | Service wrapper for VS Code LLM API |
| `src/common/chat-participants/powerpages/tools/PowerPagesDocsTool.ts` | Language Model Tool for documentation context |
| `src/common/chat-participants/powerpages/tools/index.ts` | Barrel export file |
| `src/common/chat-participants/powerpages/prompts/*.md` | Static documentation prompt files |

### Modified Files

| File | Changes |
|------|---------|
| `PowerPagesChatParticipant.ts` | Added dual-mode support (VS Code LLM vs custom backend), multi-turn conversation |
| `PowerPagesChatParticipantTelemetryConstants.ts` | Added telemetry constants for LLM events |
| `package.json` | Added `useVsCodeLlm` experimental setting |

## Components

### 1. VsCodeLlmService

**Location**: `src/common/chat-participants/powerpages/tools/VsCodeLlmService.ts`

A singleton service that wraps VS Code's native LLM API:

```typescript
const service = VsCodeLlmService.getInstance();
await service.sendRequest(params, stream, token);
```

**Key Features**:
- Automatic model selection (prefers `gpt-4o`, falls back to any available)
- Streaming response support
- Tool registration for documentation
- **Automatic prompt file inclusion** based on user query keywords
- Multi-turn conversation support (last 3 exchanges)

### 2. PowerPagesDocsTool

**Location**: `src/common/chat-participants/powerpages/tools/PowerPagesDocsTool.ts`

A VS Code Language Model Tool that provides documentation context:

```typescript
vscode.lm.registerTool('powerpages_docs', new PowerPagesDocsTool());
```

**Features**:
- Reads from local static prompt files
- Keyword-based topic matching
- Fuzzy matching for flexibility

### 3. Static Prompt Files

**Location**: `src/common/chat-participants/powerpages/prompts/`

| File | Content |
|------|---------|
| `liquid-overview.md` | Liquid template basics, objects, filters, variables |
| `liquid-tags.md` | Liquid tags (include, block, fetchxml, entityform, etc.) |
| `web-api.md` | Web API CRUD operations, authentication, error handling |
| `entity-forms.md` | Basic forms configuration, JavaScript integration |
| `entity-lists.md` | Lists configuration, filtering, pagination |
| `multistep-forms.md` | Web forms/wizards, step navigation |
| `javascript-api.md` | Client-side JavaScript APIs, form manipulation |

## Prompt File Selection Logic

### Automatic Selection (Priority-Based)

The system automatically selects the most relevant prompt file based on keywords in the user's query:

```
User Query → Keyword Matching → Prompt File → Included in System Prompt
```

**Keyword Priority Order**:
1. **Most specific**: `fetchxml`, `entityview`, `webform`, `multistep`, `wizard`
2. **Specific**: `entityform`, `entitylist`, `web api`, `webapi`, `_api`
3. **General**: `liquid`, `form`, `list`, `api`, `javascript`, `js`

**Fallbacks**:
1. If no keyword match → check active file type
2. If still no match → use `liquid-overview.md` as default

### Console Logging

The system logs prompt file selection for debugging:

```
[PowerPages Chat] Matched keyword "form" -> entity-forms.md
[PowerPages Chat] Successfully loaded prompt file: entity-forms.md (15432 chars)
```

## Multi-Turn Conversation

The implementation supports conversation history:

```typescript
interface IConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}
```

**Configuration**:
- Limited to **last 3 exchanges** (6 messages) to manage token usage
- Extracted from `vscode.ChatContext.history`

## Request Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    User sends message                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ PowerPagesChatParticipant.handler()                              │
│   - Check feature flag (useVsCodeLlm)                           │
│   - Route to handleWithVsCodeLlm() or handleWithCustomBackend() │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ (VS Code LLM mode)
┌─────────────────────────────────────────────────────────────────┐
│ handleWithVsCodeLlm()                                            │
│   - Extract conversation history (last 3 turns)                 │
│   - Get active file content and related files                   │
│   - Build IVsCodeLlmRequestParams                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ VsCodeLlmService.sendRequest()                                   │
│   - Select chat model (gpt-4o preferred)                        │
│   - Build messages with context                                  │
│   - Auto-include relevant prompt file                           │
│   - Register powerpages_docs tool                               │
│   - Stream response to chat                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ buildSystemPrompt() (async)                                      │
│   - Determine relevant prompt file from keywords                │
│   - Load prompt file content                                    │
│   - Include as "Reference Documentation (PRIMARY SOURCE)"       │
│   - Add file context, entity info, related files               │
└─────────────────────────────────────────────────────────────────┘
```

## Telemetry Events

| Event Constant | When Fired |
|----------------|------------|
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_REQUEST` | LLM request initiated |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_SUCCESS` | LLM response received |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_ERROR` | LLM request failed |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_NO_MODEL` | No model available |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_INVOKED` | Docs tool called |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_SUCCESS` | Docs loaded successfully |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_ERROR` | Docs loading failed |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_USING_VSCODE_LLM` | VS Code LLM mode active |
| `VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_USING_CUSTOM_BACKEND` | Custom backend mode active |

## Error Handling

The service handles VS Code LLM-specific errors:

| Error Type | User Message |
|------------|--------------|
| `NotFound` | "No language model available. Please install GitHub Copilot extension." |
| `NoPermissions` | "Copilot access denied. Please check your GitHub Copilot subscription." |
| `Blocked` | "Request was blocked due to content policy." |

## Usage Example

```typescript
// The chat participant automatically uses VS Code LLM when enabled
// User types: "@powerpages how do I validate a form field?"

// System:
// 1. Detects "form" keyword → loads entity-forms.md
// 2. Includes form documentation in system prompt
// 3. Sends to VS Code LLM with full Power Pages context
// 4. Streams response back to user
```

## Dependencies

- VS Code API: `vscode.lm.selectChatModels()`, `vscode.lm.registerTool()`
- GitHub Copilot extension (provides the language model)
- Node.js `fs` and `path` for reading prompt files

## Future Enhancements

1. Add more prompt files for:
   - Authentication and security
   - Table permissions
   - Site settings
   - Content snippets
   - Web templates

2. Consider caching prompt file content for performance

3. Implement dynamic prompt file selection based on conversation context

4. Add ability to combine multiple relevant prompt files for complex queries
