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
import {
    AgentHostSetupComponent,
    AgentHostSetupState,
    getAgentHostSetupCheckCommand,
    UNKNOWN_AGENT_HOST_SETUP
} from "./agentHostSetupPrecheck";

export type PlannedCommandKind =
    | "installHost"
    | "refreshPath"
    | "verifyHost"
    | "checkMarketplace"
    | "checkPlugin"
    | "registerMarketplace"
    | "installPlugin"
    | "enablePlugin"
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
    /** Executable and arguments used when values must bypass shell parsing. */
    executable?: string;
    args?: string[];
    /** Localized one-line explanation of what this step does, shown in the preview. */
    description: string;
    /** Setup component populated by this read-only inventory command. */
    setupCheck?: AgentHostSetupComponent;
    /** Execute this command only for the listed setup states. */
    runWhenSetupState?: {
        component: AgentHostSetupComponent;
        states: AgentHostSetupState[AgentHostSetupComponent][];
    };
}

/**
 * Already-localized step descriptions consumed by {@link buildAgentHostCommandPlan}. Passing the
 * copy in keeps the builder free of the VS Code localization runtime so it stays unit-testable.
 */
export interface AgentHostCommandPlanStrings {
    installHost: string;
    refreshPath: string;
    verifyHost: string;
    checkMarketplace: string;
    checkPlugin: string;
    registerMarketplace: string;
    installPlugin: string;
    installPluginUserScope: string;
    enablePlugin: string;
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
    bootstrap?: AgentHostBootstrapConfig,
    setupState: AgentHostSetupState = UNKNOWN_AGENT_HOST_SETUP,
    siteDescription = "Create a Power Pages site"
): PlannedCommand[] {
    const {
        MARKETPLACE_REPO,
        PLUGIN_ID,
        CREATE_SKILL_COMMAND
    } = URI_CONSTANTS.AGENT_HOST_PLUGIN;
    const launchDescription = formatLaunchDescription(strings.launchHost, hostDisplayName);
    const createPrompt = `${CREATE_SKILL_COMMAND} ${siteDescription}`;
    const previewPrompt = JSON.stringify(createPrompt);
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
    const setupChecks: PlannedCommand[] = bootstrap
        ? [
            {
                kind: "checkMarketplace",
                commandLine: getAgentHostSetupCheckCommand(host, "marketplace"),
                description: strings.checkMarketplace,
                setupCheck: "marketplace"
            },
            {
                kind: "checkPlugin",
                commandLine: getAgentHostSetupCheckCommand(host, "plugin"),
                description: strings.checkPlugin,
                setupCheck: "plugin"
            }
        ]
        : [];
    const includeMarketplaceSetup = bootstrap
        || setupState.marketplace !== "present";
    const includePluginSetup = bootstrap
        || setupState.plugin === "missing"
        || setupState.plugin === "unknown";
    const includePluginEnable = bootstrap
        || setupState.plugin === "disabled";

    switch (host) {
        case AgentHost.Claude:
            return [
                ...bootstrapCommands,
                ...setupChecks,
                ...(includeMarketplaceSetup ? [{
                    kind: "registerMarketplace",
                    commandLine: `claude plugin marketplace add "${MARKETPLACE_REPO}"`,
                    description: strings.registerMarketplace,
                    ...(bootstrap ? {
                        runWhenSetupState: {
                            component: "marketplace" as const,
                            states: ["missing", "unknown"] as const
                        }
                    } : {})
                } satisfies PlannedCommand] : []),
                ...(includePluginSetup ? [{
                    kind: "installPlugin",
                    commandLine: `claude plugin install "${PLUGIN_ID}" --scope user`,
                    description: strings.installPluginUserScope,
                    ...(bootstrap ? {
                        runWhenSetupState: {
                            component: "plugin" as const,
                            states: ["missing", "unknown"] as const
                        }
                    } : {})
                } satisfies PlannedCommand] : []),
                ...(includePluginEnable ? [{
                    kind: "enablePlugin",
                    commandLine: `claude plugin enable "${PLUGIN_ID}" --scope user`,
                    description: strings.enablePlugin,
                    ...(bootstrap ? {
                        runWhenSetupState: {
                            component: "plugin" as const,
                            states: ["disabled"] as const
                        }
                    } : {})
                } satisfies PlannedCommand] : []),
                {
                    kind: "launchHost",
                    commandLine: `claude --permission-mode auto ${previewPrompt}`,
                    executable: "claude",
                    args: ["--permission-mode", "auto", createPrompt],
                    description: launchDescription
                }
            ];
        case AgentHost.Copilot:
        default:
            return [
                ...bootstrapCommands,
                ...setupChecks,
                ...(includeMarketplaceSetup ? [{
                    kind: "registerMarketplace",
                    commandLine: `copilot plugin marketplace add "${MARKETPLACE_REPO}"`,
                    description: strings.registerMarketplace,
                    ...(bootstrap ? {
                        runWhenSetupState: {
                            component: "marketplace" as const,
                            states: ["missing", "unknown"] as const
                        }
                    } : {})
                } satisfies PlannedCommand] : []),
                ...(includePluginSetup ? [{
                    kind: "installPlugin",
                    commandLine: `copilot plugin install "${PLUGIN_ID}"`,
                    description: strings.installPlugin,
                    ...(bootstrap ? {
                        runWhenSetupState: {
                            component: "plugin" as const,
                            states: ["missing", "unknown"] as const
                        }
                    } : {})
                } satisfies PlannedCommand] : []),
                ...(includePluginEnable ? [{
                    kind: "enablePlugin",
                    commandLine: `copilot plugin enable "${PLUGIN_ID}"`,
                    description: strings.enablePlugin,
                    ...(bootstrap ? {
                        runWhenSetupState: {
                            component: "plugin" as const,
                            states: ["disabled"] as const
                        }
                    } : {})
                } satisfies PlannedCommand] : []),
                {
                    kind: "launchHost",
                    commandLine: `copilot -i ${previewPrompt}`,
                    executable: "copilot",
                    args: ["-i", createPrompt],
                    description: launchDescription
                }
            ];
    }
}
