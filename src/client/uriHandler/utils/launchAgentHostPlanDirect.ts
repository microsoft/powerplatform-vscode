/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import type * as vscode from "vscode";
import type { PlannedCommand, PlannedCommandKind } from "./agentHostCommandPlan";
import { resolveCommandFromPath } from "./agentHostCommandProbe";
import {
    getEnvironmentValue,
    isLaunchableFile,
    isSpawnableFile,
    resolveAgentHostSearchPath
} from "./agentHostSearchPath";
import {
    AgentHostSetupState,
    classifyAgentHostSetupOutput,
    UNKNOWN_AGENT_HOST_SETUP
} from "./agentHostSetupPrecheck";
import type { AgentHost } from "./detectAgentHost";
import type {
    DirectLaunchUnavailableReason,
    LaunchAgentHostPlanResult,
    LaunchAgentHostProgress
} from "./launchAgentHostPlan";

const INSTALL_TIMEOUT_MS = 15 * 60 * 1000;
const HOST_COMMAND_TIMEOUT_MS = 5 * 60 * 1000;
const MAX_CAPTURED_OUTPUT_LENGTH = 1024 * 1024;
const DEFAULT_WINDOWS_PATH_EXTENSIONS = ".COM;.EXE;.BAT;.CMD";
const MUTATING_COMMAND_KINDS: readonly PlannedCommandKind[] = [
    "installHost",
    "registerMarketplace",
    "installPlugin",
    "enablePlugin"
];

/** Result of a direct plan attempt; `unavailable` means the terminal executor should continue. */
export type DirectLaunchAgentHostPlanResult =
    | LaunchAgentHostPlanResult
    | {
        status: "unavailable";
        reason: DirectLaunchUnavailableReason;
        completedCommandKinds: PlannedCommandKind[];
        skippedCommandKinds: PlannedCommandKind[];
        setupState: AgentHostSetupState;
    };

export interface DirectProcessOptions {
    cwd: string;
    env: NodeJS.ProcessEnv;
    timeoutMs: number;
}

export interface DirectProcessResult {
    /** Process exit code, or undefined when the process timed out or was terminated by a signal. */
    exitCode: number | undefined;
    output: string;
}

/** Runs a process without a shell. Rejects only when the process cannot be started. */
export type DirectProcessRunner = (
    executable: string,
    args: string[],
    options: DirectProcessOptions
) => Promise<DirectProcessResult>;

/**
 * Side effects used by {@link launchAgentHostPlanDirect}.
 */
export interface LaunchAgentHostPlanDirectDependencies {
    platform: NodeJS.Platform;
    environment: NodeJS.ProcessEnv;
    getSearchPath: () => Promise<string>;
    /** Accepts files that the integrated terminal can start as its process. */
    isLaunchableFile: (filePath: string) => boolean;
    /** Accepts files that Node.js can spawn, including Windows App Execution Aliases. */
    isSpawnableFile: (filePath: string) => boolean;
    runProcess: DirectProcessRunner;
    createTerminal: (options: vscode.TerminalOptions) => vscode.Terminal;
}

type HostExecutableResolution =
    | { status: "found"; executable: string }
    | { status: "notFound" }
    | { status: "unsupported" };

/**
 * Runs a process with closed standard input and captures combined output.
 * @param executable Absolute executable path.
 * @param args Arguments passed without shell parsing.
 * @param options Working directory, environment, and timeout.
 * @returns Exit code and captured output.
 */
export const runDirectProcess: DirectProcessRunner = (executable, args, options) =>
    new Promise((resolve, reject) => {
        let child: ChildProcess;
        try {
            child = spawn(executable, args, {
                cwd: options.cwd,
                env: options.env,
                stdio: ["ignore", "pipe", "pipe"],
                windowsHide: true,
                shell: false
            });
        } catch (error) {
            reject(error);
            return;
        }

        let output = "";
        let settled = false;
        let timedOut = false;
        const append = (chunk: string): void => {
            if (output.length < MAX_CAPTURED_OUTPUT_LENGTH) {
                output = (output + chunk).slice(0, MAX_CAPTURED_OUTPUT_LENGTH);
            }
        };
        child.stdout?.setEncoding("utf8");
        child.stderr?.setEncoding("utf8");
        child.stdout?.on("data", append);
        child.stderr?.on("data", append);
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill();
        }, options.timeoutMs);
        child.once("error", error => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            if (timedOut) {
                resolve({ exitCode: undefined, output });
            } else {
                reject(error);
            }
        });
        child.once("close", code => {
            if (settled) {
                return;
            }
            settled = true;
            clearTimeout(timer);
            resolve({
                exitCode: timedOut || code === null ? undefined : code,
                output
            });
        });
    });

