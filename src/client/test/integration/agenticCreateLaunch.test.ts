/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { CreateFlowParameters } from "../../uriHandler/handlers/createFlowParams";
import * as telemetry from "../../uriHandler/telemetry/createFlowTelemetry";
import * as panel from "../../uriHandler/utils/agenticCreateConfirmPanel";
import * as probe from "../../uriHandler/utils/agentHostCommandProbe";
import * as setup from "../../uriHandler/utils/agentHostSetupPrecheck";
import * as shell from "../../uriHandler/utils/agentHostTerminalShell";
import * as launcher from "../../uriHandler/utils/launchAgentHostPlan";
import {
    confirmAndLaunchSelectedAgentHost,
    getAgentHostTerminalShellOptions
} from "../../uriHandler/utils/agenticCreateLaunch";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";

const describeWindows = process.platform === "win32" ? describe : describe.skip;

describeWindows("agenticCreateLaunch shell selection", () => {
    const folder = vscode.Uri.file("C:\\sites\\target");
    const params: CreateFlowParameters = {
        environmentId: null, orgUrl: null, region: null, tenantId: null,
        websiteId: null, source: null, agentHost: null, version: null, correlationId: null
    };
    let sandbox: sinon.SinonSandbox;
    let resolveShell: sinon.SinonStub;
    let showPanel: sinon.SinonStub;
    let launch: sinon.SinonStub;
    let updatePlan: sinon.SinonStub;
    let showRecovery: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(telemetry, "emitCreateFlowEvent");
        sandbox.stub(vscode.workspace, "getConfiguration").returns({
            inspect: (key: string) => {
                if (key === "profiles.windows") {
                    return {
                        globalValue: {
                            Other: { path: ["D:\\missing\\pwsh.exe", "D:\\Tools\\pwsh.exe"] },
                            Preferred: { path: "D:\\Git\\bin\\bash.exe" },
                            Disabled: null,
                            SourceOnly: { source: "PowerShell" }
                        },
                        workspaceValue: { Malicious: { path: "C:\\sites\\target\\pwsh.exe" } },
                        workspaceFolderValue: { Malicious: { path: "C:\\sites\\target\\nested\\pwsh.exe" } }
                    };
                }
                return key === "defaultProfile.windows"
                    ? { globalValue: "Preferred", workspaceValue: "Other", workspaceFolderValue: "Malicious" }
                    : undefined;
            }
        } as unknown as vscode.WorkspaceConfiguration);
        sandbox.stub(vscode.window, "withProgress").callsFake(async (_, task) =>
            task({ report: () => undefined }, {
                isCancellationRequested: false,
                onCancellationRequested: () => new vscode.Disposable(() => undefined)
            }));
        sandbox.stub(setup, "detectAgentHostSetup").resolves({
            marketplace: "present", plugin: "present"
        });
        sandbox.stub(probe, "resolveCommandFromPath").returns("C:\\Agent\\copilot.exe");
        resolveShell = sandbox.stub(shell, "resolveAgentHostTerminalShell");
        updatePlan = sandbox.stub();
        showRecovery = sandbox.stub().resolves("retry");
        showPanel = sandbox.stub(panel, "showAgenticCreateConfirmPanel").returns({
            decision: Promise.resolve("start"),
            showProgress: sandbox.stub().resolves(true),
            showLaunched: sandbox.stub().resolves(true),
            showRecovery,
            updatePlan
        });
        launch = sandbox.stub(launcher, "launchAgentHostPlan").resolves({ status: "launched" });
    });

    afterEach(() => sandbox.restore());

    it("collects only user profile paths with the user default first, ignoring workspace overrides", () => {
        expect(getAgentHostTerminalShellOptions(folder)).to.deep.equal({
            profilePaths: [
                "D:\\Git\\bin\\bash.exe",
                "D:\\missing\\pwsh.exe",
                "D:\\Tools\\pwsh.exe",
                "D:\\Git\\bin\\bash.exe"
            ]
        });
        expect((vscode.workspace.getConfiguration as sinon.SinonStub).calledWith(
            "terminal.integrated", folder
        )).to.be.true;
    });

    it("ignores a workspace-supplied pwsh executable even when there are no user profiles", async () => {
        (vscode.workspace.getConfiguration as sinon.SinonStub).returns({
            inspect: (key: string) => ({
                workspaceValue: key === "profiles.windows"
                    ? { Workspace: { path: "C:\\sites\\target\\pwsh.exe" } }
                    : "Workspace",
                workspaceFolderValue: key === "profiles.windows"
                    ? { Folder: { path: "C:\\sites\\target\\nested\\pwsh.exe" } }
                    : "Folder"
            })
        });
        resolveShell.returns({ commandShellPath: "", terminalShellPath: "" });
        await confirmAndLaunchSelectedAgentHost(AgentHost.Copilot, folder, params);

        expect(getAgentHostTerminalShellOptions(folder)).to.deep.equal({ profilePaths: [] });
        expect(resolveShell.firstCall.args[3]).to.deep.equal({ profilePaths: [] });
        expect(showPanel.firstCall.args[9]).to.equal("");
        expect(launch.firstCall.args[4]).to.equal("");
    });

    for (const selectedShell of [
        "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
        "C:\\Program Files\\Git\\bin\\bash.exe",
        "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
        ""
    ]) {
        it(`passes identical preview, manual and executor shell paths: ${selectedShell || "unavailable"}`, async () => {
            resolveShell.returns({
                commandShellPath: selectedShell, terminalShellPath: selectedShell
            });
            await confirmAndLaunchSelectedAgentHost(
                AgentHost.Copilot, folder, params, "Copilot", true, undefined,
                "Maker's site $(echo unsafe)"
            );
            const plan = showPanel.firstCall.args[2];
            expect(showPanel.firstCall.args[9]).to.equal(selectedShell);
            expect(launch.firstCall.args[4]).to.equal(selectedShell);
            expect(launch.firstCall.args[1]).to.equal(plan);
            expect(resolveShell.firstCall.args[3]).to.deep.equal(getAgentHostTerminalShellOptions(folder));
            if (selectedShell) {
                expect(plan[0].commandLine).to.equal(launcher.buildAgentHostShellCommand(
                    plan[0].executable, plan[0].args, selectedShell
                ));
            } else {
                expect(plan[0].commandLine).to.equal("");
            }
        });
    }

    it("refreshes the panel manual shell when a retry discovers a new executor", async () => {
        const oldShell = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
        const newShell = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
        resolveShell.returns({ commandShellPath: oldShell, terminalShellPath: oldShell });
        launch.onFirstCall().callsFake(async () => {
            resolveShell.returns({ commandShellPath: newShell, terminalShellPath: newShell });
            return { status: "recovery", reason: "unsupportedShell" };
        });
        await confirmAndLaunchSelectedAgentHost(AgentHost.Copilot, folder, params);
        expect(updatePlan.lastCall.args[1]).to.equal(newShell);
        expect(launch.secondCall.args[4]).to.equal(newShell);
    });

    it("keeps the validated bootstrap PowerShell for preview and execution", async () => {
        const bootstrapShell = "D:\\PowerShell\\pwsh.exe";
        await confirmAndLaunchSelectedAgentHost(
            AgentHost.Copilot, folder, params, "Copilot", true,
            { platform: "win32", installer: "winget", shellPath: bootstrapShell }
        );
        expect(resolveShell.notCalled).to.be.true;
        expect(showPanel.firstCall.args[9]).to.equal(bootstrapShell);
        expect(launch.firstCall.args[4]).to.equal(bootstrapShell);
        expect(launch.firstCall.args[1][1].commandLine).to.contain("$env:Path");
    });
});
