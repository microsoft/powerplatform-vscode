/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import type * as vscode from "vscode";
import {
    confirmAndLaunchAgentHost,
    ConfirmAndLaunchDependencies
} from "../../uriHandler/utils/confirmAndLaunchAgentHost";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";
import { PlannedCommand } from "../../uriHandler/utils/agentHostCommandPlan";
import { ConfirmDecision } from "../../uriHandler/utils/agenticCreateConfirmPanel";
import type { CreateFlowParameters } from "../../uriHandler/handlers/createFlowParams";
import { uriHandlerTelemetryEventNames } from "../../uriHandler/telemetry/uriHandlerTelemetryEvents";

describe("confirmAndLaunchAgentHost", () => {
    const folderUri = { fsPath: "c:/work/site" } as unknown as vscode.Uri;
    const params = {} as CreateFlowParameters;
    const plan: PlannedCommand[] = [
        { kind: "registerMarketplace", commandLine: "step-1", description: "one" },
        { kind: "launchHost", commandLine: "step-2", description: "two" }
    ];

    const buildDeps = (
        decision: ConfirmDecision
    ): {
        deps: ConfirmAndLaunchDependencies;
        buildPlan: sinon.SinonStub;
        showConfirmPanel: sinon.SinonStub;
        showRecovery: sinon.SinonStub;
        showProgress: sinon.SinonStub;
        showLaunched: sinon.SinonStub;
        launchPlan: sinon.SinonStub;
        emitEvent: sinon.SinonStub;
    } => {
        const buildPlan = sinon.stub().returns(plan);
        const showRecovery = sinon.stub().resolves("fallback");
        const showProgress = sinon.stub().resolves(true);
        const showLaunched = sinon.stub().resolves(true);
        const showConfirmPanel = sinon.stub().returns({
            decision: Promise.resolve(decision),
            showRecovery,
            showProgress,
            showLaunched
        });
        const launchPlan = sinon.stub().resolves({ status: "launched" });
        const emitEvent = sinon.stub().resolves();
        return {
            deps: { buildPlan, showConfirmPanel, launchPlan, emitEvent },
            buildPlan,
            showConfirmPanel,
            showRecovery,
            showProgress,
            showLaunched,
            launchPlan,
            emitEvent
        };
    };

    it("launches the plan and emits launch telemetry when the user starts", async () => {
        const { deps, buildPlan, showConfirmPanel, launchPlan, emitEvent } = buildDeps("start");

        const outcome = await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        expect(outcome).to.deep.equal({ status: "launched" });
        expect(buildPlan.calledOnceWithExactly(AgentHost.Copilot, "GitHub Copilot CLI")).to.be.true;
        expect(showConfirmPanel.calledOnceWithExactly("GitHub Copilot CLI", "c:/work/site", plan)).to
            .be.true;
        expect(launchPlan.calledOnce).to.be.true;
        expect(launchPlan.firstCall.args.slice(0, 3)).to.deep.equal([
            folderUri,
            plan,
            "GitHub Copilot CLI"
        ]);
        expect(launchPlan.firstCall.args[3]).to.be.a("function");
        expect(emitEvent.callCount).to.equal(4);
        expect(emitEvent.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_CONFIRM_ACTION_CLICKED
        );
        expect(emitEvent.firstCall.args[3]).to.deep.equal({
            host: AgentHost.Copilot,
            action: "start"
        });
        expect(emitEvent.secondCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_PLUGIN_SEQUENCE_LAUNCHED
        );
        expect(emitEvent.secondCall.args[3]).to.deep.equal({ host: AgentHost.Copilot });
        expect(emitEvent.thirdCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_SAMPLE_PROMPT_SENT
        );
        expect(emitEvent.getCall(3).args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HANDOFF_COMPLETED
        );
        expect(emitEvent.getCall(3).args[3]).to.deep.equal({
            host: AgentHost.Copilot,
            bootstrapUsed: "false",
            marketplaceSetupSkipped: "false",
            pluginSetupSkipped: "false"
        });
    });

    it("drops the flow with confirmCancelled and does not launch when cancelled", async () => {
        const { deps, launchPlan, emitEvent } = buildDeps("cancel");

        const outcome = await confirmAndLaunchAgentHost(
            AgentHost.Claude,
            "Claude Code",
            folderUri,
            params,
            deps
        );

        expect(outcome).to.deep.equal({ status: "dropped" });
        expect(launchPlan.notCalled).to.be.true;
        expect(emitEvent.callCount).to.equal(2);
        expect(emitEvent.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_CONFIRM_ACTION_CLICKED
        );
        expect(emitEvent.firstCall.args[3]).to.deep.equal({
            host: AgentHost.Claude,
            action: "cancel"
        });
        expect(emitEvent.secondCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(emitEvent.secondCall.args[3]).to.deep.equal({ reason: "confirmCancelled" });
    });

    it("drops the flow with confirmDismissed when the panel is dismissed", async () => {
        const { deps, launchPlan, emitEvent } = buildDeps("dismissed");

        const outcome = await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        expect(outcome).to.deep.equal({ status: "dropped" });
        expect(launchPlan.notCalled).to.be.true;
        expect(emitEvent.calledOnce).to.be.true;
        expect(emitEvent.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(emitEvent.firstCall.args[3]).to.deep.equal({ reason: "confirmDismissed" });
    });

    it("returns to selection without launching or emitting drop telemetry when editing", async () => {
        const { deps, launchPlan, emitEvent } = buildDeps("edit");

        const outcome = await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        expect(outcome).to.deep.equal({ status: "edit" });
        expect(launchPlan.notCalled).to.be.true;
        expect(emitEvent.calledOnce).to.be.true;
        expect(emitEvent.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_CONFIRM_ACTION_CLICKED
        );
        expect(emitEvent.firstCall.args[3]).to.deep.equal({
            host: AgentHost.Copilot,
            action: "edit"
        });
    });

    it("returns recovery and does not emit launch telemetry when a command fails", async () => {
        const { deps, launchPlan, showRecovery, emitEvent } = buildDeps("start");
        const recoveryResult = {
            status: "recovery",
            reason: "commandFailed",
            failedCommand: plan[0],
            exitCode: 1
        } as const;
        launchPlan.resolves(recoveryResult);

        const outcome = await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        expect(outcome).to.deep.equal({
            status: "recovery",
            result: {
                status: "recovery",
                reason: "commandFailed",
                failedCommand: plan[0],
                exitCode: 1
            }
        });
        expect(emitEvent.callCount).to.equal(2);
        expect(showRecovery.calledOnceWithExactly(recoveryResult)).to.be.true;
        expect(emitEvent.secondCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_COMMAND_SEQUENCE_RECOVERY
        );
        expect(emitEvent.secondCall.args[3]).to.deep.equal({
            host: AgentHost.Copilot,
            reason: "commandFailed",
            commandKind: "registerMarketplace",
            exitCodeCategory: "nonZero"
        });
    });

    it("completes bootstrap before recording a later plugin recovery", async () => {
        const { deps, buildPlan, launchPlan, emitEvent } = buildDeps("start");
        const bootstrapPlan: PlannedCommand[] = [
            { kind: "installHost", commandLine: "install-host", description: "install host" },
            { kind: "refreshPath", commandLine: "refresh-path", description: "refresh path" },
            { kind: "verifyHost", commandLine: "verify-host", description: "verify host" },
            ...plan
        ];
        buildPlan.returns(bootstrapPlan);
        launchPlan.resolves({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: bootstrapPlan[3],
            exitCode: 1,
            completedCommandKinds: ["installHost", "refreshPath", "verifyHost"]
        });

        await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        expect(emitEvent.getCalls().map(call => call.args[0])).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_CONFIRM_ACTION_CLICKED,
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_STARTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_BOOTSTRAP_COMPLETED,
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_COMMAND_SEQUENCE_RECOVERY
        ]);
    });

    it("retries the approved plan from the recovery state", async () => {
        const { deps, launchPlan, showRecovery } = buildDeps("start");
        launchPlan
            .onFirstCall()
            .resolves({
                status: "recovery",
                reason: "commandFailed",
                failedCommand: plan[0],
                exitCode: 1
            })
            .onSecondCall()
            .resolves({ status: "launched" });
        showRecovery.resolves("retry");

        const outcome = await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        expect(outcome).to.deep.equal({ status: "launched" });
        expect(launchPlan.calledTwice).to.be.true;
    });

    it("does not replay completed mutating setup commands on retry", async () => {
        const { deps, launchPlan, showRecovery } = buildDeps("start");
        launchPlan
            .onFirstCall()
            .resolves({
                status: "recovery",
                reason: "commandFailed",
                failedCommand: plan[1],
                exitCode: 1,
                completedCommandKinds: ["registerMarketplace"],
                setupState: {
                    marketplace: "present",
                    plugin: "missing"
                }
            })
            .onSecondCall()
            .resolves({ status: "launched" });
        showRecovery.resolves("retry");

        await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        const retryPlan = launchPlan.secondCall.args[1] as PlannedCommand[];
        expect(retryPlan.map(command => command.kind)).to.deep.equal(["launchHost"]);
        expect(launchPlan.secondCall.args[4]).to.deep.equal({
            marketplace: "present",
            plugin: "missing"
        });
    });

    it("drops the flow when recovery is cancelled", async () => {
        const { deps, launchPlan, showRecovery, emitEvent } = buildDeps("start");
        launchPlan.resolves({
            status: "recovery",
            reason: "commandFailed",
            failedCommand: plan[0],
            exitCode: 1
        });
        showRecovery.resolves("cancel");

        const outcome = await confirmAndLaunchAgentHost(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            folderUri,
            params,
            deps
        );

        expect(outcome).to.deep.equal({ status: "dropped" });
        expect(emitEvent.lastCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(emitEvent.lastCall.args[3]).to.deep.equal({
            reason: "recoveryCancelled",
            host: AgentHost.Copilot
        });
    });
});
