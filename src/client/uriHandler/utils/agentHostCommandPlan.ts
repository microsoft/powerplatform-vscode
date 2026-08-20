/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from "../constants/uriConstants";
import { AgentHost } from "./detectAgentHost";

/**
 * A single planned terminal command. The same structure drives both the preview shown to the
 * user and the actual execution, so what the user is shown can never drift from what is run.
 */
export interface PlannedCommand {
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
    strings: AgentHostCommandPlanStrings
): PlannedCommand[] {
    const { MARKETPLACE_REPO, PLUGIN_ID, CREATE_PROMPT } = URI_CONSTANTS.AGENT_HOST_PLUGIN;
    const launchDescription = formatLaunchDescription(strings.launchHost, hostDisplayName);

    switch (host) {
        case AgentHost.Claude:
            return [
                {
                    commandLine: `claude plugin marketplace add "${MARKETPLACE_REPO}"`,
                    description: strings.registerMarketplace
                },
                {
                    commandLine: `claude plugin install "${PLUGIN_ID}" --scope user`,
                    description: strings.installPluginUserScope
                },
                {
                    commandLine: `claude "${CREATE_PROMPT}"`,
                    description: launchDescription
                }
            ];
        case AgentHost.Copilot:
        default:
            return [
                {
                    commandLine: `copilot plugin marketplace add "${MARKETPLACE_REPO}"`,
                    description: strings.registerMarketplace
                },
                {
                    commandLine: `copilot plugin install "${PLUGIN_ID}"`,
                    description: strings.installPlugin
                },
                {
                    commandLine: `copilot -i "${CREATE_PROMPT}"`,
                    description: launchDescription
                }
            ];
    }
}
