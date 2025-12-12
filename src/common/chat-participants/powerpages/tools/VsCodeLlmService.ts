/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { oneDSLoggerWrapper } from '../../../OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { IActiveFileParams } from '../../../copilot/model';
import { IRelatedFiles } from '../../../constants';
import {
    VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_REQUEST,
    VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_SUCCESS,
    VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_ERROR,
    VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_NO_MODEL
} from '../PowerPagesChatParticipantTelemetryConstants';
import { getPowerPagesDocsToolMetadata, POWER_PAGES_DOCS_TOOL_NAME, PowerPagesDocsTool } from './PowerPagesDocsTool';

/**
 * Mapping of keywords to prompt files for automatic context inclusion
 */
const KEYWORD_TO_PROMPT_FILE: Record<string, string> = {
    // Liquid-related keywords
    'liquid': 'liquid-overview.md',
    '{{': 'liquid-overview.md',
    '{%': 'liquid-overview.md',
    'template': 'liquid-overview.md',
    'snippet': 'liquid-overview.md',
    'sitemarker': 'liquid-overview.md',
    'weblink': 'liquid-overview.md',
    'object': 'liquid-overview.md',
    'filter': 'liquid-overview.md',

    // Liquid tags
    'include': 'liquid-tags.md',
    'block': 'liquid-tags.md',
    'extends': 'liquid-tags.md',
    'editable': 'liquid-tags.md',
    'fetchxml': 'liquid-tags.md',
    'entityview': 'liquid-tags.md',

    // Web API
    'api': 'web-api.md',
    'web api': 'web-api.md',
    'webapi': 'web-api.md',
    'crud': 'web-api.md',
    'fetch': 'web-api.md',
    'post': 'web-api.md',
    'patch': 'web-api.md',
    'delete': 'web-api.md',
    '_api': 'web-api.md',

    // Forms
    'form': 'entity-forms.md',
    'entityform': 'entity-forms.md',
    'basic form': 'entity-forms.md',
    'field': 'entity-forms.md',
    'validation': 'entity-forms.md',
    'submit': 'entity-forms.md',
    'input': 'entity-forms.md',

    // Lists
    'list': 'entity-lists.md',
    'entitylist': 'entity-lists.md',
    'grid': 'entity-lists.md',
    'table': 'entity-lists.md',
    'row': 'entity-lists.md',
    'column': 'entity-lists.md',
    'pagination': 'entity-lists.md',

    // Multistep forms
    'wizard': 'multistep-forms.md',
    'multistep': 'multistep-forms.md',
    'webform': 'multistep-forms.md',
    'step': 'multistep-forms.md',
    'progress': 'multistep-forms.md',

    // JavaScript
    'javascript': 'javascript-api.md',
    'js': 'javascript-api.md',
    'script': 'javascript-api.md',
    'event': 'javascript-api.md',
    'onclick': 'javascript-api.md',
    'jquery': 'javascript-api.md',
    '$': 'javascript-api.md',
    'document.': 'javascript-api.md',
    'shell': 'javascript-api.md',
    'token': 'javascript-api.md'
};

/**
 * Default prompt file when no specific match is found
 */
const DEFAULT_PROMPT_FILE = 'liquid-overview.md';

// Store extension context for accessing prompt files
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Sets the extension context for accessing prompt files
 */
export function setLlmServiceExtensionContext(context: vscode.ExtensionContext): void {
    extensionContext = context;
}

/**
 * Represents a turn in the conversation history
 */
export interface IConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Parameters for LLM request
 */
export interface IVsCodeLlmRequestParams {
    userPrompt: string;
    activeFileContent: string;
    activeFileParams: IActiveFileParams;
    entityName: string;
    entityColumns: string[];
    relatedFiles: IRelatedFiles[];
    sessionId: string;
    orgId: string;
    conversationHistory?: IConversationTurn[];
}

/**
 * Response from LLM
 */
export interface IVsCodeLlmResponse {
    displayText: string;
    code: string;
}

/**
 * VS Code Language Model Service
 * Wraps VS Code's native LLM API for Power Pages chat participant
 */
