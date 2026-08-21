/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { resumeAgenticCreateOnActivation } from "../../uriHandler/resumeAgenticCreateActivation";
import * as agenticCreateLaunch from "../../uriHandler/utils/agenticCreateLaunch";
import * as createFlowCommonStages from "../../uriHandler/handlers/createFlowCommonStages";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";
import * as detectAgentHostModule from "../../uriHandler/utils/detectAgentHost";
import { ResumeMarker, ResumeMarkerStore } from "../../uriHandler/utils/resumeMarker";
import * as selectTargetFolderModule from "../../uriHandler/utils/selectTargetFolder";
import { uriHandlerTelemetryEventNames } from "../../uriHandler/telemetry/uriHandlerTelemetryEvents";

describe("resumeAgenticCreateOnActivation", () => {
    let sandbox: sinon.SinonSandbox;
    let marker: ResumeMarker | undefined;
    let store: ResumeMarkerStore;
    let runCreateFlowCommonStagesStub: sinon.SinonStub;
    let selectTargetFolderStub: sinon.SinonStub;
    let confirmAndLaunchStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;

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

        sandbox.stub(detectAgentHostModule, "detectAgentHost").resolves({
            host: AgentHost.Copilot,
            installed: true,
            version: "1.2.3"
        });
        sandbox.stub(vscode.window, "showInformationMessage").callsFake(
            ((_message: string, ...buttons: string[]) =>
                Promise.resolve(buttons[0])) as unknown as typeof vscode.window.showInformationMessage
        );
        traceInfoStub = sandbox.stub();
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: traceInfoStub,
            traceError: sandbox.stub()
        } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>);

        runCreateFlowCommonStagesStub = sandbox.stub(
            createFlowCommonStages,
            "runCreateFlowCommonStages"
        );
        selectTargetFolderStub = sandbox.stub(
            selectTargetFolderModule,
            "selectTargetFolder"
        );
        confirmAndLaunchStub = sandbox.stub(
            agenticCreateLaunch,
            "confirmAndLaunchSelectedAgentHost"
        ).resolves({ status: "launched" });
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("continues through folder selection and terminal launch without authentication stages", async () => {
        const folderUri = vscode.Uri.file("C:\\sites\\target");
        selectTargetFolderStub.resolves(folderUri);

        await resumeAgenticCreateOnActivation(store);

        expect(runCreateFlowCommonStagesStub.notCalled).to.be.true;
        expect(selectTargetFolderStub.calledOnceWithExactly()).to.be.true;
        const params = confirmAndLaunchStub.firstCall.args[2];
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
        expect(confirmAndLaunchStub.calledOnceWithExactly(
            AgentHost.Copilot,
            folderUri,
            params,
            undefined,
            false
        )).to.be.true;
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED
        )).to.be.true;
        expect(marker).to.be.undefined;
    });

    it("does not open confirmation when folder selection is cancelled", async () => {
        selectTargetFolderStub.resolves(undefined);

        await resumeAgenticCreateOnActivation(store);

        expect(runCreateFlowCommonStagesStub.notCalled).to.be.true;
        expect(confirmAndLaunchStub.notCalled).to.be.true;
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_CANCELLED
        )).to.be.true;
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        )).to.be.true;
        expect(marker).to.be.undefined;
    });
});
