/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { oneDSLoggerWrapper } from '../../../OneDSLoggerTelemetry/oneDSLoggerWrapper';
import {
    VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_INVOKED,
    VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_SUCCESS,
    VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_ERROR
} from '../PowerPagesChatParticipantTelemetryConstants';

/**
 * Tool name for Power Pages documentation
 */
export const POWER_PAGES_DOCS_TOOL_NAME = 'powerpages_docs';

/**
 * Input schema for the Power Pages documentation tool
 */
export interface IPowerPagesDocsInput {
    topic: string;
}

/**
 * Mapping of documentation topics to local prompt files
 */
const DOCS_FILE_MAP: Record<string, { file: string; description: string }> = {
    'liquid': {
        file: 'liquid-overview.md',
        description: 'Liquid template language overview for Power Pages'
    },
    'liquid-overview': {
        file: 'liquid-overview.md',
        description: 'Liquid template language overview for Power Pages'
    },
    'liquid-objects': {
        file: 'liquid-overview.md',
        description: 'Liquid objects reference (page, request, sitemarkers, snippets, etc.)'
    },
    'liquid-tags': {
        file: 'liquid-tags.md',
        description: 'Liquid tags reference (include, block, extends, fetchxml, etc.)'
    },
    'liquid-filters': {
        file: 'liquid-overview.md',
        description: 'Liquid filters reference for text manipulation and formatting'
    },
    'web-api': {
        file: 'web-api.md',
        description: 'Power Pages Web API for CRUD operations on Dataverse'
    },
    'web-api-operations': {
        file: 'web-api.md',
        description: 'Web API write, update, and delete operations'
    },
    'entity-forms': {
        file: 'entity-forms.md',
        description: 'Basic forms (entity forms) configuration'
    },
    'basic-forms': {
        file: 'entity-forms.md',
        description: 'Basic forms configuration'
    },
    'entity-lists': {
        file: 'entity-lists.md',
        description: 'Lists (entity lists) configuration'
    },
    'lists': {
        file: 'entity-lists.md',
        description: 'Lists configuration'
    },
    'multistep-forms': {
        file: 'multistep-forms.md',
        description: 'Multistep form (web form) configuration'
    },
    'webforms': {
        file: 'multistep-forms.md',
        description: 'Web form configuration'
    },
    'javascript-api': {
        file: 'javascript-api.md',
        description: 'JavaScript APIs and patterns for Power Pages'
    },
    'javascript': {
        file: 'javascript-api.md',
        description: 'Adding custom JavaScript to Power Pages'
    },
    'form-javascript': {
        file: 'javascript-api.md',
        description: 'Form JavaScript and manipulation'
    },
    'fetchxml': {
        file: 'liquid-tags.md',
        description: 'FetchXML with Liquid for Dataverse queries'
    }
};

/**
 * Keyword to topic mapping for fuzzy matching
 */
const KEYWORD_TO_TOPIC: Record<string, string> = {
    'include': 'liquid-tags',
    'editable': 'liquid-tags',
    'block': 'liquid-tags',
    'extends': 'liquid-tags',
    'snippet': 'liquid-overview',
    'weblink': 'liquid-overview',
    'sitemarker': 'liquid-overview',
    'request': 'liquid-overview',
    'page': 'liquid-overview',
    'user': 'liquid-overview',
    'form': 'entity-forms',
    'entityform': 'entity-forms',
    'list': 'entity-lists',
    'entitylist': 'entity-lists',
    'api': 'web-api',
    'crud': 'web-api',
    'fetch': 'web-api',
    'create': 'web-api',
    'update': 'web-api',
    'delete': 'web-api',
    'javascript': 'javascript-api',
    'js': 'javascript-api',
    'validation': 'javascript-api',
    'event': 'javascript-api',
    'wizard': 'multistep-forms',
    'step': 'multistep-forms',
    'webform': 'multistep-forms',
    'query': 'fetchxml',
    'dataverse': 'fetchxml'
};

// Store extension context for accessing extension path
let extensionContext: vscode.ExtensionContext | undefined;

/**
 * Sets the extension context for accessing prompt files
 */
export function setExtensionContext(context: vscode.ExtensionContext): void {
    extensionContext = context;
}

/**
 * Power Pages Documentation Tool for VS Code Language Model
 * Provides documentation context from local prompt files for Power Pages development
 */
