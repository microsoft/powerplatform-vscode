/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as os from "os";
import * as path from "path";

import { ControlLocation } from "../controlLocation";
import { replaceWorkSpaceFolderPlaceholder } from "../utils";

import { LaunchJsonConfigManager } from "./LaunchJsonConfigManager";
import { UserSettingsConfigManager } from "./UserSettingsConfigManager";
import {
    IDevToolsSettings,
    IPcfLaunchConfig,
    IUserSettings,
    LaunchDebugConfiguration,
    UserDataDir,
} from "./types";
import { BrowserFlavor } from "../browser/types/BrowserFlavor";
import {
    EXTENSION_NAME,
    SETTINGS_DEBUGGER_DEFAULT_PORT,
} from "../../common/constants";

/**
 * Class that manages configuration of the extension.
 * Configuration can come from two different sources:
 * - User configuration stored in either the users global settings or workspace settings.
 * - Configuration from the launch.json file.
 *
 * The user configuration always overrides values in the launch.json file.
 * The reason is that a launch.json file is usually committed to source control and might contain general values for environment URLs or App Id.
 * In order to debug controls within dev environment, the user needs to be able to override these values.
 */
export class ConfigurationManager {
    /**
     * Use static methods to retrieve configuration.
     */
    private constructor() {
        /** */
    }

    /**
     * Returns the launch configuration.
     * @param selectedLaunchConfig The launch configuration from the launch.json that the user selected.
     * @returns The launch configuration.
     */
    public static getLaunchConfig(
        selectedLaunchConfig?: LaunchDebugConfiguration
    ): IPcfLaunchConfig {
        const userConfig = UserSettingsConfigManager.getConfig();
        const mergedConfig = this.mergeConfigs(
            selectedLaunchConfig,
            userConfig
        );
        LaunchJsonConfigManager.validateLaunchJson(mergedConfig);

        return mergedConfig;
    }

    /**
     * Retrieves the {@link BrowserFlavor type of browser build} to use for the launch.
     * @returns The {@link BrowserFlavor type of browser build} to use for the launch.
     */
    public static getBrowserFlavor(): BrowserFlavor {
        return UserSettingsConfigManager.getBrowserFlavor();
    }

    /**
     * Get the command line args which are passed to the browser.
     * @returns Additional args to start the browser.
     */
    public static getBrowserArgs(): string[] {
        return UserSettingsConfigManager.getBrowserArgs();
    }

    /**
     * Get the remote endpoint settings from the vscode configuration.
     * @param debugConfig The settings specified by a launch config, if any.
     * @returns The remote endpoint settings.
     */
    public static getRemoteEndpointSettings(
        debugConfig: IPcfLaunchConfig
    ): IDevToolsSettings {
        const userDataDir = this.resolveUserDataDirPath(debugConfig);
        return {
            port: debugConfig.port,
            userDataDir,
            useDefaultUserDataProfile: debugConfig.useDefaultUserDataProfile,
        };
    }

    /**
     * Resolves the path for the browser user directory.
     * @param debugConfig Merged launch config.
     * @returns The path to the browser user directory.
     */
    private static resolveUserDataDirPath(
        debugConfig: IPcfLaunchConfig
    ): string {
        let userDataDir: UserDataDir;
        if (typeof debugConfig.userDataDir !== "undefined") {
            userDataDir = debugConfig.userDataDir;
        } else {
            const { userDataDir: settingsUserDataDir } =
                UserSettingsConfigManager.getConfig();
            if (typeof settingsUserDataDir !== "undefined") {
                userDataDir = settingsUserDataDir;
            }
        }

        // Check to see if we need to use a user data directory, which will force Edge to launch with a new manager process.
        // We generate a temp directory if the user opted in explicitly with 'true' (which is the default),
        // Or if it is not defined and they are not using a custom browser path (such as electron).
        // This matches the behavior of the chrome and edge debug extensions.
        const browserFlavor = this.getBrowserFlavor();

        if (
            !debugConfig.useDefaultUserDataProfile ||
            (typeof userDataDir === "undefined" && browserFlavor === "Default")
        ) {
            return path.join(
                os.tmpdir(),
                `${EXTENSION_NAME}-userdatadir_${debugConfig.port}`
            );
        } else if (!userDataDir) {
            // Explicit opt-out
            return "";
        }

        return userDataDir;
    }

    /**
     * Combines a launch configuration with the default configuration.
     * @param selectedLaunchConfig The launch configuration from the launch.json that the user selected.
     * @param userConfig Configuration from the user settings.
     * @returns A launch configuration.
     */
    private static mergeConfigs(
        selectedLaunchConfig?: LaunchDebugConfiguration,
        userConfig?: Partial<IUserSettings>
    ): IPcfLaunchConfig {
        // const fallbackLaunchConfig = this.launchConfigManager.getConfig();

        if (!selectedLaunchConfig) {
            throw new Error(
                "Could not get config from launch.json or the provided config was not supported."
            );
        }

        if (!userConfig) {
            return {
                ...selectedLaunchConfig,
                controlLocation:
                    this.getControlLocationConfig(selectedLaunchConfig),
            };
        }

        // let controlLocation: ControlLocation;

        const controlLocation = this.getControlLocationConfig(
            selectedLaunchConfig,
            userConfig
        );

        const file = replaceWorkSpaceFolderPlaceholder(
            selectedLaunchConfig.file
        );

        return {
            url: userConfig.defaultUrl || selectedLaunchConfig.url,
            browserFlavor:
                userConfig.browserFlavor ?? selectedLaunchConfig.browserFlavor,
            webRoot: userConfig.webRoot || selectedLaunchConfig.webRoot,
            file,
            port:
                userConfig.port ||
                selectedLaunchConfig.port ||
                SETTINGS_DEBUGGER_DEFAULT_PORT,
            controlLocation,
            userDataDir:
                userConfig.userDataDir || selectedLaunchConfig.userDataDir,
            useDefaultUserDataProfile:
                userConfig.useDefaultUserDataProfile ??
                selectedLaunchConfig.useDefaultUserDataProfile,
            request: "launch",
            name: `Launch ${controlLocation.controlName}`,
            type: selectedLaunchConfig.type || `${EXTENSION_NAME}.debug`,
        };
    }

    /**
     * Retrieves the {@link ControlLocation} configuration from the launch configuration.
     * @param launchConfig The selected launch configuration.
     * @param userConfig The user settings.
     * @returns The {@link ControlLocation Configuration} which specifies the location of the control.
     */
    private static getControlLocationConfig(
        launchConfig: LaunchDebugConfiguration,
        userConfig?: Partial<IUserSettings>
    ): ControlLocation {
        return LaunchJsonConfigManager.getControlLocationConfig(
            launchConfig.renderFullScreen ?? false,
            launchConfig.tabName,
            launchConfig.controlName,
            launchConfig.appId || userConfig?.appId
        );
    }
}
