/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import commandExists from "command-exists";
import { AgentHost } from "./detectAgentHost";

export type SupportedAgentHostPlatform = "win32" | "darwin" | "linux";
export type AgentHostInstaller = "winget" | "brew" | "script";

export interface AgentHostBootstrapConfig {
    platform: SupportedAgentHostPlatform;
    installer: AgentHostInstaller;
    shellPath: string;
}

export type AgentHostBootstrapResolution =
    | { supported: true; config: AgentHostBootstrapConfig }
    | {
        supported: false;
        reason: "unsupportedPlatform" | "missingPowerShell" | "missingWinget" | "missingBash" | "missingInstaller";
    };

export type CommandAvailability = (command: string) => boolean;

/**
 * Resolves a deterministic shell and official installer for a missing agent host.
 * @param host Selected agent host.
 * @param platform Runtime platform.
 * @param isCommandAvailable Injectable executable lookup.
 * @returns Supported bootstrap configuration or an actionable prerequisite failure.
 */
export function resolveAgentHostBootstrap(
    host: AgentHost,
    platform: NodeJS.Platform = process.platform,
    isCommandAvailable: CommandAvailability = commandExists.sync
): AgentHostBootstrapResolution {
    switch (platform) {
        case "win32": {
            const shellPath = isCommandAvailable("pwsh")
                ? "pwsh"
                : isCommandAvailable("powershell")
                    ? "powershell"
                    : undefined;
            if (!shellPath) {
                return { supported: false, reason: "missingPowerShell" };
            }
            if (!isCommandAvailable("winget")) {
                return { supported: false, reason: "missingWinget" };
            }
            return {
                supported: true,
                config: {
                    platform,
                    installer: "winget",
                    shellPath
                }
            };
        }
        case "darwin":
            if (!isCommandAvailable("bash")) {
                return { supported: false, reason: "missingBash" };
            }
            if (isCommandAvailable("brew")) {
                return {
                    supported: true,
                    config: {
                        platform,
                        installer: "brew",
                        shellPath: "bash"
                    }
                };
            }
            if (isCommandAvailable("curl")) {
                return {
                    supported: true,
                    config: {
                        platform,
                        installer: "script",
                        shellPath: "bash"
                    }
                };
            }
            return { supported: false, reason: "missingInstaller" };
        case "linux":
            if (!isCommandAvailable("bash")) {
                return { supported: false, reason: "missingBash" };
            }
            if (!isCommandAvailable("curl")) {
                return { supported: false, reason: "missingInstaller" };
            }
            return {
                supported: true,
                config: {
                    platform,
                    installer: "script",
                    shellPath: "bash"
                }
            };
        default:
            return { supported: false, reason: "unsupportedPlatform" };
    }
}

/**
 * Returns the official install command for the selected host and installer.
 */
export function getAgentHostInstallCommand(
    host: AgentHost,
    config: AgentHostBootstrapConfig
): string {
    if (config.installer === "winget") {
        const packageId = host === AgentHost.Copilot
            ? "GitHub.Copilot"
            : "Anthropic.ClaudeCode";
        return `winget install --id ${packageId} --exact --accept-package-agreements --accept-source-agreements`;
    }

    if (config.installer === "brew") {
        const cask = host === AgentHost.Copilot ? "copilot-cli" : "claude-code";
        return `brew install --cask ${cask}`;
    }

    return host === AgentHost.Copilot
        ? "curl -fsSL https://gh.io/copilot-install | bash"
        : "curl -fsSL https://claude.ai/install.sh | bash";
}

/**
 * Refreshes the active terminal's PATH after an installer updates persistent shell state.
 */
export function getAgentHostPathRefreshCommand(
    config: AgentHostBootstrapConfig
): string {
    if (config.platform === "win32") {
        return '$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") + ";" + $env:Path';
    }
    return 'export PATH="$HOME/.local/bin:$PATH"; hash -r';
}
