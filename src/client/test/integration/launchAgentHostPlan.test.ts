/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { PlannedCommand } from "../../uriHandler/utils/agentHostCommandPlan";
import {
    buildAgentHostShellCommand,
    launchAgentHostPlan,
    LaunchAgentHostPlanDependencies
} from "../../uriHandler/utils/launchAgentHostPlan";
import { resolveAgentHostTerminalShell } from "../../uriHandler/utils/agentHostTerminalShell";

describe("launchAgentHostPlan", () => {
    const folderUri = vscode.Uri.file("C:\\sites\\target");
    const plan: PlannedCommand[] = [
        {
            kind: "registerMarketplace",
            commandLine: "marketplace-command",
            description: "register"
        },
        {
            kind: "installPlugin",
            commandLine: "install-command",
            description: "install"
        },
        {
            kind: "launchHost",
            commandLine: "launch-command",
            description: "launch"
        }
    ];

    const buildDependencies = (
        exitCodes: Array<number | undefined> = [0, 0],
        withShellIntegration = true,
        processId: Promise<number | undefined> = Promise.resolve(123),
        shellIntegrationEnabled = true
    ): {
        deps: LaunchAgentHostPlanDependencies;
        createTerminal: sinon.SinonStub;
        executeObservedCommand: sinon.SinonStub;
        executeInteractiveCommand: sinon.SinonStub;
        waitForShellIntegration: sinon.SinonStub;
    } => {
        const terminal = {
            show: sinon.stub(),
            processId
        } as unknown as vscode.Terminal;
        const createTerminal = sinon.stub().returns(terminal);
        const executeInteractiveCommand = sinon.stub().returns({} as vscode.TerminalShellExecution);
        const shellIntegration = {
            executeCommand: executeInteractiveCommand
        } as unknown as vscode.TerminalShellIntegration;
        const executeObservedCommand = sinon.stub();
        exitCodes.forEach((exitCode, index) =>
            executeObservedCommand.onCall(index).resolves({
                exitCode,
                output: ""
            })
        );
        const waitForShellIntegration = sinon.stub().resolves(
            withShellIntegration ? shellIntegration : undefined
        );

        return {
            deps: {
                createTerminal,
                waitForShellIntegration,
                executeCommand: executeObservedCommand,
                isShellIntegrationEnabled: sinon.stub().returns(shellIntegrationEnabled),
                platform: "win32"
            },
            createTerminal,
            executeObservedCommand,
            executeInteractiveCommand,
            waitForShellIntegration
        };
    };

    it("advances only after successful observed commands and starts the final host interactively", async () => {
        const {
            deps,
            createTerminal,
            executeObservedCommand,
            executeInteractiveCommand
        } = buildDependencies();

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps,
            "pwsh"
        );

        expect(result.status).to.equal("launched");
        expect(result.skippedCommandKinds).to.deep.equal([]);
        expect(result.completedCommandKinds).to.deep.equal(
            [
                "registerMarketplace",
                "installPlugin",
                "launchHost"
            ]
        );
        expect(result.setupState).to.deep.equal({
            marketplace: "present",
            plugin: "present"
        });
        if (result.status !== "launched") {
            throw new Error("Expected the plan to launch");
        }
        expect(result.terminal).to.not.be.undefined;
        expect(createTerminal.firstCall.firstArg).to.deep.equal({
            name: "Power Pages Agent: GitHub Copilot CLI",
            cwd: folderUri.fsPath,
            isTransient: true,
            shellPath: "pwsh"
        });
        expect(executeObservedCommand.getCalls().map(call => call.args[2])).to.deep.equal([
            "marketplace-command",
            "install-command"
        ]);
        expect(executeInteractiveCommand.calledOnceWithExactly("launch-command")).to.be.true;
    });

    it("preserves the selected default terminal profile when no bootstrap shell is required", async () => {
        const { deps, createTerminal } = buildDependencies();

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps
        );

        expect(result.status).to.equal("launched");
        expect(createTerminal.firstCall.firstArg).to.deep.equal({
            name: "Power Pages Agent: GitHub Copilot CLI",
            cwd: folderUri.fsPath,
            isTransient: true
        });
    });

    it("opens PowerShell 7 when cmd.exe is the configured Windows default", async () => {
        const { deps, createTerminal } = buildDependencies();
        const terminalShell = resolveAgentHostTerminalShell(
            "cmd.exe",
            "win32",
            command => command === "pwsh"
                ? "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
                : undefined
        );

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps,
            terminalShell.terminalShellPath
        );

        expect(result.status).to.equal("launched");
        expect(createTerminal.firstCall.firstArg).to.deep.equal({
            name: "Power Pages Agent: GitHub Copilot CLI",
            cwd: folderUri.fsPath,
            isTransient: true,
            shellPath: "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
        });
    });

    it("does not wait indefinitely for the terminal process ID", async () => {
        const processId = new Promise<number | undefined>(() => undefined);
        const {
            deps,
            waitForShellIntegration
        } = buildDependencies([0, 0], true, processId);

        const resultPromise = launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps
        );
        const result = await resultPromise;

        expect(result.status).to.equal("launched");
        expect(waitForShellIntegration.calledOnce).to.be.true;
    });

    it("opens no terminal when Shell Integration is disabled", async () => {
        const {
            deps,
            createTerminal,
            executeObservedCommand,
            executeInteractiveCommand
        } = buildDependencies([], true, Promise.resolve(123), false);

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps,
            "pwsh"
        );

        expect(result).to.deep.equal({
            status: "recovery",
            reason: "shellIntegrationDisabled",
            completedCommandKinds: [],
            skippedCommandKinds: [],
            setupState: {
                marketplace: "unknown",
                plugin: "unknown"
            }
        });
        expect(createTerminal.notCalled).to.be.true;
        expect(executeObservedCommand.notCalled).to.be.true;
        expect(executeInteractiveCommand.notCalled).to.be.true;
    });

    it("opens no terminal for a shell without a supported escaping strategy", async () => {
        const {
            deps,
            createTerminal,
            executeObservedCommand,
            executeInteractiveCommand
        } = buildDependencies([]);

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps,
            "cmd.exe"
        );

        expect(result).to.deep.equal({
            status: "recovery",
            reason: "unsupportedShell",
            completedCommandKinds: [],
            skippedCommandKinds: [],
            setupState: {
                marketplace: "unknown",
                plugin: "unknown"
            }
        });
        expect(createTerminal.notCalled).to.be.true;
        expect(executeObservedCommand.notCalled).to.be.true;
        expect(executeInteractiveCommand.notCalled).to.be.true;
    });

    it("opens no terminal for legacy Windows PowerShell without Shell Integration support", async () => {
        const {
            deps,
            createTerminal
        } = buildDependencies([]);

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps,
            "powershell.exe"
        );

        expect(result.status).to.equal("recovery");
        if (result.status !== "recovery") {
            throw new Error("Expected a recovery result");
        }
        expect(result.reason).to.equal("unsupportedShell");
        expect(createTerminal.notCalled).to.be.true;
    });

    it("opens no terminal for a Windows batch-only host installation", async () => {
        const {
            deps,
            createTerminal
        } = buildDependencies([]);
        const batchPlan: PlannedCommand[] = [{
            kind: "launchHost",
            commandLine: "claude prompt",
            executable: "C:\\tools\\claude.cmd",
            args: ["prompt"],
            description: "launch"
        }];

        const result = await launchAgentHostPlan(
            folderUri,
            batchPlan,
            "Claude Code",
            deps,
            "pwsh"
        );

        expect(result.status).to.equal("recovery");
        if (result.status !== "recovery") {
            throw new Error("Expected a recovery result");
        }
        expect(result.reason).to.equal("unsupportedHostExecutable");
        expect(createTerminal.notCalled).to.be.true;
    });

    it("stops after a non-zero exit code", async () => {
        const {
            deps,
            executeObservedCommand,
            executeInteractiveCommand
        } = buildDependencies([0, 1]);

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps
        );

        expect(result).to.deep.equal({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: plan[1],
            exitCode: 1,
            completedCommandKinds: ["registerMarketplace"],
            skippedCommandKinds: [],
            setupState: {
                marketplace: "present",
                plugin: "unknown"
            }
        });
        expect(executeObservedCommand.calledTwice).to.be.true;
        expect(executeInteractiveCommand.notCalled).to.be.true;
    });

    it("runs no commands when Shell Integration is unavailable", async () => {
        const {
            deps,
            executeObservedCommand,
            executeInteractiveCommand
        } = buildDependencies([], false);

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps
        );

        expect(result).to.deep.equal({
            status: "recovery",
            reason: "shellIntegrationUnavailable",
            completedCommandKinds: [],
            skippedCommandKinds: [],
            setupState: {
                marketplace: "unknown",
                plugin: "unknown"
            }
        });
        expect(executeObservedCommand.notCalled).to.be.true;
        expect(executeInteractiveCommand.notCalled).to.be.true;
    });

    it("stops when an observed command ends without an exit code", async () => {
        const {
            deps,
            executeObservedCommand,
            executeInteractiveCommand
        } = buildDependencies([undefined]);

        const result = await launchAgentHostPlan(
            folderUri,
            plan,
            "GitHub Copilot CLI",
            deps
        );

        expect(result).to.deep.equal({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: plan[0],
            exitCode: undefined,
            completedCommandKinds: [],
            skippedCommandKinds: [],
            setupState: {
                marketplace: "unknown",
                plugin: "unknown"
            }
        });
        expect(executeObservedCommand.calledOnce).to.be.true;
        expect(executeInteractiveCommand.notCalled).to.be.true;
    });

    it("uses read-only check output to skip setup that is already present", async () => {
        const conditionalPlan: PlannedCommand[] = [
            {
                kind: "checkMarketplace",
                commandLine: "copilot plugin marketplace list",
                description: "check marketplace",
                setupCheck: "marketplace"
            },
            {
                kind: "checkPlugin",
                commandLine: "copilot plugin list",
                description: "check plugin",
                setupCheck: "plugin"
            },
            {
                kind: "registerMarketplace",
                commandLine: "add marketplace",
                description: "register",
                runWhenSetupState: {
                    component: "marketplace",
                    states: ["missing", "unknown"]
                }
            },
            {
                kind: "enablePlugin",
                commandLine: "enable plugin",
                description: "enable",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["disabled"]
                }
            },
            {
                kind: "installPlugin",
                commandLine: "install plugin",
                description: "install",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["missing", "unknown"]
                }
            },
            {
                kind: "launchHost",
                commandLine: "launch-command",
                description: "launch"
            }
        ];
        const { deps, executeObservedCommand } = buildDependencies();
        executeObservedCommand.onFirstCall().resolves({
            exitCode: 0,
            output: "power-platform-skills"
        });
        executeObservedCommand.onSecondCall().resolves({
            exitCode: 0,
            output: "power-pages@power-platform-skills"
        });
        const progress: string[] = [];

        const result = await launchAgentHostPlan(
            folderUri,
            conditionalPlan,
            "GitHub Copilot CLI",
            deps,
            undefined,
            {
                marketplace: "unknown",
                plugin: "unknown"
            },
            update => progress.push(`${update.command.kind}:${update.status}`)
        );

        expect(result.status).to.equal("launched");
        expect(result.skippedCommandKinds).to.deep.equal([
            "registerMarketplace",
            "enablePlugin",
            "installPlugin"
        ]);
        expect(result.setupState).to.deep.equal({
            marketplace: "present",
            plugin: "present"
        });
        expect(executeObservedCommand.calledTwice).to.be.true;
        expect(progress).to.deep.equal([
            "checkMarketplace:running",
            "checkPlugin:running",
            "registerMarketplace:skipped",
            "enablePlugin:skipped",
            "installPlugin:skipped",
            "launchHost:running"
        ]);
    });

    it("enables a disabled plugin without reinstalling it", async () => {
        const conditionalPlan: PlannedCommand[] = [
            {
                kind: "checkPlugin",
                commandLine: "copilot plugin list",
                description: "check plugin",
                setupCheck: "plugin"
            },
            {
                kind: "installPlugin",
                commandLine: "install plugin",
                description: "install",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["missing", "unknown"]
                }
            },
            {
                kind: "enablePlugin",
                commandLine: "enable plugin",
                description: "enable",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["disabled"]
                }
            },
            {
                kind: "launchHost",
                commandLine: "launch-command",
                description: "launch"
            }
        ];
        const { deps, executeObservedCommand } = buildDependencies();
        executeObservedCommand.onFirstCall().resolves({
            exitCode: 0,
            output: "power-pages@power-platform-skills disabled"
        });
        executeObservedCommand.onSecondCall().resolves({
            exitCode: 0,
            output: ""
        });

        const result = await launchAgentHostPlan(
            folderUri,
            conditionalPlan,
            "GitHub Copilot CLI",
            deps
        );

        expect(result.status).to.equal("launched");
        expect(result.skippedCommandKinds).to.deep.equal(["installPlugin"]);
        expect(executeObservedCommand.getCalls().map(
            call => call.args[2]
        )).to.deep.equal([
            "copilot plugin list",
            "enable plugin"
        ]);
    });

    it("uses Claude JSON inventory commands before conditional setup", async () => {
        const claudePlan: PlannedCommand[] = [
            {
                kind: "checkMarketplace",
                commandLine: "claude plugin marketplace list --json",
                description: "check marketplace",
                setupCheck: "marketplace"
            },
            {
                kind: "checkPlugin",
                commandLine: "claude plugin list --json",
                description: "check plugin",
                setupCheck: "plugin"
            },
            {
                kind: "launchHost",
                commandLine: "launch-command",
                description: "launch"
            }
        ];
        const { deps, executeObservedCommand } = buildDependencies();
        executeObservedCommand.onFirstCall().resolves({
            exitCode: 0,
            output: `${String.fromCharCode(27)}]633;C${String.fromCharCode(7)}${
                JSON.stringify([{ name: "power-platform-skills" }], null, 2)
            }${String.fromCharCode(27)}]633;D;0${String.fromCharCode(7)}`
        });
        executeObservedCommand.onSecondCall().resolves({
            exitCode: 0,
            output: `${String.fromCharCode(27)}]633;C${String.fromCharCode(7)}${
                JSON.stringify([{
                    id: "power-pages@power-platform-skills",
                    scope: "user",
                    enabled: true
                }], null, 2)
            }${String.fromCharCode(27)}]633;D;0${String.fromCharCode(7)}`
        });

        const result = await launchAgentHostPlan(
            folderUri,
            claudePlan,
            "Claude Code",
            deps,
            "pwsh"
        );

        expect(result.status).to.equal("launched");
        expect(executeObservedCommand.getCalls().map(
            call => call.args[2]
        )).to.deep.equal([
            "claude plugin marketplace list --json",
            "claude plugin list --json"
        ]);
        expect(result.setupState).to.deep.equal({
            marketplace: "present",
            plugin: "present"
        });
    });

    it("shell-quotes the maker prompt before terminal execution", async () => {
        const prompt = `/power-pages:create-site Build a portal with 'quotes', \`ticks\`, and $(calc)`;
        const argumentPlan: PlannedCommand[] = [{
            kind: "launchHost",
            commandLine: `copilot -i ${JSON.stringify(prompt)}`,
            executable: "copilot",
            args: ["-i", prompt],
            description: "start"
        }];
        const {
            deps,
            executeInteractiveCommand
        } = buildDependencies([]);

        const result = await launchAgentHostPlan(
            folderUri,
            argumentPlan,
            "GitHub Copilot CLI",
            deps,
            "bash"
        );

        expect(result.status).to.equal("launched");
        expect(executeInteractiveCommand.calledOnceWithExactly(
            `copilot '-i' '/power-pages:create-site Build a portal with '"'"'quotes'"'"', \`ticks\`, and $(calc)'`
        )).to.be.true;
    });

    it("quotes untrusted prompts for PowerShell without interpolation", () => {
        const prompt = `/power-pages:create-site A donor's site with $(calc) and \`ticks\``;

        expect(buildAgentHostShellCommand(
            "copilot",
            ["-i", prompt],
            "pwsh.exe"
        )).to.equal(
            `copilot '-i' '/power-pages:create-site A donor''s site with $(calc) and \`ticks\`'`
        );
    });

    it("quotes an absolute Windows executable path for PowerShell", () => {
        expect(buildAgentHostShellCommand(
            "C:\\Program Files\\Agent Host\\copilot.cmd",
            ["-i", "/power-pages:create-site test"],
            "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
            "win32"
        )).to.equal(
            "& 'C:\\Program Files\\Agent Host\\copilot.cmd' '-i' '/power-pages:create-site test'"
        );
    });

    it("rejects terminal shells without a supported escaping strategy", () => {
        expect(() => buildAgentHostShellCommand(
            "copilot",
            ["-i", "/power-pages:create-site test"],
            "cmd.exe"
        )).to.throw("Unsupported terminal shell: cmd.exe");
    });
});
