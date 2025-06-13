/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as os from "os";
import * as path from "path";

import { pathExists } from "fs-extra";

import { ConfigurationManager } from "../configuration";
import { IPcfLaunchConfig } from "../configuration/types";
import { BrowserFlavor } from "./types/BrowserFlavor";
import { ErrorReporter } from "../../common/ErrorReporter";
import { IBrowserPath, Platform } from "./types";

const winAppDataFolder = process.env.LOCALAPPDATA || "/";

/**
 * Class to retrieve and verify browser location on the user's machine.
 */
export class BrowserLocator {
    private readonly browserFlavor: BrowserFlavor;
    private readonly platform: Platform;
    private readonly browserPathMapping: Map<BrowserFlavor, IBrowserPath> =
        new Map<BrowserFlavor, IBrowserPath>([
            [
                "Stable",
                {
                    debianLinux: "/opt/microsoft/msedge/msedge",
                    osx: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
                    windows: {
                        primary:
                            "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
                        secondary: path.join(
                            winAppDataFolder,
                            "Microsoft\\Edge\\Application\\msedge.exe"
                        ),
                    },
                },
            ],
            [
                "Beta",
                {
                    debianLinux: "/opt/microsoft/msedge-beta/msedge",
                    osx: "/Applications/Microsoft Edge Beta.app/Contents/MacOS/Microsoft Edge Beta",
                    windows: {
                        primary:
                            "C:\\Program Files (x86)\\Microsoft\\Edge Beta\\Application\\msedge.exe",
                        secondary: path.join(
                            winAppDataFolder,
                            "Microsoft\\Edge Beta\\Application\\msedge.exe"
                        ),
                    },
                },
            ],
            [
                "Dev",
                {
                    debianLinux: "/opt/microsoft/msedge-dev/msedge",
                    osx: "/Applications/Microsoft Edge Dev.app/Contents/MacOS/Microsoft Edge Dev",
                    windows: {
                        primary:
                            "C:\\Program Files (x86)\\Microsoft\\Edge Dev\\Application\\msedge.exe",
                        secondary: path.join(
                            winAppDataFolder,
                            "Microsoft\\Edge Dev\\Application\\msedge.exe"
                        ),
                    },
                },
            ],
            [
                "Canary",
                {
                    debianLinux: "/opt/microsoft/msedge-canary/msedge",
                    osx: "/Applications/Microsoft Edge Canary.app/Contents/MacOS/Microsoft Edge Canary",
                    windows: {
                        primary:
                            "C:\\Program Files (x86)\\Microsoft\\Edge SxS\\Application\\msedge.exe",
                        secondary: path.join(
                            winAppDataFolder,
                            "Microsoft\\Edge SxS\\Application\\msedge.exe"
                        ),
                    },
                },
            ],
        ]);

    /**
     * Creates a new instance of the BrowserLocator class.
     * @param debugConfig The launch debug configuration to use.
     * @param logger Logger instance to use for logging.
     */
    constructor(
        debugConfig: IPcfLaunchConfig
    ) {
        this.browserFlavor =
            debugConfig.browserFlavor ||
            ConfigurationManager.getBrowserFlavor();
        this.platform = this.getPlatform();
    }

    /**
     * Gets the browser path for the specified browser flavor.
     * @returns The browser path.
     */
    public async getPath(): Promise<string> {
        try {
            const browserPath = await this.verifyFlavorPath();
            return browserPath;
        } catch (error) {
            await ErrorReporter.report(
                "BrowserLocator.getPath",
                undefined,
                "Microsoft Edge could not be found. Ensure you have installed Microsoft Edge and that you have selected 'default' or the appropriate version of Microsoft Edge in the extension settings panel."
            );
            throw error;
        }
    }

    /**
     * Get the current machine platform.
     * @returns The current machine platform.
     */
    private getPlatform(): Platform {
        switch (os.platform()) {
            case "darwin":
                return "OSX";
            case "win32":
                return "Windows";
            default:
                return "Linux";
        }
    }

    /**
     * Verifies and returns if the browser for the current session exists in the
     * desired flavor and platform. Providing a "default" flavor will scan for the
     * first browser available in the following order:
     * stable > beta > dev > canary
     * For windows it will try: program files > local app data.
     * @returns A promise with the path to the browser or an empty string if not found.
     */
    private async verifyFlavorPath(): Promise<string> {
        let item = this.browserPathMapping.get(this.browserFlavor || "Default");
        if (!item) {
            // if no flavor is specified search for any path present.
            for (item of this.browserPathMapping.values()) {
                const result = await this.verifyExecutableExists(item);
                if (result) {
                    return result;
                }
            }
        }

        return await this.verifyExecutableExists(item);
    }

    /**
     * Verifies if the path exists in disk.
     * @param browserPath The path to be verified.
     * @returns A promise with the path to the browser or an empty string if not found.
     */
    private async verifyExecutableExists(
        browserPath: IBrowserPath | undefined
    ): Promise<string> {
        if (!browserPath) {
            throw new Error(
                `No browser path found for flavor: ${this.browserFlavor} and platform: ${this.platform}`
            );
        }

        if (
            this.isDefaultOrWindows() &&
            (await pathExists(browserPath.windows.primary))
        ) {
            return browserPath.windows.primary;
        }
        if (
            this.isDefaultOrWindows() &&
            (await pathExists(browserPath.windows.secondary))
        ) {
            return browserPath.windows.secondary;
        }
        if (this.isDefaultOrOsx() && (await pathExists(browserPath.osx))) {
            return browserPath.osx;
        }
        if (
            this.isDefaultOrLinux() &&
            (await pathExists(browserPath.debianLinux))
        ) {
            return browserPath.debianLinux;
        }

        throw new Error(
            `No browser was found at expected path for flavor: ${this.browserFlavor} and platform: ${this.platform}`
        );
    }

    /**
     * Checks if the flavor is "Default" or if the platform is windows.
     * @returns True if the flavor is "Default" or if the platform is windows.
     */
    private isDefaultOrWindows(): boolean {
        return this.platform === "Windows" || this.browserFlavor === "Default";
    }

    /**
     * Checks if the flavor is "Default" or if the platform is OSX.
     * @returns True if the flavor is "Default" or if the platform is OSX.
     */
    private isDefaultOrOsx(): boolean {
        return this.platform === "OSX" || this.browserFlavor === "Default";
    }

    /**
     * Checks if the flavor is "Default" or if the platform is Linux.
     * @returns True if the flavor is "Default" or if the platform is Linux.
     */
    private isDefaultOrLinux(): boolean {
        return this.platform === "Linux" || this.browserFlavor === "Default";
    }
}
