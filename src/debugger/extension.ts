/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import * as vscode from "vscode";

import { LaunchDebugProvider } from "./configuration";
import { DebugAdaptorFactory } from "./debugAdaptor";

import TelemetryReporter from "@vscode/extension-telemetry";
import { EXTENSION_NAME } from "../client/constants";
import { UserSettingsConfigManager } from "./configuration/UserSettingsConfigManager";

/**
 * Activates the extension.
 * @param context The extension context.
 */
export function activateDebugger(
    context: vscode.ExtensionContext,
    telemetry: TelemetryReporter
): void {
    // Register the launch provider
    vscode.debug.registerDebugConfigurationProvider(
        `${EXTENSION_NAME}.debug`,
        new LaunchDebugProvider(telemetry)
    );

    context.subscriptions.push(
        vscode.debug.registerDebugAdapterDescriptorFactory(
            `${EXTENSION_NAME}.debug`,
            new DebugAdaptorFactory(telemetry)
        )
    );
}

/**
 * Deactivates the debugger part of the extension.
 */
export function deactivateDebugger(): void {
    void vscode.debug.stopDebugging();
}

/**
 * Checks if the experimental feature flag in the user configuration is enabled.
 */
export const shouldEnableDebugger = (): boolean =>
    UserSettingsConfigManager.shouldEnableDebugger();
