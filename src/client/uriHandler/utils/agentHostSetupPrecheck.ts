/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { URI_CONSTANTS } from "../constants/uriConstants";
import * as path from "path";
import {
    existsSync,
    readFileSync,
    statSync
} from "fs";
import {
    AgentHostCommandProbe,
    runAgentHostCommandProbe
} from "./agentHostCommandProbe";
import { AgentHost } from "./detectAgentHost";

export type AgentHostSetupComponent = "marketplace" | "plugin";
export type AgentHostSetupItemState = "present" | "disabled" | "missing" | "unknown";

export interface AgentHostSetupState {
    marketplace: AgentHostSetupItemState;
    plugin: AgentHostSetupItemState;
}

export type AgentHostSetupProbe = AgentHostCommandProbe;
export type GitCommonDirectoryResolver = (
    folderPath: string
) => string | undefined;

export const UNKNOWN_AGENT_HOST_SETUP: AgentHostSetupState = {
    marketplace: "unknown",
    plugin: "unknown"
};

const SETUP_CHECK_TIMEOUT_MS = 15000;
const TOKEN_SEPARATOR_PATTERN = /[^\p{L}\p{N}@._/-]+/u;

/**
 * Resolves the shared Git metadata directory for a checkout or linked worktree.
 */
export function resolveGitCommonDirectory(
    folderPath: string
): string | undefined {
    try {
        const pathApi = /^(?:[A-Za-z]:[\\/]|\\\\|\/\/)/u.test(folderPath)
            ? path.win32
            : path.posix;
        let directory = pathApi.resolve(folderPath);
        for (;;) {
            const gitMarker = pathApi.join(directory, ".git");
            if (existsSync(gitMarker)) {
                if (statSync(gitMarker).isDirectory()) {
                    return pathApi.normalize(gitMarker);
                }

                const gitDirectoryMatch = /^gitdir:\s*(.+)$/imu.exec(
                    readFileSync(gitMarker, "utf8")
                );
                if (!gitDirectoryMatch) {
                    return undefined;
                }
                const gitDirectory = pathApi.normalize(
                    pathApi.isAbsolute(gitDirectoryMatch[1])
                        ? gitDirectoryMatch[1]
                        : pathApi.resolve(directory, gitDirectoryMatch[1])
                );
                const commonDirectoryFile = pathApi.join(gitDirectory, "commondir");
                if (!existsSync(commonDirectoryFile)) {
                    return gitDirectory;
                }
                const commonDirectory = readFileSync(
                    commonDirectoryFile,
                    "utf8"
                ).trim();
                return pathApi.normalize(
                    pathApi.isAbsolute(commonDirectory)
                        ? commonDirectory
                        : pathApi.resolve(gitDirectory, commonDirectory)
                );
            }
            const parent = pathApi.dirname(directory);
            if (parent === directory) {
                break;
            }
            directory = parent;
        }
    } catch {
        // A missing or unreadable Git marker means repository matching is unavailable.
    }
    return undefined;
}

