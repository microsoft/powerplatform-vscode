/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { URI_CONSTANTS } from '../constants/uriConstants';

/**
 * Agent hosts whose CLIs can be detected on PATH.
 */
export const AgentHost = {
    Copilot: URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT,
    Claude: URI_CONSTANTS.AGENT_HOST_VALUES.CLAUDE
} as const;

/**
 * A supported detectable agent host.
 */
export type AgentHost = typeof AgentHost[keyof typeof AgentHost];

/**
 * Result of probing an agent host CLI.
 */
export interface AgentHostDetectionResult {
    host: AgentHost;
    installed: boolean;
    version?: string;
}

/**
 * Runs an agent-host CLI probe command.
 */
export type AgentHostProbe = (command: string) => Promise<{ stdout: string }>;

const AGENT_HOST_PROBE_COMMANDS: Record<AgentHost, string> = {
    [AgentHost.Copilot]: 'copilot --version',
    [AgentHost.Claude]: 'claude --version'
};

const execAsync = promisify(exec);

const defaultRunProbe: AgentHostProbe = async (command) => {
    const { stdout } = await execAsync(command);
    return { stdout };
};

/**
 * Detects whether one agent host CLI is available on PATH.
 * @param host Agent host to probe.
 * @param runProbe Optional command runner used to probe the host.
 * @returns The host installation status and trimmed version output when installed.
 */
export const detectAgentHost = async (
    host: AgentHost,
    runProbe: AgentHostProbe = defaultRunProbe
): Promise<AgentHostDetectionResult> => {
    try {
        const { stdout } = await runProbe(AGENT_HOST_PROBE_COMMANDS[host]);
        return {
            host,
            installed: true,
            version: stdout.trim()
        };
    } catch {
        return {
            host,
            installed: false
        };
    }
};

/**
 * Detects all supported agent host CLIs on PATH in parallel.
 * @param runProbe Optional command runner used to probe each host.
 * @returns Detection results ordered as Copilot then Claude.
 */
export const detectAgentHosts = async (
    runProbe: AgentHostProbe = defaultRunProbe
): Promise<AgentHostDetectionResult[]> => {
    return await Promise.all([
        detectAgentHost(AgentHost.Copilot, runProbe),
        detectAgentHost(AgentHost.Claude, runProbe)
    ]);
};
