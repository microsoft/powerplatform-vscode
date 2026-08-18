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
        { commandLine: "step-1", description: "one" },
        { commandLine: "step-2", description: "two" }
    ];

    const buildDeps = (
        decision: ConfirmDecision
    ): {
        deps: ConfirmAndLaunchDependencies;
        buildPlan: sinon.SinonStub;
        showConfirmPanel: sinon.SinonStub;
        launchPlan: sinon.SinonStub;
        emitEvent: sinon.SinonStub;
    } => {
        const buildPlan = sinon.stub().returns(plan);
        const showConfirmPanel = sinon.stub().resolves(decision);
        const launchPlan = sinon.stub();
        const emitEvent = sinon.stub().resolves();
        return {
            deps: { buildPlan, showConfirmPanel, launchPlan, emitEvent },
            buildPlan,
            showConfirmPanel,
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
        expect(launchPlan.calledOnceWithExactly(folderUri, plan, "GitHub Copilot CLI")).to.be.true;
        expect(emitEvent.callCount).to.equal(2);
        expect(emitEvent.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_PLUGIN_SEQUENCE_LAUNCHED
        );
        expect(emitEvent.firstCall.args[3]).to.deep.equal({ host: AgentHost.Copilot });
        expect(emitEvent.secondCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_SAMPLE_PROMPT_SENT
        );
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
        expect(emitEvent.calledOnce).to.be.true;
        expect(emitEvent.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(emitEvent.firstCall.args[3]).to.deep.equal({ reason: "confirmCancelled" });
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
        expect(emitEvent.firstCall.args[3]).to.deep.equal({ reason: "confirmDismissed" });
    });
});
