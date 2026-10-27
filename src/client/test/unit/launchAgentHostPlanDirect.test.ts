/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import type * as vscode from "vscode";
import {
    AgentHostCommandPlanStrings,
    buildAgentHostCommandPlan,
    PlannedCommand
} from "../../uriHandler/utils/agentHostCommandPlan";
import {
    AgentHostSetupState,
    UNKNOWN_AGENT_HOST_SETUP
} from "../../uriHandler/utils/agentHostSetupPrecheck";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";
import type { LaunchAgentHostPlanResult } from "../../uriHandler/utils/launchAgentHostPlan";
import {
    DirectProcessResult,
    launchAgentHostPlanDirect,
    LaunchAgentHostPlanDirectDependencies,
    launchAgentHostPlanPreferDirect,
    runDirectProcess
} from "../../uriHandler/utils/launchAgentHostPlanDirect";

const strings: AgentHostCommandPlanStrings = {
    installHost: "install {0}",
    refreshPath: "refresh path",
    verifyHost: "verify {0}",
    checkMarketplace: "check marketplace",
    checkPlugin: "check plugin",
    registerMarketplace: "register",
    installPlugin: "install",
    installPluginUserScope: "install user scope",
    enablePlugin: "enable plugin",
    launchHost: "start {0}"
};
const PROMPT = "/power-pages:create-site A portal";
const MARKETPLACE_PRESENT = "power-platform-skills │ microsoft/power-platform-skills";
const PLUGIN_MISSING = "No plugins installed";

interface FakeHarness {
    deps: LaunchAgentHostPlanDirectDependencies;
    addFile: (filePath: string) => void;
    runProcess: sinon.SinonStub;
    createTerminal: sinon.SinonStub;
    terminal: { show: sinon.SinonSpy };
    setSearchPath: (value: string) => void;
}

function createHarness(
    platform: NodeJS.Platform,
    environmentPath: string,
    files: string[],
    aliases: string[] = []
): FakeHarness {
    const normalize = (filePath: string): string =>
        platform === "win32" ? filePath.toLowerCase() : filePath;
    const fileSet = new Set(files.map(normalize));
    const aliasSet = new Set(aliases.map(normalize));
    let searchPath = environmentPath;
    const terminal = { show: sinon.spy() };
    const runProcess = sinon.stub().resolves({ exitCode: 0, output: "" } as DirectProcessResult);
    const createTerminal = sinon.stub().returns(terminal);
    return {
        addFile: filePath => fileSet.add(normalize(filePath)),
        runProcess,
        createTerminal,
        terminal,
        setSearchPath: value => {
            searchPath = value;
        },
        deps: {
            platform,
            environment: platform === "win32"
                ? { Path: environmentPath, PATHEXT: ".COM;.EXE;.BAT;.CMD" }
                : { PATH: environmentPath },
            getSearchPath: () => Promise.resolve(searchPath),
            isLaunchableFile: candidate => fileSet.has(normalize(candidate)),
            isSpawnableFile: candidate => fileSet.has(normalize(candidate)) || aliasSet.has(normalize(candidate)),
            runProcess,
            createTerminal: createTerminal as unknown as (options: vscode.TerminalOptions) => vscode.Terminal
        }
    };
}

function buildInstalledPlan(
    platform: NodeJS.Platform,
    hostExecutable: string,
    setupState: AgentHostSetupState = UNKNOWN_AGENT_HOST_SETUP
): PlannedCommand[] {
    return buildAgentHostCommandPlan(
        AgentHost.Copilot,
        "Copilot",
        strings,
        undefined,
        setupState,
        "A portal",
        platform === "win32" ? "C:\\Program Files\\PowerShell\\7\\pwsh.exe" : "/bin/bash",
        hostExecutable,
        platform
    );
}