export class VsCodeLlmService {
    private static instance: VsCodeLlmService | null = null;
    private toolDisposable: vscode.Disposable | null = null;

    private constructor() {}

    public static getInstance(): VsCodeLlmService {
        if (!VsCodeLlmService.instance) {
            VsCodeLlmService.instance = new VsCodeLlmService();
        }
        return VsCodeLlmService.instance;
    }

    /**
     * Registers the Power Pages documentation tool with VS Code
     */
    public registerTools(): vscode.Disposable {
        if (this.toolDisposable) {
            return this.toolDisposable;
        }

        this.toolDisposable = vscode.lm.registerTool(
            POWER_PAGES_DOCS_TOOL_NAME,
            new PowerPagesDocsTool()
        );

        return this.toolDisposable;
    }

    /**
     * Sends a request to the VS Code Language Model
     */
    public async sendRequest(
        params: IVsCodeLlmRequestParams,
        stream: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<IVsCodeLlmResponse[]> {

        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_REQUEST, {
            sessionId: params.sessionId,
            orgId: params.orgId,
            hasActiveFile: params.activeFileContent ? 'true' : 'false',
            relatedFilesCount: params.relatedFiles?.length?.toString() || '0',
            conversationTurns: params.conversationHistory?.length?.toString() || '0'
        });

        try {
            // Select a chat model
            const models = await vscode.lm.selectChatModels({
                vendor: 'copilot',
                family: 'gpt-4o'
            });

            if (!models || models.length === 0) {
                // Fallback to any available model
                const allModels = await vscode.lm.selectChatModels();
                if (!allModels || allModels.length === 0) {
                    oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_NO_MODEL, {
                        sessionId: params.sessionId
                    });
                    throw new Error('No language model available. Please ensure GitHub Copilot is installed and activated.');
                }
                models.push(allModels[0]);
            }

            const model = models[0];

            // Build messages with context
            const messages = await this.buildMessages(params);

            // Configure tool usage
            const toolOptions: vscode.LanguageModelChatRequestOptions = {
                tools: [getPowerPagesDocsToolMetadata()],
                toolMode: vscode.LanguageModelChatToolMode.Auto
            };

            // Send request with streaming
            const response = await model.sendRequest(messages, toolOptions, token);

            // Process the response
            const result = await this.processStreamingResponse(response, stream, params.sessionId);

            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_SUCCESS, {
                sessionId: params.sessionId,
                orgId: params.orgId
            });

