/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";

import { LaunchDebugProvider } from "./configuration";
import { DebugAdaptorFactory } from "./debugAdaptor";

import { EXTENSION_NAME } from "../common/constants";
import { UserSettingsConfigManager } from "./configuration/UserSettingsConfigManager";

/**
 * Activates the extension.
 * @param context The extension context.
 */
export function activateDebugger(
    context: vscode.ExtensionContext
): void {
    // Register the launch provider
    vscode.debug.registerDebugConfigurationProvider(
        `${EXTENSION_NAME}.debug`,
        new LaunchDebugProvider()
    );

    context.subscriptions.push(
        vscode.debug.registerDebugAdapterDescriptorFactory(
            `${EXTENSION_NAME}.debug`,
            new DebugAdaptorFactory()
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