/**
 * Creates production dependencies for direct execution.
 * @param createTerminal VS Code terminal factory.
 * @returns Dependencies backed by Node.js processes and the persisted search path.
 */
export function createLaunchAgentHostPlanDirectDependencies(
    createTerminal: (options: vscode.TerminalOptions) => vscode.Terminal
): LaunchAgentHostPlanDirectDependencies {
    return {
        platform: process.platform,
        environment: process.env,
        getSearchPath: () => resolveAgentHostSearchPath(process.platform, process.env),
        isLaunchableFile,
        isSpawnableFile,
        runProcess: runDirectProcess,
        createTerminal
    };
}

function classifyDirectExecutable(
    executable: string,
    platform: NodeJS.Platform,
    fileExists: (filePath: string) => boolean
): HostExecutableResolution {
    if (platform !== "win32" || /\.(?:exe|com)$/iu.test(executable)) {
        return { status: "found", executable };
    }
    if (/\.(?:cmd|bat)$/iu.test(executable)) {
        const parsed = path.win32.parse(executable);
        const sibling = path.win32.join(parsed.dir, `${parsed.name}.exe`);
        if (fileExists(sibling)) {
            return { status: "found", executable: sibling };
        }
    }
    // Scripts and shims need a shell, so the terminal executor handles them.
    return { status: "unsupported" };
}

/**
 * Resolves a host executable that can run without a shell.
 *
 * An absolute executable approved in the preview is used as-is. Otherwise the first search path
 * match is used, so direct execution runs the same installation a new terminal would. A Windows
 * `.cmd` or `.bat` shim is replaced only by an `.exe` in the same directory; other Windows scripts
 * are unsupported.
 * @param host Host command name.
 * @param plannedExecutable Executable from the approved launch step.
 * @param platform Runtime platform.
 * @param searchPath Executable search path.
 * @param pathExtensions Windows executable extensions.
 * @param fileExists File check used for candidates.
 * @returns The executable, or why it can't be started directly.
 */
export function resolveDirectHostExecutable(
    host: AgentHost,
    plannedExecutable: string | undefined,
    platform: NodeJS.Platform,
    searchPath: string,
    pathExtensions: string,
    fileExists: (filePath: string) => boolean
): HostExecutableResolution {
    const pathApi = platform === "win32" ? path.win32 : path.posix;
    if (plannedExecutable && pathApi.isAbsolute(plannedExecutable)) {
        return fileExists(plannedExecutable)
            ? classifyDirectExecutable(plannedExecutable, platform, fileExists)
            : { status: "notFound" };
    }
    const resolved = resolveCommandFromPath(host, platform, searchPath, pathExtensions, fileExists);
    return resolved
        ? classifyDirectExecutable(resolved, platform, fileExists)
        : { status: "notFound" };
}

function withSearchPath(
    environment: NodeJS.ProcessEnv,
    searchPath: string,
    platform: NodeJS.Platform
): NodeJS.ProcessEnv {
    const nextEnvironment = { ...environment };
    const pathKey = platform === "win32"
        ? Object.keys(environment).find(key => key.toLowerCase() === "path") ?? "Path"
        : "PATH";
    if (platform === "win32") {
        Object.keys(nextEnvironment)
            .filter(key => key.toLowerCase() === "path" && key !== pathKey)
            .forEach(key => delete nextEnvironment[key]);
    }
    nextEnvironment[pathKey] = searchPath;
    return nextEnvironment;
}

/**
 * Executes the approved command plan without a terminal shell.
 *
 * Installers and host setup commands run as child processes with closed standard input, and the
 * final interactive host becomes the integrated terminal's process. This removes the PowerShell 7,
 * Git Bash, and Shell Integration requirements. When a step can't be started directly, the result
 * is `unavailable` so the caller can continue the remaining plan in the terminal executor.
 *
 * @param folderPath Target folder used as the working directory.
 * @param plan Ordered command plan previewed and approved by the user.
 * @param host Selected agent host.
 * @param terminalName Localized terminal name for the interactive host.
 * @param deps Injected side effects.
 * @param initialSetupState Known marketplace and plugin state.
 * @param onProgress Progress callback.
 * @returns The launch, recovery, or direct-unavailable result.
 */