export class PowerPagesDocsTool implements vscode.LanguageModelTool<IPowerPagesDocsInput> {

    /**
     * Prepares the tool invocation by showing a message
     */
    async prepareInvocation(
        options: vscode.LanguageModelToolInvocationPrepareOptions<IPowerPagesDocsInput>,
        _: vscode.CancellationToken
    ): Promise<vscode.PreparedToolInvocation> {

        const topic = options.input.topic?.toLowerCase() || '';

        oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_INVOKED, {
            topic: topic
        });

        return {
            invocationMessage: vscode.l10n.t('Loading Power Pages documentation for "{0}"...', topic)
        };
    }

    /**
     * Invokes the tool to read and return documentation content from local files
     */
    async invoke(
        options: vscode.LanguageModelToolInvocationOptions<IPowerPagesDocsInput>,
        _: vscode.CancellationToken
    ): Promise<vscode.LanguageModelToolResult> {

        const topic = options.input.topic?.toLowerCase() || '';

        try {
            // Find matching documentation file
            const docEntry = this.findDocumentation(topic);

            if (!docEntry) {
                return new vscode.LanguageModelToolResult([
                    new vscode.LanguageModelTextPart(
                        `No specific documentation found for topic "${topic}". ` +
                        `Available topics: ${Object.keys(DOCS_FILE_MAP).join(', ')}. ` +
                        `For general Power Pages documentation, visit: https://learn.microsoft.com/power-pages/`
                    )
                ]);
            }

            // Read documentation content from local file
            const content = await this.readDocumentation(docEntry.file);

            oneDSLoggerWrapper.getLogger().traceInfo(VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_SUCCESS, {
                topic: topic,
                file: docEntry.file
            });

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `## Power Pages Documentation: ${docEntry.description}\n\n` +
                    `${content}`
                )
            ]);

        } catch (error) {
            oneDSLoggerWrapper.getLogger().traceError(
                VSCODE_EXTENSION_GITHUB_POWER_PAGES_AGENT_DOCS_TOOL_ERROR,
                error as string,
                error as Error,
                { topic: topic },
                {}
            );

            return new vscode.LanguageModelToolResult([
                new vscode.LanguageModelTextPart(
                    `Failed to load documentation for "${topic}". ` +
                    `Please visit https://learn.microsoft.com/power-pages/ for manual reference.`
                )
            ]);
        }
    }

    /**
     * Finds documentation entry matching the topic
     */
    private findDocumentation(topic: string): { file: string; description: string } | null {
        // Direct match
        if (DOCS_FILE_MAP[topic]) {
            return DOCS_FILE_MAP[topic];
        }

        // Fuzzy match - check if topic contains any key or vice versa
        for (const [key, value] of Object.entries(DOCS_FILE_MAP)) {
            if (topic.includes(key) || key.includes(topic)) {
                return value;
            }
        }

        // Keyword-based matching
        for (const [keyword, mappedTopic] of Object.entries(KEYWORD_TO_TOPIC)) {
            if (topic.includes(keyword)) {
                return DOCS_FILE_MAP[mappedTopic] || null;
            }
        }

        return null;
    }

    /**
     * Reads documentation content from local prompt file
     */
    private async readDocumentation(fileName: string): Promise<string> {
        if (!extensionContext) {
            throw new Error('Extension context not set');
        }

        const promptsPath = path.join(
            extensionContext.extensionPath,
            'src', 'common', 'chat-participants', 'powerpages', 'prompts',
            fileName
        );

        const content = await fs.promises.readFile(promptsPath, 'utf-8');
        return content;
    }
}

/**
 * Creates the tool registration metadata
 */
export function getPowerPagesDocsToolMetadata(): vscode.LanguageModelChatTool {
    return {
        name: POWER_PAGES_DOCS_TOOL_NAME,
        description: 'Fetches Power Pages documentation from Microsoft Learn. Use this tool when users ask about Liquid templates, Web API, forms, lists, JavaScript, authentication, or other Power Pages development topics.',
        inputSchema: {
            type: 'object',
            properties: {
                topic: {
                    type: 'string',
                    description: 'The documentation topic to fetch. Examples: "liquid", "web-api", "entity-forms", "entity-lists", "javascript-api", "authentication", "liquid-tags", "liquid-filters", "liquid-objects", "web-templates", "fetchxml"'
                }
            },
            required: ['topic']
        }
    };
}
