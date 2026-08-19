/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { PacWrapper } from "../../pac/PacWrapper";
import { resumeAgenticCreateOnActivation } from "../../uriHandler/resumeAgenticCreateActivation";
import * as agenticCreateLaunch from "../../uriHandler/utils/agenticCreateLaunch";
import * as createFlowCommonStages from "../../uriHandler/handlers/createFlowCommonStages";
import { AgenticCreateHandler } from "../../uriHandler/handlers/agenticCreateHandler";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";
import * as detectAgentHostModule from "../../uriHandler/utils/detectAgentHost";
import { ResumeMarker, ResumeMarkerStore } from "../../uriHandler/utils/resumeMarker";

describe("resumeAgenticCreateOnActivation", () => {
    let sandbox: sinon.SinonSandbox;
    let marker: ResumeMarker | undefined;
    let store: ResumeMarkerStore;
    let runCreateFlowCommonStagesStub: sinon.SinonStub;
    let confirmAndLaunchStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        marker = {
            host: AgentHost.Copilot,
            timestamp: Date.now(),
            correlationId: "correlation-id",
            environmentId: "environment-id",
            orgUrl: "https://org.crm.dynamics.com",
            websiteId: "website-id",
            source: "powerPagesHome"
        };
        store = {
            get: <T>() => marker as T | undefined,
            update: (_key, value) => {
                marker = value as ResumeMarker | undefined;
            }
        };

        sandbox.stub(AgenticCreateHandler, "isEnabled").returns(true);
        sandbox.stub(detectAgentHostModule, "detectAgentHost").resolves({
            host: AgentHost.Copilot,
            installed: true,
            version: "1.2.3"
        });
        sandbox.stub(vscode.window, "showInformationMessage").callsFake(
            ((_message: string, ...buttons: string[]) =>
                Promise.resolve(buttons[0])) as unknown as typeof vscode.window.showInformationMessage
        );
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: sandbox.stub(),
            traceError: sandbox.stub()
        } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>);

        runCreateFlowCommonStagesStub = sandbox.stub(
            createFlowCommonStages,
            "runCreateFlowCommonStages"
        );
        confirmAndLaunchStub = sandbox.stub(
            agenticCreateLaunch,
            "confirmAndLaunchSelectedAgentHost"
        ).resolves({ status: "launched" });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("continues through confirmation and terminal launch after common stages", async () => {
        const folderUri = vscode.Uri.file("C:\\sites\\target");
        runCreateFlowCommonStagesStub.resolves(folderUri);

        await resumeAgenticCreateOnActivation(store, {} as PacWrapper);

        expect(runCreateFlowCommonStagesStub.calledOnce).to.be.true;
        const params = runCreateFlowCommonStagesStub.firstCall.args[0];
        expect(params).to.deep.equal({
            environmentId: "environment-id",
            orgUrl: "https://org.crm.dynamics.com",
            region: null,
            tenantId: null,
            websiteId: "website-id",
            source: "powerPagesHome",
            agentHost: AgentHost.Copilot,
            version: null,
            correlationId: "correlation-id"
        });
        expect(runCreateFlowCommonStagesStub.firstCall.args[1]).to.equal("agent");
        expect(confirmAndLaunchStub.calledOnceWithExactly(
            AgentHost.Copilot,
            folderUri,
            params
        )).to.be.true;
        expect(marker).to.be.undefined;
    });

    it("does not open confirmation when common stages are cancelled", async () => {
        runCreateFlowCommonStagesStub.resolves(undefined);

        await resumeAgenticCreateOnActivation(store, {} as PacWrapper);

        expect(confirmAndLaunchStub.notCalled).to.be.true;
        expect(marker).to.be.undefined;
    });
});
