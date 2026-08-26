/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { PlannedCommand } from "../../uriHandler/utils/agentHostCommandPlan";
import {
    launchAgentHostPlan,
    LaunchAgentHostPlanDependencies
} from "../../uriHandler/utils/launchAgentHostPlan";

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
        withShellIntegration = true
    ): {
        deps: LaunchAgentHostPlanDependencies;
        createTerminal: sinon.SinonStub;
        executeObservedCommand: sinon.SinonStub;
        executeInteractiveCommand: sinon.SinonStub;
    } => {
        const terminal = {
            show: sinon.stub()
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

        return {
            deps: {
                createTerminal,
                waitForShellIntegration: sinon.stub().resolves(
                    withShellIntegration ? shellIntegration : undefined
                ),
                executeCommand: executeObservedCommand
            },
            createTerminal,
            executeObservedCommand,
            executeInteractiveCommand
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
});
