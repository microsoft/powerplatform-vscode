/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from "../constants/uriConstants";
import {
    AgentHostBootstrapConfig,
    getAgentHostInstallCommand,
    getAgentHostPathRefreshCommand
} from "./agentHostBootstrap";
import { AgentHost } from "./detectAgentHost";

export type PlannedCommandKind =
    | "installHost"
    | "refreshPath"
    | "verifyHost"
    | "registerMarketplace"
    | "installPlugin"
    | "launchHost";

/**
 * A single planned terminal command. The same structure drives both the preview shown to the
 * user and the actual execution, so what the user is shown can never drift from what is run.
 */
export interface PlannedCommand {
    /** Stable command purpose used by execution and telemetry. */
    kind: PlannedCommandKind;
    /** Exact command line sent to the terminal (product/CLI syntax — not localized). */
    commandLine: string;
    /** Localized one-line explanation of what this step does, shown in the preview. */
    description: string;
}

/**
 * Already-localized step descriptions consumed by {@link buildAgentHostCommandPlan}. Passing the
 * copy in keeps the builder free of the VS Code localization runtime so it stays unit-testable.
 */
export interface AgentHostCommandPlanStrings {
    installHost: string;
    refreshPath: string;
    verifyHost: string;
    registerMarketplace: string;
    installPlugin: string;
    installPluginUserScope: string;
    /** Launch step description template; {0} is replaced with the agent host display name. */
    launchHost: string;
}

/**
 * Substitutes the agent host display name into a localized launch-step template.
 */
function formatLaunchDescription(template: string, hostDisplayName: string): string {
    return template.split("{0}").join(hostDisplayName);
}

/**
 * Builds the ordered command plan that registers the Power Platform Skills marketplace, installs
 * the Power Pages plugin, and starts an interactive session seeded with the create prompt. The
 * plan is rendered into the confirmation preview AND executed line by line, so the two can never
 * diverge.
 *
 * Mirrors the official installer commands in the Power Platform Skills repo.
 * @see https://github.com/microsoft/power-platform-skills/blob/main/scripts/install.js
 * @param host Selected agent host.
 * @param hostDisplayName Localized display name for the host (used in the launch-step description).
 * @param strings Localized step descriptions.
 * @returns The ordered command plan for the host.
 */
export function buildAgentHostCommandPlan(
    host: AgentHost,
    hostDisplayName: string,
    strings: AgentHostCommandPlanStrings,
    bootstrap?: AgentHostBootstrapConfig
): PlannedCommand[] {
    const { MARKETPLACE_REPO, PLUGIN_ID, CREATE_PROMPT } = URI_CONSTANTS.AGENT_HOST_PLUGIN;
    const launchDescription = formatLaunchDescription(strings.launchHost, hostDisplayName);
    const bootstrapCommands: PlannedCommand[] = bootstrap
        ? [
            {
                kind: "installHost",
                commandLine: getAgentHostInstallCommand(host, bootstrap),
                description: strings.installHost.replace("{0}", hostDisplayName)
            },
            {
                kind: "refreshPath",
                commandLine: getAgentHostPathRefreshCommand(bootstrap),
                description: strings.refreshPath
            },
            {
                kind: "verifyHost",
                commandLine: `${host} --version`,
                description: strings.verifyHost.replace("{0}", hostDisplayName)
            }
        ]
        : [];

    switch (host) {
        case AgentHost.Claude:
            return [...bootstrapCommands,
                {
                    kind: "registerMarketplace",
                    commandLine: `claude plugin marketplace add "${MARKETPLACE_REPO}"`,
                    description: strings.registerMarketplace
                },
                {
                    kind: "installPlugin",
                    commandLine: `claude plugin install "${PLUGIN_ID}" --scope user`,
                    description: strings.installPluginUserScope
                },
                {
                    kind: "launchHost",
                    commandLine: `claude "${CREATE_PROMPT}"`,
                    description: launchDescription
                }
            ];
        case AgentHost.Copilot:
        default:
            return [...bootstrapCommands,
                {
                    kind: "registerMarketplace",
                    commandLine: `copilot plugin marketplace add "${MARKETPLACE_REPO}"`,
                    description: strings.registerMarketplace
                },
                {
                    kind: "installPlugin",
                    commandLine: `copilot plugin install "${PLUGIN_ID}"`,
                    description: strings.installPlugin
                },
                {
                    kind: "launchHost",
                    commandLine: `copilot -i "${CREATE_PROMPT}"`,
                    description: launchDescription
                }
            ];
    }
}
