/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { EXTENSION_NAME } from "../../common/constants";

import { ControlLocation } from "../controlLocation";

import { IPcfLaunchConfig } from "./types/IPcfLaunchConfig";

export const providedDebugConfig: vscode.DebugConfiguration = {
    type: `${EXTENSION_NAME}.debug`,
    request: "launch",
    name: "Launch a PCF control in Microsoft Edge and attach debugger.",
    url: "https://YOUR_ORG.crm.dynamics.com",
    webRoot: '^"${2:\\${workspaceFolder\\}}"',
    renderFullScreen: true,
    controlName: "publisher.MyControl",
    file: "${workspaceFolder}/out/bundle.js",
};

/**
 *
 */
export class LaunchJsonConfigManager {
    /**
     * Validates the selected launch configuration and throws an error if it is not valid.
     * @param debugConfig The selected launch configuration.
     */
    public static validateLaunchJson(
        debugConfig?: Partial<IPcfLaunchConfig>
    ): void {
        if (
            !debugConfig?.url ||
            !debugConfig?.webRoot ||
            !debugConfig?.file ||
            !debugConfig?.port ||
            !debugConfig?.type ||
            !debugConfig?.controlLocation?.controlName ||
            debugConfig?.controlLocation.renderFullScreen === undefined
        ) {
            throw new Error(
                "Could not get launch configuration from user config. Config: " +
                JSON.stringify(debugConfig)
            );
        }
    }

    /**
     * Creates a {@link ControlLocation } config from parameters.
     * @param renderFullPage Wether to render the page in full screen or not.
     * @param tabName Name of the tab to open.
     * @param controlName Name of the control to open.
     * @param appId App id that hosts the control.
     * @returns The {@link ControlLocation Configuration} which specifies the location of the control.
     */
    public static getControlLocationConfig(
        renderFullPage: boolean | undefined,
        tabName: string | undefined,
        controlName: string | undefined,
        appId: string | undefined
    ): ControlLocation {
        if (!controlName) {
            throw new Error("Missing controlName in launch.json");
        }

        let controlLocation: ControlLocation;
        if (!renderFullPage) {
            if (!tabName) {
                throw new Error(
                    "renderFullScreen is false but tabName is not specified in launch.json"
                );
            }
            controlLocation = {
                controlName: controlName,
                tabName,
                renderFullScreen: false,
            };
        } else {
            if (!appId) {
                throw new Error(
                    "renderFullScreen is true but appId is not specified in launch.json or extension settings"
                );
            }
            controlLocation = {
                appId,
                controlName: controlName,
                renderFullScreen: true,
            };
        }
        return controlLocation;
    }
}

