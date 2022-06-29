/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 */

import { BrowserFlavor } from "../../browser/types";
import { ControlLocation } from "../../controlLocation";

import { DebugConfiguration } from "./DebugConfiguration";
import { IDevToolsSettings } from "./IDevToolsSettings";

/**
 * Interface to represent a configuration specified in a launch.json file.
 */
export interface IPcfLaunchConfig
    extends DebugConfiguration,
        IDevToolsSettings {
    /**
     * The url to the PowerPlatform application.
     * @example "https://ORG_URL.crm.dynamics.com"
     */
    url: string;

    /**
     * The path to the local root of the control.
     * @example "${workspaceFolder}/controls/my-control"
     */
    webRoot: string;

    /**
     * Relative path of the bundle file to debug.
     * @example "${workspaceFolder}/controls/my-control/out/controls/src/bundle.js"
     */
    file: string;

    /**
     * The browser flavor to use.
     * PowerPlatform PCF Debugger for VS Code will try to open the Microsoft Edge flavors in the following order: Stable, Beta, Dev and Canary.
     */
    browserFlavor: BrowserFlavor;

    /**
     * Location of the PCF control.
     */
    controlLocation: ControlLocation;
}
