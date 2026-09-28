/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from '../constants/uriConstants';
import {
    AgentHostCommandProbe,
    runAgentHostCommandProbe
} from './agentHostCommandProbe';

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
    executablePath?: string;
    version?: string;
}

/**
 * Runs an agent-host CLI probe command.
 */
export type AgentHostProbe = AgentHostCommandProbe;

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

const defaultRunProbe: AgentHostProbe = async (command, args) => {
    return runAgentHostCommandProbe(command, args, AGENT_HOST_PROBE_TIMEOUT_MS);
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
        const { commandPath, stdout } = await runProbe(command, args);
        return {
            host,
            installed: true,
            ...(commandPath ? { executablePath: commandPath } : {}),
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
