/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import {
    DEBUGGER_ENABLED_DEFAULT_VALUE,
    SETTINGS_EXPERIMENTAL_STORE_NAME,
} from "../../common/constants";
import { BrowserFlavor } from "../browser/types";

import { IUserSettings, UserDataDir } from "./types";

/**
 * Class that is used to retrieve user settings for the extension.
 */
export class UserSettingsConfigManager {
    /**
     * Returns a browser debug configuration from a PcfLaunchConfig.
     * @returns The {@link IUserSettings users extension} configuration.
     */
    public static getConfig(): Partial<IUserSettings> {
        const settings = this.getSettings();
        const port = settings.get<number>("port");
        const defaultUrl = settings.get<string>("defaultUrl");
        const appId = settings.get<string>("appId");
        const userDataDir = settings.get<UserDataDir>("userDataDir");
        const webRoot = settings.get<string>("webRoot");
        const browserFlavor = this.getBrowserFlavor();

        return {
            defaultUrl,
            appId,
            port,
            userDataDir,
            webRoot,
            browserFlavor,
        };
    }

    /**
     * Retrieves the {@link BrowserFlavor type of browser build} to use for the launch from the user configuration in their settings.
     * Uses `Default` if the user has not specified a browser type.
     * @returns The browser flavor to use for the extension.
     */
    public static getBrowserFlavor(): BrowserFlavor {
        const settings = this.getSettings();
        const browserFlavor =
            settings.get<BrowserFlavor>("browserFlavor") || "Default";
        return browserFlavor;
    }

    /**
     * Get the command line args from the users settings which are passed to the browser.
     * @returns Additional args to start the browser.
     */
    public static getBrowserArgs(): string[] {
        const settings = this.getSettings();
        const browserArgs: string[] = settings.get("browserArgs") || [];
        return browserArgs.map((arg) => arg.trim());
    }

    public static shouldEnableDebugger(): boolean {
        const settings = this.getSettings();
        return (
            settings.get<boolean>("enablePcfDebuggingFeatures") ||
            DEBUGGER_ENABLED_DEFAULT_VALUE
        );
    }

    /**
     * Gets the users workspace configuration.
     * @returns The workspace configuration.
     */
    private static getSettings(): vscode.WorkspaceConfiguration {
        return vscode.workspace.getConfiguration(
            SETTINGS_EXPERIMENTAL_STORE_NAME
        );
    }
}