export async function launchAgentHostPlanDirect(
    folderPath: string,
    plan: PlannedCommand[],
    host: AgentHost,
    terminalName: string,
    deps: LaunchAgentHostPlanDirectDependencies,
    initialSetupState: AgentHostSetupState = UNKNOWN_AGENT_HOST_SETUP,
    onProgress?: (progress: LaunchAgentHostProgress) => void
): Promise<DirectLaunchAgentHostPlanResult> {
    const completedCommandKinds: PlannedCommandKind[] = [];
    const skippedCommandKinds: PlannedCommandKind[] = [];
    const setupState = { ...initialSetupState };
    const unavailable = (reason: DirectLaunchUnavailableReason): DirectLaunchAgentHostPlanResult => ({
        status: "unavailable",
        reason,
        completedCommandKinds: [...completedCommandKinds],
        skippedCommandKinds: [...skippedCommandKinds],
        setupState: { ...setupState }
    });
    const commandFailed = (
        command: PlannedCommand,
        exitCode: number | undefined
    ): DirectLaunchAgentHostPlanResult => ({
        status: "recovery",
        reason: "commandFailed",
        failedCommand: command,
        ...(exitCode === undefined ? {} : { exitCode }),
        completedCommandKinds: [...completedCommandKinds],
        skippedCommandKinds: [...skippedCommandKinds],
        setupState: { ...setupState }
    });

    if (
        !plan.some(command => command.kind === "launchHost")
        || plan.some(command => command.kind !== "refreshPath" && !command.args)
        || plan.some(command => command.kind === "installHost" && !command.executable)
    ) {
        return unavailable("planUnsupported");
    }

    const { platform, environment } = deps;
    const currentPath = getEnvironmentValue(environment, "PATH", platform) ?? "";
    const pathExtensions = getEnvironmentValue(environment, "PATHEXT", platform)
        ?? DEFAULT_WINDOWS_PATH_EXTENSIONS;
    const plannedExecutable = plan.find(command => command.kind === "launchHost")?.executable;
    let searchPath = await deps.getSearchPath();
    const resolveHost = (): HostExecutableResolution => resolveDirectHostExecutable(
        host,
        plannedExecutable,
        platform,
        searchPath,
        pathExtensions,
        deps.isLaunchableFile
    );
    let hostResolution = resolveHost();
    const refreshSearchPath = async (): Promise<void> => {
        searchPath = await deps.getSearchPath();
        hostResolution = resolveHost();
    };
    const run = (
        executable: string,
        args: string[],
        timeoutMs: number
    ): Promise<DirectProcessResult> => deps.runProcess(executable, args, {
        cwd: folderPath,
        env: withSearchPath(environment, searchPath, platform),
        timeoutMs
    });

    if (hostResolution.status === "unsupported") {
        return unavailable("hostExecutableUnsupported");
    }
    if (
        hostResolution.status === "notFound"
        && !plan.some(command => command.kind === "installHost")
    ) {
        return unavailable("hostNotFound");
    }

    for (const [index, command] of plan.entries()) {
        const progress = (status: LaunchAgentHostProgress["status"]): void => onProgress?.({
            command,
            step: index + 1,
            totalSteps: plan.length,
            status
        });
        const skipForSetupState = command.runWhenSetupState
            && !command.runWhenSetupState.states.includes(setupState[command.runWhenSetupState.component]);
        // A host that already resolves on the refreshed search path doesn't need reinstalling.
        const skipInstalledHost = command.kind === "installHost" && hostResolution.status === "found";
        if (skipForSetupState || skipInstalledHost) {
            skippedCommandKinds.push(command.kind);
            progress("skipped");
            continue;
        }
        progress("running");

        if (command.kind === "refreshPath") {
            await refreshSearchPath();
            completedCommandKinds.push(command.kind);
            continue;
        }

        if (command.kind === "installHost") {
            const installer = resolveCommandFromPath(
                command.executable as string,
                platform,
                searchPath,
                pathExtensions,
                deps.isSpawnableFile
            );
            if (!installer) {
                return unavailable("installerNotFound");
            }
            let installResult: DirectProcessResult;
            try {
                installResult = await run(installer, command.args as string[], INSTALL_TIMEOUT_MS);
            } catch {
                return unavailable("spawnFailed");
            }
            if (installResult.exitCode !== 0) {
                return commandFailed(command, installResult.exitCode);
            }
            completedCommandKinds.push(command.kind);
            await refreshSearchPath();
            continue;
        }

        if (command.kind === "verifyHost") {
            hostResolution = resolveHost();
        }
        if (hostResolution.status === "unsupported") {
            return unavailable("hostExecutableUnsupported");
        }
        if (hostResolution.status === "notFound") {
            return commandFailed(command, undefined);
        }
        const hostExecutable = hostResolution.executable;
        const args = command.args as string[];

        if (command.kind === "launchHost") {
            let terminal: vscode.Terminal;
            try {
                terminal = deps.createTerminal({
                    name: terminalName,
                    cwd: folderPath,
                    shellPath: hostExecutable,
                    shellArgs: args,
                    isTransient: true,
                    ...(searchPath === currentPath ? {} : { env: { PATH: searchPath } })
                });
                terminal.show();
            } catch {
                return unavailable("spawnFailed");
            }
            completedCommandKinds.push(command.kind);
            return {
                status: "launched",
                completedCommandKinds,
                skippedCommandKinds,
                setupState,
                terminal
            };
        }

        let executionResult: DirectProcessResult;
        try {
            executionResult = await run(hostExecutable, args, HOST_COMMAND_TIMEOUT_MS);
        } catch {
            return unavailable("spawnFailed");
        }

        if (command.setupCheck) {
            setupState[command.setupCheck] = executionResult.exitCode === 0
                ? classifyAgentHostSetupOutput(executionResult.output, command.setupCheck, folderPath)
                : "unknown";
            completedCommandKinds.push(command.kind);
            continue;
        }
        if (executionResult.exitCode !== 0) {
            return commandFailed(command, executionResult.exitCode);
        }
        if (command.kind === "registerMarketplace") {
            setupState.marketplace = "present";
        } else if (command.kind === "installPlugin" || command.kind === "enablePlugin") {
            setupState.plugin = "present";
        }
        completedCommandKinds.push(command.kind);
    }

    return unavailable("planUnsupported");
}

