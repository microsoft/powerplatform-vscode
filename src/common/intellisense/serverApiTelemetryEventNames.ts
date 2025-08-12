/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/**
 * Telemetry event names for Server API autocomplete functionality
 * These events track the usage and performance of Server API IntelliSense features
 * in Power Pages JavaScript development within VS Code
 */
export enum ServerApiTelemetryEventNames {
    /**
     * Fired when Server API autocomplete is activated/initialized in an extension
     */
    SERVER_API_AUTOCOMPLETE_ACTIVATE = "ServerApiAutocompleteActivate",

    /**
     * Fired when Server API completion providers are successfully registered
     */
    SERVER_API_AUTOCOMPLETE_REGISTERED = "ServerApiAutocompleteRegistered",

    /**
     * Fired when Server API autocomplete is triggered by user input
     */
    SERVER_API_AUTOCOMPLETE_TRIGGERED = "ServerApiAutocompleteTriggered",

    /**
     * Fired when Server API namespaces are shown to the user (e.g., Server.Logger, Server.Context)
     */
    SERVER_API_AUTOCOMPLETE_NAMESPACES_SHOWN = "ServerApiAutocompleteNamespacesShown",

    /**
     * Fired when Server API sub-namespaces are shown (e.g., Server.Connector.HttpClient)
     */
    SERVER_API_AUTOCOMPLETE_SUB_NAMESPACES_SHOWN = "ServerApiAutocompleteSubNamespacesShown",

    /**
     * Fired when specific Server API items/methods are shown to the user
     */
    SERVER_API_AUTOCOMPLETE_ITEMS_SHOWN = "ServerApiAutocompleteItemsShown",

    /**
     * Fired when an error occurs during Server API autocomplete processing
     */
    SERVER_API_AUTOCOMPLETE_ERROR = "ServerApiAutocompleteError",

    /**
     * Fired when Server API telemetry context is set with environment/org details
     */
    SERVER_API_TELEMETRY_CONTEXT_SET = "ServerApiTelemetryContextSet",

    /**
     * Fired when Server API feature flag (EnableBLChanges) is checked
     */
    SERVER_API_FEATURE_FLAG_CHECK = "ServerApiFeatureFlagCheck",

    /**
     * Fired when Server API autocomplete is enabled via feature flag
     */
    SERVER_API_FEATURE_FLAG_ENABLED = "ServerApiFeatureFlagEnabled",

    /**
     * Fired when Server API autocomplete is disabled via feature flag
     */
    SERVER_API_FEATURE_FLAG_DISABLED = "ServerApiFeatureFlagDisabled",

    /**
     * Fired when a Server API completion item is selected/accepted by the user
     */
    SERVER_API_COMPLETION_ITEM_SELECTED = "ServerApiCompletionItemSelected",

    /**
     * Fired when Server API definitions are loaded or refreshed
     */
    SERVER_API_DEFINITIONS_LOADED = "ServerApiDefinitionsLoaded",

    /**
     * Fired when there's an issue with Server API telemetry context retrieval
     */
    SERVER_API_TELEMETRY_CONTEXT_ERROR = "ServerApiTelemetryContextError"
}
