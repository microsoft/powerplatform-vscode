/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { EXTENSION_NAME } from "../../common/constants";
import { ErrorReporter } from "../../common/ErrorReporter";

import { ConfigurationManager } from "./ConfigurationManager";
import { providedDebugConfig } from "./LaunchJsonConfigManager";
import { LaunchDebugConfiguration } from "./types";

/**
 * A class that registers the extension as a debug provider.
 */
export class LaunchDebugProvider implements vscode.DebugConfigurationProvider {
    /**
     * Provides the supported debug configuration.
     * @returns The supported debug configuration.
     */
    provideDebugConfigurations(): vscode.ProviderResult<
        vscode.DebugConfiguration[]
    > {
        return Promise.resolve([providedDebugConfig]);
    }

    /**
     * Resolves the debug configuration, substitutes variables and launches the application.
     * @param folder The [optional] {@link vscode.WorkspaceFolder workspace} folder.
     * @param config The {@link LaunchDebugConfiguration debug configuration} that the user selected to debug the PCF control.
     * @param _ The cancellation token.
     * @returns The resolved debug configuration.
     */
    resolveDebugConfigurationWithSubstitutedVariables(
        folder: vscode.WorkspaceFolder | undefined,
        config: vscode.DebugConfiguration,
        _?: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DebugConfiguration> {
        const selectedConfig = config as LaunchDebugConfiguration;

        if (config && config.type === `${EXTENSION_NAME}.debug`) {
            if (config.request && config.request === "launch") {
                const debugConfig =
                    ConfigurationManager.getLaunchConfig(selectedConfig);
                return debugConfig;
            }
        } else {
            void ErrorReporter.report(
                "LaunchDebugProvider.resolveDebugConfigurationWithSubstitutedVariables",
                undefined,
                "Invalid or missing debug configuration in launch.json"
            );
        }

        return null;
    }
}