            return result;

        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_LLM_ERROR,
                error as string,
                error as Error,
                { sessionId: params.sessionId, orgId: params.orgId },
                {}
            );

            // Check for specific error types
            if (error instanceof vscode.LanguageModelError) {
                if (error.code === vscode.LanguageModelError.NotFound.name) {
                    throw new Error('No language model available. Please install GitHub Copilot extension.');
                }
                if (error.code === vscode.LanguageModelError.NoPermissions.name) {
                    throw new Error('Copilot access denied. Please check your GitHub Copilot subscription.');
                }
                if (error.code === vscode.LanguageModelError.Blocked.name) {
                    throw new Error('Request was blocked due to content policy.');
                }
            }

            throw error;
        }
    }

    /**
     * Builds the message array for the LLM request
     */
    private async buildMessages(params: IVsCodeLlmRequestParams): Promise<vscode.LanguageModelChatMessage[]> {
        const messages: vscode.LanguageModelChatMessage[] = [];

        // System message with Power Pages context
        const systemPrompt = await this.buildSystemPrompt(params);
        messages.push(vscode.LanguageModelChatMessage.User(systemPrompt));

        // Add conversation history for multi-turn context
        if (params.conversationHistory && params.conversationHistory.length > 0) {
            for (const turn of params.conversationHistory) {
                if (turn.role === 'user') {
                    messages.push(vscode.LanguageModelChatMessage.User(turn.content));
                } else {
                    messages.push(vscode.LanguageModelChatMessage.Assistant(turn.content));
                }
            }
        }

        // User's actual question (current turn)
        const userMessage = this.buildUserMessage(params);
        messages.push(vscode.LanguageModelChatMessage.User(userMessage));

        return messages;
    }

    /**
     * Builds the system prompt with Power Pages development context
     */
    private async buildSystemPrompt(params: IVsCodeLlmRequestParams): Promise<string> {
        const contextParts: string[] = [
            '# Power Pages Development Assistant',
            '',
            'You are an expert Power Pages developer assistant. Help users with:',
            '- Liquid template code ({% %} and {{ }} syntax)',
            '- JavaScript for forms, lists, and web pages',
            '- Web API calls to Dataverse',
            '- CSS styling for Power Pages sites',
            '- FetchXML queries within Liquid templates',
            '',
            '## Guidelines:',
            '- Provide working code examples',
            '- Use Power Pages best practices',
            '- Include comments explaining the code',
            '- When the user is working on a form, focus on form field manipulation and validation',
            '- When the user is working on a list, focus on list customization and row manipulation',
            '- PRIORITIZE using the reference documentation provided below when answering',
            ''
        ];

        // Include the most relevant prompt file as priority context
        const promptContent = await this.getRelevantPromptContent(params.userPrompt, params.activeFileParams);
        if (promptContent) {
            contextParts.push('## Reference Documentation (USE THIS AS PRIMARY SOURCE):');
            contextParts.push(promptContent);
            contextParts.push('');
        }

        // Add active file context if available
        if (params.activeFileParams?.dataverseEntity) {
            contextParts.push('## Current File Context:');
            contextParts.push(`- Component Type: ${params.activeFileParams.dataverseEntity}`);

            if (params.activeFileParams.entityField) {
                contextParts.push(`- Field Type: ${params.activeFileParams.entityField}`);
            }
            if (params.activeFileParams.fieldType) {
                contextParts.push(`- File Type: ${params.activeFileParams.fieldType}`);
            }
            contextParts.push('');
        }

        // Add entity context if available
        if (params.entityName) {
            contextParts.push(`## Target Dataverse Entity: ${params.entityName}`);
            if (params.entityColumns && params.entityColumns.length > 0) {
                contextParts.push(`Available Columns: ${params.entityColumns.slice(0, 20).join(', ')}${params.entityColumns.length > 20 ? '...' : ''}`);
            }
            contextParts.push('');
        }

        // Add related files context
        if (params.relatedFiles && params.relatedFiles.length > 0) {
            contextParts.push('## Related Files in Current Web Page:');
            for (const file of params.relatedFiles) {
                if (file.fileContent) {
                    const truncatedContent = file.fileContent.length > 500
                        ? file.fileContent.substring(0, 500) + '...'
                        : file.fileContent;
                    contextParts.push(`### ${file.fileName} (${file.fileType}):`);
                    contextParts.push('```' + file.fileType);
                    contextParts.push(truncatedContent);
                    contextParts.push('```');
                    contextParts.push('');
                }
            }
        }

        return contextParts.join('\n');
    }

    /**
     * Gets the most relevant prompt file content based on user query and file context
     */
    private async getRelevantPromptContent(userPrompt: string, activeFileParams?: IActiveFileParams): Promise<string | null> {
        const promptFile = this.determineRelevantPromptFile(userPrompt, activeFileParams);

        console.log(`[PowerPages Chat] Selected prompt file: ${promptFile}`);

        try {
            const content = await this.readPromptFile(promptFile);
            console.log(`[PowerPages Chat] Successfully loaded prompt file: ${promptFile} (${content.length} chars)`);
            return content;
        } catch (error) {
            console.error(`[PowerPages Chat] Failed to load prompt file: ${promptFile}`, error);
            return null;
        }
    }

    /**
     * Determines the most relevant prompt file based on keywords in the user query
     */
    private determineRelevantPromptFile(userPrompt: string, activeFileParams?: IActiveFileParams): string {
        const lowerPrompt = userPrompt.toLowerCase();

        // Check for keyword matches (priority order - more specific first)
        const keywordPriority = [
            // Most specific
            'fetchxml', 'entityview', 'webform', 'multistep', 'wizard',
            'entityform', 'entitylist', 'web api', 'webapi', '_api',
            // Specific
            'include', 'block', 'extends', 'editable',
            'validation', 'submit', 'pagination', 'grid',
            // General
            'liquid', 'form', 'list', 'api', 'javascript', 'js',
            'template', 'snippet', 'filter', 'event', 'script'
        ];

        for (const keyword of keywordPriority) {
            if (lowerPrompt.includes(keyword)) {
                const file = KEYWORD_TO_PROMPT_FILE[keyword];
                if (file) {
                    console.log(`[PowerPages Chat] Matched keyword "${keyword}" -> ${file}`);
                    return file;
                }
            }
        }

        // Fallback based on active file type
        if (activeFileParams?.fieldType) {
            const fieldType = activeFileParams.fieldType.toLowerCase();
            if (fieldType.includes('javascript') || fieldType.includes('js')) {
                console.log(`[PowerPages Chat] Matched file type "${fieldType}" -> javascript-api.md`);
                return 'javascript-api.md';
            }
            if (fieldType.includes('html') || fieldType.includes('liquid')) {
                console.log(`[PowerPages Chat] Matched file type "${fieldType}" -> liquid-overview.md`);
                return 'liquid-overview.md';
            }
        }

        // Default fallback
        console.log(`[PowerPages Chat] No keyword match, using default: ${DEFAULT_PROMPT_FILE}`);
        return DEFAULT_PROMPT_FILE;
    }

    /**
     * Reads a prompt file from the extension's prompts directory
     */
    private async readPromptFile(fileName: string): Promise<string> {
        if (!extensionContext) {
            throw new Error('Extension context not set for LLM service');
        }

        const promptsPath = path.join(
            extensionContext.extensionPath,
            'src', 'common', 'chat-participants', 'powerpages', 'prompts',
            fileName
        );

        const content = await fs.promises.readFile(promptsPath, 'utf-8');
        return content;
    }

    /**
     * Builds the user message with the actual code and question
     */
    private buildUserMessage(params: IVsCodeLlmRequestParams): string {
        const messageParts: string[] = [];

        // Add active file content if available
        if (params.activeFileContent) {
            const fileType = params.activeFileParams?.fieldType || 'code';
            messageParts.push('## Current Code:');
            messageParts.push('```' + fileType);
            messageParts.push(params.activeFileContent);
            messageParts.push('```');
            messageParts.push('');
        }

        messageParts.push('## User Request:');
        messageParts.push(params.userPrompt);

        return messageParts.join('\n');
    }

    /**
     * Processes the streaming response from the LLM
     */
    private async processStreamingResponse(
        response: vscode.LanguageModelChatResponse,
        stream: vscode.ChatResponseStream,
        _: string
    ): Promise<IVsCodeLlmResponse[]> {
        const results: IVsCodeLlmResponse[] = [];
        let currentText = '';
        let currentCode = '';
        let isInCodeBlock = false;

        for await (const fragment of response.text) {
            // Check for code block markers
            if (fragment.includes('```')) {
                const parts = fragment.split('```');
                for (let i = 0; i < parts.length; i++) {
                    if (i > 0) {
                        isInCodeBlock = !isInCodeBlock;
                        if (!isInCodeBlock && currentCode) {
                            // End of code block
                            results.push({ displayText: currentText.trim(), code: currentCode.trim() });
                            currentText = '';
                            currentCode = '';
                        }
                    }

                    if (isInCodeBlock) {
                        currentCode += parts[i];
                    } else {
                        currentText += parts[i];
                    }
                }
            } else if (isInCodeBlock) {
                currentCode += fragment;
            } else {
                currentText += fragment;
            }

            // Stream to the chat response
            stream.markdown(fragment);
        }

        // Add any remaining content
        if (currentText.trim() || currentCode.trim()) {
            results.push({ displayText: currentText.trim(), code: currentCode.trim() });
        }

        // If no structured results, return the full text
        if (results.length === 0) {
            results.push({ displayText: currentText, code: '' });
        }

        return results;
    }

    /**
     * Disposes of registered tools
     */
    public dispose(): void {
        if (this.toolDisposable) {
            this.toolDisposable.dispose();
            this.toolDisposable = null;
        }
    }
}