function buildBootstrapPlan(): PlannedCommand[] {
    return buildAgentHostCommandPlan(
        AgentHost.Copilot,
        "Copilot",
        strings,
        { platform: "win32", installer: "winget", shellPath: "powershell.exe" },
        UNKNOWN_AGENT_HOST_SETUP,
        "A portal",
        "powershell.exe",
        AgentHost.Copilot,
        "win32"
    );
}

describe("launchAgentHostPlanDirect", () => {
    it("runs setup without a shell and starts the host as the terminal process", async () => {
        const host = "/usr/local/bin/copilot";
        const harness = createHarness("linux", "/usr/bin:/usr/local/bin", [host]);
        harness.runProcess.callsFake((_executable: string, args: string[]) => Promise.resolve(
            args.join(" ") === "plugin marketplace list"
                ? { exitCode: 0, output: MARKETPLACE_PRESENT }
                : args.join(" ") === "plugin list"
                    ? { exitCode: 0, output: PLUGIN_MISSING }
                    : { exitCode: 0, output: "" }
        ));
        const progress: string[] = [];

        const result = await launchAgentHostPlanDirect(
            "/work/site",
            buildInstalledPlan("linux", host),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps,
            UNKNOWN_AGENT_HOST_SETUP,
            update => progress.push(`${update.command.kind}:${update.status}`)
        );

        expect(harness.runProcess.getCalls().map(call => [call.args[0], call.args[1]])).to.deep.equal([
            [host, ["plugin", "marketplace", "list"]],
            [host, ["plugin", "list"]],
            [host, ["plugin", "install", "power-pages@power-platform-skills"]]
        ]);
        expect(harness.runProcess.firstCall.args[2]).to.include({ cwd: "/work/site" });
        expect(harness.runProcess.firstCall.args[2].env.PATH).to.equal("/usr/bin:/usr/local/bin");
        expect(harness.createTerminal.calledOnceWithExactly({
            name: "Copilot terminal",
            cwd: "/work/site",
            shellPath: host,
            shellArgs: ["-i", PROMPT],
            isTransient: true
        })).to.be.true;
        expect(harness.terminal.show.calledOnce).to.be.true;
        expect(progress).to.deep.equal([
            "checkMarketplace:running",
            "checkPlugin:running",
            "registerMarketplace:skipped",
            "installPlugin:running",
            "enablePlugin:skipped",
            "launchHost:running"
        ]);
        expect(result).to.deep.include({
            status: "launched",
            completedCommandKinds: ["checkMarketplace", "checkPlugin", "installPlugin", "launchHost"],
            skippedCommandKinds: ["registerMarketplace", "enablePlugin"],
            setupState: { marketplace: "present", plugin: "present" }
        });
    });

    it("installs a missing host with winget and launches it from the refreshed search path", async () => {
        const windowsApps = "C:\\Users\\maker\\AppData\\Local\\Microsoft\\WindowsApps";
        const wingetLinks = "C:\\Users\\maker\\AppData\\Local\\Microsoft\\WinGet\\Links";
        const winget = `${windowsApps}\\winget.EXE`;
        const copilot = `${wingetLinks}\\copilot.EXE`;
        const harness = createHarness("win32", `C:\\Windows;${windowsApps}`, [], [winget]);
        harness.runProcess.callsFake((executable: string) => {
            if (executable === winget) {
                harness.addFile(copilot);
                harness.setSearchPath(`C:\\Windows;${windowsApps};${wingetLinks}`);
            }
            return Promise.resolve({ exitCode: 0, output: "" });
        });

        const result = await launchAgentHostPlanDirect(
            "C:\\work\\site",
            buildBootstrapPlan(),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        );

        expect(harness.runProcess.firstCall.args.slice(0, 2)).to.deep.equal([
            winget,
            ["install", "--id", "GitHub.Copilot", "--exact", "--accept-package-agreements", "--accept-source-agreements"]
        ]);
        expect(harness.runProcess.secondCall.args.slice(0, 2)).to.deep.equal([copilot, ["--version"]]);
        expect(harness.runProcess.secondCall.args[2].env).to.deep.equal({
            Path: `C:\\Windows;${windowsApps};${wingetLinks}`,
            PATHEXT: ".COM;.EXE;.BAT;.CMD"
        });
        expect(harness.createTerminal.firstCall.args[0]).to.deep.include({
            shellPath: copilot,
            shellArgs: ["-i", PROMPT],
            env: { PATH: `C:\\Windows;${windowsApps};${wingetLinks}` }
        });
        expect(result.status).to.equal("launched");
        expect(result.completedCommandKinds).to.include.members(["installHost", "refreshPath", "verifyHost"]);
    });

    it("skips reinstalling a host that resolves only on the persisted search path", async () => {
        const wingetLinks = "C:\\Users\\maker\\AppData\\Local\\Microsoft\\WinGet\\Links";
        const copilot = `${wingetLinks}\\copilot.EXE`;
        const harness = createHarness("win32", "C:\\Windows", [copilot]);
        harness.setSearchPath(`C:\\Windows;${wingetLinks}`);

        const result = await launchAgentHostPlanDirect(
            "C:\\work\\site",
            buildBootstrapPlan(),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        );

        expect(harness.runProcess.getCalls().every(call => call.args[0] === copilot)).to.be.true;
        expect(result.status).to.equal("launched");
        expect(result.skippedCommandKinds).to.include("installHost");
    });

    it("uses an executable next to an approved Windows command shim", async () => {
        const directory = "C:\\Agent";
        const harness = createHarness("win32", "C:\\Windows", [`${directory}\\copilot.cmd`, `${directory}\\copilot.exe`]);

        await launchAgentHostPlanDirect(
            "C:\\work\\site",
            buildInstalledPlan("win32", `${directory}\\copilot.cmd`, { marketplace: "present", plugin: "present" }),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        );

        expect(harness.createTerminal.firstCall.args[0].shellPath).to.equal(`${directory}\\copilot.exe`);
    });

    it("hands Windows script shims to the terminal executor", async () => {
        const shim = "C:\\npm\\copilot.cmd";
        const harness = createHarness("win32", "C:\\npm", [shim, "C:\\npm\\copilot.ps1"]);

        const fromPath = await launchAgentHostPlanDirect(
            "C:\\work\\site",
            buildInstalledPlan("win32", AgentHost.Copilot),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        );
        const fromPreview = await launchAgentHostPlanDirect(
            "C:\\work\\site",
            buildInstalledPlan("win32", "C:\\npm\\copilot.ps1"),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        );

        expect(fromPath).to.deep.include({ status: "unavailable", reason: "hostExecutableUnsupported" });
        expect(fromPreview).to.deep.include({ status: "unavailable", reason: "hostExecutableUnsupported" });
        expect(harness.runProcess.called).to.be.false;
    });

    it("reports a missing host or installer as unavailable before running anything", async () => {
        const harness = createHarness("win32", "C:\\Windows", []);

        expect(await launchAgentHostPlanDirect(
            "C:\\work\\site",
            buildInstalledPlan("win32", AgentHost.Copilot),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        )).to.deep.include({ status: "unavailable", reason: "hostNotFound" });
        expect(await launchAgentHostPlanDirect(
            "C:\\work\\site",
            buildBootstrapPlan(),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        )).to.deep.include({ status: "unavailable", reason: "installerNotFound" });
        expect(harness.runProcess.called).to.be.false;
    });

    it("reports plans without structured commands as unsupported", async () => {
        const harness = createHarness("linux", "/usr/bin", ["/usr/bin/copilot"]);
        const plan = buildInstalledPlan("linux", "/usr/bin/copilot")
            .map(command => command.kind === "checkPlugin" ? { ...command, args: undefined } : command);

        expect(await launchAgentHostPlanDirect(
            "/work/site",
            plan,
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        )).to.deep.include({ status: "unavailable", reason: "planUnsupported" });
    });

    it("returns command recovery with the exit code when a setup command fails", async () => {
        const host = "/usr/bin/copilot";
        const harness = createHarness("linux", "/usr/bin", [host]);
        harness.runProcess.callsFake((_executable: string, args: string[]) => Promise.resolve(
            args[1] === "install"
                ? { exitCode: 2, output: "failed" }
                : { exitCode: 0, output: args[1] === "marketplace" ? MARKETPLACE_PRESENT : PLUGIN_MISSING }
        ));

        const result = await launchAgentHostPlanDirect(
            "/work/site",
            buildInstalledPlan("linux", host),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        );

        expect(result).to.deep.include({
            status: "recovery",
            reason: "commandFailed",
            exitCode: 2,
            completedCommandKinds: ["checkMarketplace", "checkPlugin"],
            skippedCommandKinds: ["registerMarketplace"]
        });
        expect((result as { failedCommand?: PlannedCommand }).failedCommand?.kind).to.equal("installPlugin");
        expect(harness.createTerminal.called).to.be.false;
    });

    it("treats a failed inventory command as unknown so setup still runs", async () => {
        const host = "/usr/bin/copilot";
        const harness = createHarness("linux", "/usr/bin", [host]);
        harness.runProcess.callsFake((_executable: string, args: string[]) => Promise.resolve(
            args.join(" ") === "plugin marketplace list"
                ? { exitCode: 1, output: MARKETPLACE_PRESENT }
                : { exitCode: 0, output: PLUGIN_MISSING }
        ));

        const result = await launchAgentHostPlanDirect(
            "/work/site",
            buildInstalledPlan("linux", host),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        );

        expect(harness.runProcess.getCalls().map(call => call.args[1].join(" "))).to.include(
            "plugin marketplace add microsoft/power-platform-skills"
        );
        expect(result.completedCommandKinds).to.include("registerMarketplace");
    });

    it("reports spawn failures as unavailable with the steps already completed", async () => {
        const host = "/usr/bin/copilot";
        const harness = createHarness("linux", "/usr/bin", [host]);
        harness.runProcess.onFirstCall().resolves({ exitCode: 0, output: MARKETPLACE_PRESENT });
        harness.runProcess.onSecondCall().rejects(new Error("EACCES"));

        expect(await launchAgentHostPlanDirect(
            "/work/site",
            buildInstalledPlan("linux", host),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        )).to.deep.equal({
            status: "unavailable",
            reason: "spawnFailed",
            completedCommandKinds: ["checkMarketplace"],
            skippedCommandKinds: [],
            setupState: { marketplace: "present", plugin: "unknown" }
        });
    });

    it("reports terminal creation failures as unavailable", async () => {
        const host = "/usr/bin/copilot";
        const harness = createHarness("linux", "/usr/bin", [host]);
        harness.createTerminal.throws(new Error("cannot start"));

        expect(await launchAgentHostPlanDirect(
            "/work/site",
            buildInstalledPlan("linux", host, { marketplace: "present", plugin: "present" }),
            AgentHost.Copilot,
            "Copilot terminal",
            harness.deps
        )).to.deep.include({ status: "unavailable", reason: "spawnFailed" });
    });
});