/**
 * Runs the plan directly and continues in the Shell Integration terminal only when direct
 * execution can't start a step. Mutating steps that already completed are never repeated.
 * @param plan Approved command plan.
 * @param setupState Known marketplace and plugin state.
 * @param launchDirect Direct executor.
 * @param launchTerminal Terminal executor used as the fallback.
 * @returns The combined launch or recovery result, labeled with the execution mode used.
 */
export async function launchAgentHostPlanPreferDirect(
    plan: PlannedCommand[],
    setupState: AgentHostSetupState,
    launchDirect: (
        plan: PlannedCommand[],
        setupState: AgentHostSetupState
    ) => Promise<DirectLaunchAgentHostPlanResult>,
    launchTerminal: (
        plan: PlannedCommand[],
        setupState: AgentHostSetupState
    ) => Promise<LaunchAgentHostPlanResult>
): Promise<LaunchAgentHostPlanResult> {
    const directResult = await launchDirect(plan, setupState);
    if (directResult.status !== "unavailable") {
        return { ...directResult, executionMode: "direct" };
    }

    const handledKinds = new Set<PlannedCommandKind>([
        ...directResult.completedCommandKinds.filter(kind => MUTATING_COMMAND_KINDS.includes(kind)),
        ...directResult.skippedCommandKinds.filter(kind => kind === "installHost")
    ]);
    const terminalResult = await launchTerminal(
        handledKinds.size === 0 ? plan : plan.filter(command => !handledKinds.has(command.kind)),
        directResult.setupState
    );
    const merge = (
        directKinds: PlannedCommandKind[],
        terminalKinds: PlannedCommandKind[] | undefined
    ): PlannedCommandKind[] => [...new Set([...directKinds, ...(terminalKinds ?? [])])];
    return {
        ...terminalResult,
        completedCommandKinds: merge(
            directResult.completedCommandKinds,
            terminalResult.completedCommandKinds
        ),
        skippedCommandKinds: merge(
            directResult.skippedCommandKinds,
            terminalResult.skippedCommandKinds
        ),
        setupState: terminalResult.setupState ?? directResult.setupState,
        executionMode: "terminal",
        directFallbackReason: directResult.reason
    };
}
