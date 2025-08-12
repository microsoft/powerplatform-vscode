/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { ServerApiCompletionProvider } from "./ServerApiCompletionProvider";
import { oneDSLoggerWrapper } from "../OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { ServerApiTelemetryEventNames } from "./serverApiTelemetryEventNames";
import { getServerApiTelemetryContext } from "./ServerApiTelemetryContext";

/**
 * Configuration for autocomplete language support
 */
interface ILanguageConfig {
    languageId: string;
    triggerCharacters?: string[];
}

/**
 * Default language configurations for Server API autocomplete
 * Currently only supports JavaScript files for Power Pages server-side scripting
 */
const defaultLanguageConfigs: ILanguageConfig[] = [
    { languageId: 'javascript', triggerCharacters: ['.'] }
];

/**
 * Utility class for registering Server API autocomplete functionality
 */
export class ServerApiAutocompleteRegistrar {

    /**
     * Registers Server API autocomplete for default languages
     * @param context The VS Code extension context
     * @returns Array of disposables for the registered providers
     */
    public static registerDefaultLanguages(context: vscode.ExtensionContext): vscode.Disposable[] {
        return this.registerLanguages(context, defaultLanguageConfigs);
    }

    /**
     * Registers Server API autocomplete for specific languages
     * @param context The VS Code extension context
     * @param languageConfigs Array of language configurations
     * @returns Array of disposables for the registered providers
     */
    public static registerLanguages(
        context: vscode.ExtensionContext,
        languageConfigs: ILanguageConfig[]
    ): vscode.Disposable[] {
        const disposables: vscode.Disposable[] = [];
        const provider = new ServerApiCompletionProvider();

        languageConfigs.forEach(config => {
            const disposable = vscode.languages.registerCompletionItemProvider(
                config.languageId,
                provider,
                ...(config.triggerCharacters || [])
            );

            disposables.push(disposable);
            context.subscriptions.push(disposable);
        });

        try {
            const ctx = getServerApiTelemetryContext();
            oneDSLoggerWrapper.getLogger().traceInfo(ServerApiTelemetryEventNames.SERVER_API_AUTOCOMPLETE_REGISTERED, {
                languages: languageConfigs.map(l => l.languageId).join(','),
                triggerChars: languageConfigs.map(l => (l.triggerCharacters || ['.']).join('')).join(','),
                provider: "ServerApiCompletionProvider",
                tenantId: ctx?.tenantId,
                envId: ctx?.envId,
                userId: ctx?.userId,
                orgId: ctx?.orgId,
                geo: ctx?.geo,
                extType: ctx?.extType
            });
        } catch { /* no-op */ }

        return disposables;
    }

    /**
     * Registers Server API autocomplete for a single language
     * @param context The VS Code extension context
     * @param languageId The language ID to register for
     * @param triggerCharacters Optional trigger characters
     * @returns The disposable for the registered provider
     */
    public static registerSingleLanguage(
        context: vscode.ExtensionContext,
        languageId: string,
        triggerCharacters: string[] = ['.']
    ): vscode.Disposable {
        const provider = new ServerApiCompletionProvider();
        const disposable = vscode.languages.registerCompletionItemProvider(
            languageId,
            provider,
            ...triggerCharacters
        );

        context.subscriptions.push(disposable);
        return disposable;
    }

    /**
     * Registers Server API autocomplete with custom document selector
     * @param context The VS Code extension context
     * @param documentSelector The document selector to register for
     * @param triggerCharacters Optional trigger characters
     * @returns The disposable for the registered provider
     */
    public static registerWithDocumentSelector(
        context: vscode.ExtensionContext,
        documentSelector: vscode.DocumentSelector,
        triggerCharacters: string[] = ['.']
    ): vscode.Disposable {
        const provider = new ServerApiCompletionProvider();
        const disposable = vscode.languages.registerCompletionItemProvider(
            documentSelector,
            provider,
            ...triggerCharacters
        );

        context.subscriptions.push(disposable);
        return disposable;
    }
}

/**
 * Helper function to quickly register Server API autocomplete in extension activation
 * @param context The VS Code extension context
 * @param customLanguages Optional custom language configurations
 */
export function activateServerApiAutocomplete(
    context: vscode.ExtensionContext,
    customLanguages?: ILanguageConfig[]
): void {
    const languageConfigs = customLanguages || defaultLanguageConfigs;

    try {
        const ctx = getServerApiTelemetryContext();
        oneDSLoggerWrapper.getLogger().traceInfo(ServerApiTelemetryEventNames.SERVER_API_AUTOCOMPLETE_ACTIVATE, {
            languages: languageConfigs.map(l => l.languageId).join(','),
            provider: "ServerApiCompletionProvider",
            // context
            tenantId: ctx?.tenantId,
            envId: ctx?.envId,
            userId: ctx?.userId,
            orgId: ctx?.orgId,
            geo: ctx?.geo,
            extType: ctx?.extType
        });
    } catch { /* no-op */ }

    ServerApiAutocompleteRegistrar.registerLanguages(context, languageConfigs);
}