describe("launchAgentHostPlanPreferDirect", () => {
    const plan = buildBootstrapPlan();

    it("returns a direct launch without starting the terminal executor", async () => {
        const launchTerminal = sinon.stub();

        const result = await launchAgentHostPlanPreferDirect(
            plan,
            UNKNOWN_AGENT_HOST_SETUP,
            () => Promise.resolve({ status: "launched", completedCommandKinds: ["launchHost"] }),
            launchTerminal
        );

        expect(result).to.deep.equal({
            status: "launched",
            completedCommandKinds: ["launchHost"],
            executionMode: "direct"
        });
        expect(launchTerminal.called).to.be.false;
    });

    it("continues in the terminal without repeating completed setup", async () => {
        const directSetupState: AgentHostSetupState = { marketplace: "present", plugin: "unknown" };
        const launchTerminal = sinon.stub().resolves({
            status: "launched",
            completedCommandKinds: ["refreshPath", "verifyHost", "checkMarketplace", "launchHost"],
            skippedCommandKinds: ["enablePlugin"],
            setupState: { marketplace: "present", plugin: "present" }
        } satisfies LaunchAgentHostPlanResult);

        const result = await launchAgentHostPlanPreferDirect(
            plan,
            UNKNOWN_AGENT_HOST_SETUP,
            () => Promise.resolve({
                status: "unavailable",
                reason: "hostExecutableUnsupported",
                completedCommandKinds: ["installHost", "refreshPath", "checkMarketplace", "registerMarketplace"],
                skippedCommandKinds: [],
                setupState: directSetupState
            }),
            launchTerminal
        );

        expect(launchTerminal.firstCall.args[0].map((command: PlannedCommand) => command.kind)).to.deep.equal([
            "refreshPath",
            "verifyHost",
            "checkMarketplace",
            "checkPlugin",
            "installPlugin",
            "enablePlugin",
            "launchHost"
        ]);
        expect(launchTerminal.firstCall.args[1]).to.equal(directSetupState);
        expect(result).to.deep.equal({
            status: "launched",
            completedCommandKinds: [
                "installHost",
                "refreshPath",
                "checkMarketplace",
                "registerMarketplace",
                "verifyHost",
                "launchHost"
            ],
            skippedCommandKinds: ["enablePlugin"],
            setupState: { marketplace: "present", plugin: "present" },
            executionMode: "terminal",
            directFallbackReason: "hostExecutableUnsupported"
        });
    });

    it("does not install a host that direct execution already found", async () => {
        const launchTerminal = sinon.stub().resolves({
            status: "recovery",
            reason: "unsupportedShell"
        } satisfies LaunchAgentHostPlanResult);

        const result = await launchAgentHostPlanPreferDirect(
            plan,
            UNKNOWN_AGENT_HOST_SETUP,
            () => Promise.resolve({
                status: "unavailable",
                reason: "spawnFailed",
                completedCommandKinds: [],
                skippedCommandKinds: ["installHost"],
                setupState: UNKNOWN_AGENT_HOST_SETUP
            }),
            launchTerminal
        );

        expect(launchTerminal.firstCall.args[0].some((command: PlannedCommand) => command.kind === "installHost"))
            .to.be.false;
        expect(result).to.deep.include({
            status: "recovery",
            reason: "unsupportedShell",
            skippedCommandKinds: ["installHost"],
            setupState: UNKNOWN_AGENT_HOST_SETUP,
            executionMode: "terminal",
            directFallbackReason: "spawnFailed"
        });
    });
});

describe("runDirectProcess", () => {
    it("captures output from a process with closed standard input", async () => {
        const result = await runDirectProcess(
            process.execPath,
            [
                "-e",
                "process.stdin.resume(); process.stdin.on('end', () => { process.stdout.write('out'); process.stderr.write('err'); process.exit(3); });"
            ],
            { cwd: process.cwd(), env: process.env, timeoutMs: 10000 }
        );

        expect(result.exitCode).to.equal(3);
        expect(result.output).to.contain("out").and.to.contain("err");
    });

    it("stops a process that exceeds its timeout", async () => {
        const result = await runDirectProcess(
            process.execPath,
            ["-e", "setTimeout(() => undefined, 30000);"],
            { cwd: process.cwd(), env: process.env, timeoutMs: 200 }
        );

        expect(result.exitCode).to.equal(undefined);
    });

    it("rejects when the executable cannot be started", async () => {
        let error: unknown;
        try {
            await runDirectProcess(
                `${process.execPath}-missing`,
                [],
                { cwd: process.cwd(), env: process.env, timeoutMs: 1000 }
            );
        } catch (caught) {
            error = caught;
        }

        expect(error).to.be.instanceOf(Error);
    });
});
