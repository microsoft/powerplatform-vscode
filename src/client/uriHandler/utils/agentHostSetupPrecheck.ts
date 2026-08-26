/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { execFile } from "child_process";
import { promisify } from "util";
import { URI_CONSTANTS } from "../constants/uriConstants";
import { AgentHost } from "./detectAgentHost";

export type AgentHostSetupComponent = "marketplace" | "plugin";
export type AgentHostSetupItemState = "present" | "disabled" | "missing" | "unknown";

export interface AgentHostSetupState {
    marketplace: AgentHostSetupItemState;
    plugin: AgentHostSetupItemState;
}

export interface AgentHostSetupProbeResult {
    stdout: string;
}

export type AgentHostSetupProbe = (
    command: string,
    args: string[]
) => Promise<AgentHostSetupProbeResult>;

export const UNKNOWN_AGENT_HOST_SETUP: AgentHostSetupState = {
    marketplace: "unknown",
    plugin: "unknown"
};

const SETUP_CHECK_TIMEOUT_MS = 5000;
const execFileAsync = promisify(execFile);
const TOKEN_SEPARATOR_PATTERN = /[^\p{L}\p{N}@._/-]+/u;

function stripTerminalControlSequences(value: string): string {
    let result = "";
    for (let index = 0; index < value.length; index++) {
        if (value.charCodeAt(index) === 27 && value[index + 1] === "[") {
            index += 2;
            while (
                index < value.length
                && (
                    value.charCodeAt(index) < 64
                    || value.charCodeAt(index) > 126
                )
            ) {
                index++;
            }
            continue;
        }
        result += value[index];
    }
    return result;
}

const defaultRunProbe: AgentHostSetupProbe = async (command, args) => {
    const { stdout } = await execFileAsync(command, args, {
        timeout: SETUP_CHECK_TIMEOUT_MS
    });
    return { stdout };
};

/**
 * Returns the read-only inventory command for one setup component.
 */
export function getAgentHostSetupCheckCommand(
    host: AgentHost,
    component: AgentHostSetupComponent
): string {
    return component === "marketplace"
        ? `${host} plugin marketplace list`
        : `${host} plugin list`;
}

/**
 * Classifies successful CLI inventory output using exact normalized identifiers.
 */
export function classifyAgentHostSetupOutput(
    output: string,
    component: AgentHostSetupComponent
): Exclude<AgentHostSetupItemState, "unknown"> {
    const lines = stripTerminalControlSequences(output)
        .split(/\r?\n/)
        .map(line => line.trim().toLowerCase())
        .filter(Boolean);
    const { MARKETPLACE_REPO, PLUGIN_ID } = URI_CONSTANTS.AGENT_HOST_PLUGIN;
    const marketplaceSegments = MARKETPLACE_REPO.split("/");
    const marketplaceName = marketplaceSegments[marketplaceSegments.length - 1];

    const matchingLines = lines.filter(line => {
        const tokens = line.split(TOKEN_SEPARATOR_PATTERN).filter(Boolean);
        if (component === "marketplace") {
            return tokens.includes(marketplaceName)
                || tokens.includes(MARKETPLACE_REPO);
        }

        return tokens.includes(PLUGIN_ID)
            || (
                tokens.includes(PLUGIN_ID.split("@")[0])
                && tokens.includes(marketplaceName)
            );
    });
    if (matchingLines.length === 0) {
        return "missing";
    }
    if (
        component === "plugin"
        && matchingLines.some(line =>
            line.split(TOKEN_SEPARATOR_PATTERN).includes("disabled")
            || /"enabled"\s*:\s*false/u.test(line)
        )
    ) {
        return "disabled";
    }
    return "present";
}

/**
 * Checks whether the selected host already has the marketplace and Power Pages plugin.
 * Failures are reported as unknown so callers can fall back to idempotent setup.
 */
export async function detectAgentHostSetup(
    host: AgentHost,
    runProbe: AgentHostSetupProbe = defaultRunProbe
): Promise<AgentHostSetupState> {
    const check = async (
        component: AgentHostSetupComponent
    ): Promise<AgentHostSetupItemState> => {
        const commandLine = getAgentHostSetupCheckCommand(host, component);
        const [command, ...args] = commandLine.split(" ");
        try {
            const result = await runProbe(command, args);
            return classifyAgentHostSetupOutput(result.stdout, component);
        } catch {
            return "unknown";
        }
    };

    const [marketplace, plugin] = await Promise.all([
        check("marketplace"),
        check("plugin")
    ]);
    return { marketplace, plugin };
}
