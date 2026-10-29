/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import commandExists from "command-exists";
import * as path from "path";
import { AgentHost } from "./detectAgentHost";
import { CommandPathResolver, resolveCommandFromPath } from "./agentHostCommandProbe";
import { getEnvironmentValue, isLaunchableFile } from "./agentHostSearchPath";
import { AgentHostTerminalShellOptions, resolveAgentHostPowerShell } from "./agentHostTerminalShell";

export type SupportedAgentHostPlatform = "win32" | "darwin" | "linux";
export type AgentHostInstaller = "winget" | "brew" | "script";

export interface AgentHostBootstrapConfig {
    platform: SupportedAgentHostPlatform;
    installer: AgentHostInstaller;
    shellPath: string;
}

/** Installer executable and arguments that run without shell parsing. */
export interface AgentHostInstallInvocation {
    executable: string;
    args: string[];
}

export type AgentHostBootstrapResolution =
    | { supported: true; config: AgentHostBootstrapConfig }
    | {
        supported: false;
        reason: "unsupportedPlatform" | "missingWinget" | "missingBash" | "missingInstaller";
    };

export type CommandAvailability = (command: string) => boolean;

function resolveWindowsPowerShell(options: AgentHostTerminalShellOptions): string {
    const systemRoot = getEnvironmentValue(options.environment ?? process.env, "SystemRoot", "win32");
    const candidate = systemRoot
        ? path.win32.join(systemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe")
        : undefined;
    return candidate && (options.isFile ?? isLaunchableFile)(candidate)
        ? candidate
        : "powershell.exe";
}

/**
 * Resolves a deterministic shell and official installer for a missing agent host.
 * @param host Selected agent host.
 * @param platform Runtime platform.
 * @param isCommandAvailable Injectable executable lookup.
 * @param shellOptions Windows profile paths and shell validation inputs.
 * @param resolveCommand Injectable Windows shell PATH lookup.
 * @returns Supported bootstrap configuration or an actionable prerequisite failure.
 */
export function resolveAgentHostBootstrap(
    host: AgentHost,
    platform: NodeJS.Platform = process.platform,
    isCommandAvailable: CommandAvailability = commandExists.sync,
    shellOptions: AgentHostTerminalShellOptions = {},
    resolveCommand: CommandPathResolver = resolveCommandFromPath
): AgentHostBootstrapResolution {
    switch (platform) {
        case "win32": {
            // Setup runs without a shell. PowerShell quotes the preview and runs the terminal
            // fallback; Windows PowerShell keeps the plan available for manual copying.
            const shellPath = resolveAgentHostPowerShell(resolveCommand, shellOptions)
                ?? resolveWindowsPowerShell(shellOptions);
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
    const { executable, args } = getAgentHostInstallInvocation(host, config);
    return config.installer === "script"
        ? args[args.length - 1]
        : [executable, ...args].join(" ");
}

/**
 * Returns the official installer as an executable and arguments for shell-free execution.
 * @param host Selected agent host.
 * @param config Bootstrap configuration.
 * @returns Installer executable name and arguments.
 */
export function getAgentHostInstallInvocation(
    host: AgentHost,
    config: AgentHostBootstrapConfig
): AgentHostInstallInvocation {
    if (config.installer === "winget") {
        const packageId = host === AgentHost.Copilot
            ? "GitHub.Copilot"
            : "Anthropic.ClaudeCode";
        return {
            executable: "winget",
            args: [
                "install",
                "--id",
                packageId,
                "--exact",
                "--accept-package-agreements",
                "--accept-source-agreements"
            ]
        };
    }

    if (config.installer === "brew") {
        const cask = host === AgentHost.Copilot ? "copilot-cli" : "claude-code";
        return { executable: "brew", args: ["install", "--cask", cask] };
    }

    const scriptUrl = host === AgentHost.Copilot
        ? "https://gh.io/copilot-install"
        : "https://claude.ai/install.sh";
    return {
        executable: "bash",
        args: ["-o", "pipefail", "-c", `curl -fsSL ${scriptUrl} | bash`]
    };
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