function stripTerminalControlSequences(value: string): string {
    let result = "";
    for (let index = 0; index < value.length; index++) {
        if (value.charCodeAt(index) === 27) {
            if (value[index + 1] === "[") {
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
            if (value[index + 1] === "]") {
                index += 2;
                while (index < value.length) {
                    if (value.charCodeAt(index) === 7) {
                        break;
                    }
                    if (
                        value.charCodeAt(index) === 27
                        && value[index + 1] === "\\"
                    ) {
                        index++;
                        break;
                    }
                    index++;
                }
                continue;
            }
            index++;
            continue;
        }
        if (value.charCodeAt(index) === 7) {
            continue;
        }
        result += value[index];
    }
    return result;
}

function parseFirstJsonArray(value: string): unknown[] | undefined {
    for (
        let start = value.indexOf("[");
        start >= 0;
        start = value.indexOf("[", start + 1)
    ) {
        let depth = 0;
        let inString = false;
        let escaped = false;
        for (let index = start; index < value.length; index++) {
            const character = value[index];
            if (inString) {
                if (escaped) {
                    escaped = false;
                } else if (character === "\\") {
                    escaped = true;
                } else if (character === "\"") {
                    inString = false;
                }
                continue;
            }

            if (character === "\"") {
                inString = true;
            } else if (character === "[") {
                depth++;
            } else if (character === "]") {
                depth--;
                if (depth === 0) {
                    try {
                        const parsed = JSON.parse(value.slice(start, index + 1));
                        if (Array.isArray(parsed)) {
                            return parsed;
                        }
                    } catch {
                        break;
                    }
                }
            }
        }
    }
    return undefined;
}

const defaultRunProbe: AgentHostSetupProbe = async (command, args) => {
    return runAgentHostCommandProbe(command, args, SETUP_CHECK_TIMEOUT_MS);
};

/**
 * Returns the read-only inventory command for one setup component.
 */
export function getAgentHostSetupCheckCommand(
    host: AgentHost,
    component: AgentHostSetupComponent
): string {
    const command = component === "marketplace"
        ? `${host} plugin marketplace list`
        : `${host} plugin list`;
    return host === AgentHost.Claude ? `${command} --json` : command;
}

function getStringProperty(
    item: Record<string, unknown>,
    propertyName: string
): string | undefined {
    const value = item[propertyName];
    return typeof value === "string" ? value.toLowerCase() : undefined;
}

function isPathWithin(projectPath: string, targetFolderPath: string): boolean {
    const pathApi = /^(?:[A-Za-z]:[\\/]|\\\\|\/\/)/u.test(projectPath)
        ? path.win32
        : path.posix;
    const relativePath = pathApi.relative(
        pathApi.resolve(projectPath),
        pathApi.resolve(targetFolderPath)
    );
    return relativePath === ""
        || (
            relativePath !== ".."
            && !relativePath.startsWith(`..${pathApi.sep}`)
            && !pathApi.isAbsolute(relativePath)
        );
}

function isPluginApplicable(
    item: Record<string, unknown>,
    targetFolderPath: string | undefined,
    resolveCommonDirectory: GitCommonDirectoryResolver
): boolean {
    const scope = getStringProperty(item, "scope");
    if (!scope || scope === "user" || scope === "managed") {
        return true;
    }
    if ((scope === "local" || scope === "project") && targetFolderPath) {
        const projectPath = item.projectPath;
        if (typeof projectPath !== "string") {
            return false;
        }
        if (isPathWithin(projectPath, targetFolderPath)) {
            return true;
        }
        if (scope === "project") {
            const projectCommonDirectory = resolveCommonDirectory(projectPath);
            const targetCommonDirectory = resolveCommonDirectory(targetFolderPath);
            if (!projectCommonDirectory || !targetCommonDirectory) {
                return false;
            }
            const windowsPath = /^(?:[A-Za-z]:[\\/]|\\\\|\/\/)/u.test(
                projectCommonDirectory
            );
            return windowsPath
                ? projectCommonDirectory.toLowerCase() === targetCommonDirectory.toLowerCase()
                : projectCommonDirectory === targetCommonDirectory;
        }
    }
    return false;
}

function getPluginScopeRank(item: Record<string, unknown>): number {
    switch (getStringProperty(item, "scope")) {
        case "managed":
            return 4;
        case "local":
            return 3;
        case "project":
            return 2;
        case "user":
        default:
            return 1;
    }
}

function getPluginPathSpecificity(
    item: Record<string, unknown>,
    targetFolderPath: string | undefined
): number {
    const projectPath = item.projectPath;
    if (
        typeof projectPath === "string"
        && targetFolderPath
        && isPathWithin(projectPath, targetFolderPath)
    ) {
        return projectPath.length + 1;
    }
    return typeof projectPath === "string" ? 1 : 0;
}

function classifyJsonSetupOutput(
    output: string,
    component: AgentHostSetupComponent,
    marketplaceName: string,
    marketplaceRepo: string,
    pluginId: string,
    targetFolderPath: string | undefined,
    resolveCommonDirectory: GitCommonDirectoryResolver
): Exclude<AgentHostSetupItemState, "unknown"> | undefined {
    const parsed = parseFirstJsonArray(output);
    if (!parsed) {
        return undefined;
    }

    const items = parsed.filter(
        (item): item is Record<string, unknown> =>
            typeof item === "object" && item !== null
    );
    if (component === "marketplace") {
        return items.some(item =>
            getStringProperty(item, "name") === marketplaceName
            || getStringProperty(item, "repo") === marketplaceRepo
        )
            ? "present"
            : "missing";
    }

    const [pluginName] = pluginId.split("@");
    const matchingPlugins = items.filter(item =>
        (
            getStringProperty(item, "id") === pluginId
            || (
                getStringProperty(item, "name") === pluginName
                && getStringProperty(item, "marketplace") === marketplaceName
            )
        )
        && isPluginApplicable(item, targetFolderPath, resolveCommonDirectory)
    );
    if (matchingPlugins.length === 0) {
        return "missing";
    }
    const effectiveScopeRank = Math.max(
        ...matchingPlugins.map(getPluginScopeRank)
    );
    const scopedPlugins = matchingPlugins.filter(
        item => getPluginScopeRank(item) === effectiveScopeRank
    );
    const effectivePathSpecificity = Math.max(
        ...scopedPlugins.map(item =>
            getPluginPathSpecificity(item, targetFolderPath)
        )
    );
    const effectivePlugins = scopedPlugins.filter(
        item =>
            getPluginPathSpecificity(item, targetFolderPath)
            === effectivePathSpecificity
    );
    return effectivePlugins.every(item => item.enabled === false)
        ? "disabled"
        : "present";
}

/**
 * Classifies successful CLI inventory output using exact normalized identifiers.
 */
export function classifyAgentHostSetupOutput(
    output: string,
    component: AgentHostSetupComponent,
    targetFolderPath?: string,
    resolveCommonDirectory: GitCommonDirectoryResolver = resolveGitCommonDirectory
): Exclude<AgentHostSetupItemState, "unknown"> {
    const commonDirectoryCache = new Map<string, string | undefined>();
    const cachedCommonDirectoryResolver = (folderPath: string): string | undefined => {
        if (!commonDirectoryCache.has(folderPath)) {
            commonDirectoryCache.set(
                folderPath,
                resolveCommonDirectory(folderPath)
            );
        }
        return commonDirectoryCache.get(folderPath);
    };
    const normalizedOutput = stripTerminalControlSequences(output);
    const { MARKETPLACE_REPO, PLUGIN_ID } = URI_CONSTANTS.AGENT_HOST_PLUGIN;
    const marketplaceSegments = MARKETPLACE_REPO.split("/");
    const marketplaceName = marketplaceSegments[marketplaceSegments.length - 1];
    const jsonState = classifyJsonSetupOutput(
        normalizedOutput,
        component,
        marketplaceName,
        MARKETPLACE_REPO,
        PLUGIN_ID,
        targetFolderPath,
        cachedCommonDirectoryResolver
    );
    if (jsonState) {
        return jsonState;
    }

    const lines = normalizedOutput
        .split(/\r?\n/)
        .map(line => line.trim().toLowerCase())
        .filter(Boolean);

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
    targetFolderPath?: string,
    runProbe: AgentHostSetupProbe = defaultRunProbe
): Promise<AgentHostSetupState> {
    const check = async (
        component: AgentHostSetupComponent
    ): Promise<AgentHostSetupItemState> => {
        const commandLine = getAgentHostSetupCheckCommand(host, component);
        const [command, ...args] = commandLine.split(" ");
        try {
            const result = await runProbe(command, args);
            return classifyAgentHostSetupOutput(
                result.stdout,
                component,
                targetFolderPath
            );
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
