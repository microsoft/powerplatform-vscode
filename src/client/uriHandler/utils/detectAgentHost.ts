/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { execFile } from 'child_process';
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
export type AgentHostProbe = (command: string, args: string[]) => Promise<{ stdout: string }>;

const AGENT_HOST_PROBES: Record<AgentHost, { command: string; args: string[] }> = {
    [AgentHost.Copilot]: {
        command: 'copilot',
        args: ['--version']
    },
    [AgentHost.Claude]: {
        command: 'claude',
        args: ['--version']
    }
};

const AGENT_HOSTS: AgentHost[] = Object.values(AgentHost);
const AGENT_HOST_PROBE_TIMEOUT_MS = 10000;
const execFileAsync = promisify(execFile);

const defaultRunProbe: AgentHostProbe = async (command, args) => {
    const { stdout } = await execFileAsync(command, args, { timeout: AGENT_HOST_PROBE_TIMEOUT_MS });
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
        const { command, args } = AGENT_HOST_PROBES[host];
        const { stdout } = await runProbe(command, args);
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
    return await Promise.all(AGENT_HOSTS.map(host => detectAgentHost(host, runProbe)));
};
