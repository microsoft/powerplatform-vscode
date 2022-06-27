/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { BrowserFlavor } from "../../browser/BrowserFlavor";

import { IDevToolsSettings } from "./IDevToolsSettings";

/**
 * Interface to store the user configuration/settings.
 */
export interface IUserSettings extends IDevToolsSettings {
    /**
     * The URL to use as an override for any settings in launch.json.
     * @example
     * "https://myOrg.dynamics.com/"
     */
    defaultUrl: string;

    /**
     * The model driven application id which is used to host the PCF control.
     * @example "00000000-0000-0000-0000-000000000000"
     */
    appId: string;

    /**
     * The {@link BrowserFlavor browser} to use.
     * PowerPlatform PCF Debugger for VS Code will try to open the Microsoft Edge flavors in the following order: Stable, Beta, Dev and Canary.
     */
    browserFlavor: BrowserFlavor;

    /**
     * The absolute path to the webserver root. Used to resolve paths like `/app.js` to files on disk.
     */
    webRoot: string;
}

