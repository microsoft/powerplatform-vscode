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
            executeObservedCommand.onCall(index).resolves(exitCode)
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

        expect(result).to.deep.equal({ status: "launched" });
        expect(createTerminal.firstCall.firstArg).to.deep.equal({
            name: "Power Pages Agent: GitHub Copilot CLI",
            cwd: folderUri.fsPath,
            isTransient: true,
            shellPath: "pwsh"
        });
        expect(executeObservedCommand.getCalls().map(call => call.args[1])).to.deep.equal([
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
            exitCode: 1
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
            reason: "shellIntegrationUnavailable"
        });
        expect(executeObservedCommand.notCalled).to.be.true;
        expect(executeInteractiveCommand.notCalled).to.be.true;
    });
});
