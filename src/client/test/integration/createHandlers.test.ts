/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { AgenticCreateHandler } from "../../uriHandler/handlers/agenticCreateHandler";
import { PacCreateHandler } from "../../uriHandler/handlers/pacCreateHandler";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
import { ECSFeaturesClient } from "../../../common/ecs-features/ecsFeatureClient";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { uriHandlerTelemetryEventNames } from "../../uriHandler/telemetry/uriHandlerTelemetryEvents";
import { PacWrapper } from "../../pac/PacWrapper";
import * as createFlowCommonStages from "../../uriHandler/handlers/createFlowCommonStages";

describe("Create deep-link handlers (gated)", () => {
    let sandbox: sinon.SinonSandbox;
    let getConfigStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let runCreateFlowCommonStagesStub: sinon.SinonStub;

    const pacCreateUri = vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.PAC_CREATE}` +
        `?${URI_CONSTANTS.PARAMETERS.SOURCE}=${URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME}` +
        `&${URI_CONSTANTS.PARAMETERS.ENV_ID}=env-1&${URI_CONSTANTS.PARAMETERS.VERSION}=${URI_CONSTANTS.CONTRACT_VERSION.CURRENT}` +
        `&${URI_CONSTANTS.PARAMETERS.ORG_URL}=https%3A%2F%2Fpac.crm.dynamics.com` +
        `&${URI_CONSTANTS.PARAMETERS.WEBSITE_ID}=pac-website` +
        `&${URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID}=pac-correlation`
    );
    const agenticCreateUri = vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.AGENTIC_CREATE}` +
        `?${URI_CONSTANTS.PARAMETERS.SOURCE}=${URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME}` +
        `&${URI_CONSTANTS.PARAMETERS.AGENT_HOST}=${URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT}` +
        `&${URI_CONSTANTS.PARAMETERS.ENV_ID}=agent-env` +
        `&${URI_CONSTANTS.PARAMETERS.ORG_URL}=https%3A%2F%2Fagent.crm.dynamics.com` +
        `&${URI_CONSTANTS.PARAMETERS.WEBSITE_ID}=agent-website` +
        `&${URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID}=agent-correlation`
    );

    const withContractVersion = (uri: vscode.Uri, version: string): vscode.Uri => {
        const query = new URLSearchParams(uri.query);
        query.set(URI_CONSTANTS.PARAMETERS.VERSION, version);
        return uri.with({ query: query.toString() });
    };

    const setFlags = (enabled: boolean): void => {
        getConfigStub.returns({
            enablePacCreateFromHome: enabled,
            enableAgenticCreateFromHome: enabled
        });
    };

    const expectIdentifiers = (
        properties: Record<string, string>,
        environmentId: string,
        websiteId: string
    ): void => {
        expect(properties).to.include({ environmentId, websiteId });
        expect(properties).to.not.have.property('orgUrl');
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getConfigStub = sandbox.stub(ECSFeaturesClient, "getConfig") as unknown as sinon.SinonStub;
        traceInfoStub = sandbox.stub();
        traceErrorStub = sandbox.stub();
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(
            { traceInfo: traceInfoStub, traceError: traceErrorStub } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>
        );
        runCreateFlowCommonStagesStub = sandbox.stub(
            createFlowCommonStages,
            "runCreateFlowCommonStages"
        ).resolves(vscode.Uri.file("C:\\sites"));
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("PacCreateHandler is a no-op that only emits disabled telemetry when the flag is off", async () => {
        setFlags(false);
        const handler = new PacCreateHandler({} as PacWrapper);

        await handler.handle(pacCreateUri);

        expect(PacCreateHandler.isEnabled()).to.be.false;
        const disabled = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_DISABLED
        );
        expect(disabled, "expected a disabled telemetry event").to.not.be.undefined;
        expect(disabled?.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            hasEnvironmentId: "true"
        });
        expectIdentifiers(disabled?.args[1] as Record<string, string>, 'env-1', 'pac-website');
        expect(disabled?.args[1]).to.not.have.property('channel');
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED)).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
    });

    it("PacCreateHandler proceeds with the supported contract version when the flag is on", async () => {
        setFlags(true);
        const pacWrapper = {} as PacWrapper;
        const handler = new PacCreateHandler(pacWrapper);

        await handler.handle(pacCreateUri);

        expect(PacCreateHandler.isEnabled()).to.be.true;
        const triggered = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED
        );
        expect(triggered, "expected a triggered telemetry event").to.not.be.undefined;
        expect(triggered?.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            version: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            hasEnvironmentId: "true",
            channel: 'pac',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'pac-correlation'
        });
        expectIdentifiers(triggered?.args[1] as Record<string, string>, 'env-1', 'pac-website');
        expect(runCreateFlowCommonStagesStub.calledOnce).to.be.true;
        expect(runCreateFlowCommonStagesStub.firstCall.args[0]).to.include({
            environmentId: 'env-1',
            websiteId: 'pac-website',
            correlationId: 'pac-correlation'
        });
        expect(runCreateFlowCommonStagesStub.firstCall.args[1]).to.equal('pac');
        expect(runCreateFlowCommonStagesStub.firstCall.args[2]).to.include({
            environmentId: 'env-1',
            websiteId: 'pac-website'
        });
        expect(runCreateFlowCommonStagesStub.firstCall.args[3]).to.equal(pacWrapper);
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        )).to.be.false;
    });

    it("PacCreateHandler drops an unsupported contract version before the flow starts", async () => {
        setFlags(true);
        const handler = new PacCreateHandler({} as PacWrapper);

        await handler.handle(withContractVersion(pacCreateUri, '2'));

        const dropped = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(dropped, "expected a dropped telemetry event").to.not.be.undefined;
        expect(dropped?.args[1]).to.include({
            channel: 'pac',
            reason: 'unsupportedContractVersion',
            version: '2'
        });
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED
        )).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
    });

    it("PacCreateHandler emits failed telemetry through the create-flow helper", async () => {
        setFlags(true);
        traceInfoStub.throws(new Error('trigger failed'));
        const handler = new PacCreateHandler({} as PacWrapper);

        await handler.handle(pacCreateUri);

        expect(traceErrorStub.calledOnce).to.be.true;
        expect(traceErrorStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_FAILED
        );
        expect(traceErrorStub.firstCall.args[3]).to.include({
            channel: 'pac',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'pac-correlation'
        });
        expectIdentifiers(
            traceErrorStub.firstCall.args[3] as Record<string, string>,
            'env-1',
            'pac-website'
        );
    });

    it("AgenticCreateHandler is a no-op that only emits disabled telemetry when the flag is off", async () => {
        setFlags(false);
        const handler = new AgenticCreateHandler({} as PacWrapper);

        await handler.handle(agenticCreateUri);

        expect(AgenticCreateHandler.isEnabled()).to.be.false;
        const disabled = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_DISABLED
        );
        expect(disabled, "expected a disabled telemetry event").to.not.be.undefined;
        expect(disabled?.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            agentHost: URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT
        });
        expectIdentifiers(disabled?.args[1] as Record<string, string>, 'agent-env', 'agent-website');
        expect(disabled?.args[1]).to.not.have.property('channel');
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED)).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
    });

    it("AgenticCreateHandler proceeds without a contract version when the flag is on", async () => {
        setFlags(true);
        const pacWrapper = {} as PacWrapper;
        const handler = new AgenticCreateHandler(pacWrapper);

        await handler.handle(agenticCreateUri);

        expect(AgenticCreateHandler.isEnabled()).to.be.true;
        const triggered = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED
        );
        expect(triggered, "expected a triggered telemetry event").to.not.be.undefined;
        expect(triggered?.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            agentHost: URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT,
            channel: 'agent',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'agent-correlation'
        });
        expectIdentifiers(triggered?.args[1] as Record<string, string>, 'agent-env', 'agent-website');
        expect(runCreateFlowCommonStagesStub.calledOnce).to.be.true;
        expect(runCreateFlowCommonStagesStub.firstCall.args[0]).to.include({
            environmentId: 'agent-env',
            websiteId: 'agent-website',
            correlationId: 'agent-correlation'
        });
        expect(runCreateFlowCommonStagesStub.firstCall.args[1]).to.equal('agent');
        expect(runCreateFlowCommonStagesStub.firstCall.args[2]).to.include({
            environmentId: 'agent-env',
            websiteId: 'agent-website'
        });
        expect(runCreateFlowCommonStagesStub.firstCall.args[3]).to.equal(pacWrapper);
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        )).to.be.false;
    });

    it("AgenticCreateHandler drops an unsupported contract version before the flow starts", async () => {
        setFlags(true);
        const handler = new AgenticCreateHandler({} as PacWrapper);

        await handler.handle(withContractVersion(agenticCreateUri, '2'));

        const dropped = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(dropped, "expected a dropped telemetry event").to.not.be.undefined;
        expect(dropped?.args[1]).to.include({
            channel: 'agent',
            reason: 'unsupportedContractVersion',
            version: '2'
        });
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED
        )).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
    });

    it("AgenticCreateHandler emits failed telemetry through the create-flow helper", async () => {
        setFlags(true);
        traceInfoStub.throws(new Error('trigger failed'));
        const handler = new AgenticCreateHandler({} as PacWrapper);

        await handler.handle(agenticCreateUri);

        expect(traceErrorStub.calledOnce).to.be.true;
        expect(traceErrorStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_FAILED
        );
        expect(traceErrorStub.firstCall.args[3]).to.include({
            channel: 'agent',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'agent-correlation'
        });
        expectIdentifiers(
            traceErrorStub.firstCall.args[3] as Record<string, string>,
            'agent-env',
            'agent-website'
        );
    });

    describe("local testing override", () => {
        const realGetConfiguration = vscode.workspace.getConfiguration.bind(vscode.workspace);

        const stubOverride = (value: boolean): void => {
            sandbox.stub(vscode.workspace, "getConfiguration").callsFake(((section?: string) => {
                if (section === URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.NAMESPACE) {
                    return {
                        get: (key: string, defaultValue?: boolean) =>
                            key === URI_CONSTANTS.LOCAL_OVERRIDE_SETTING.AGENTIC_CREATE_ENABLED
                                ? value
                                : defaultValue
                    } as unknown as vscode.WorkspaceConfiguration;
                }
                return realGetConfiguration(section);
            }) as typeof vscode.workspace.getConfiguration);
        };

        it("stays disabled when both ECS and the override are off", () => {
            setFlags(false);
            stubOverride(false);

            expect(AgenticCreateHandler.isEnabled()).to.be.false;
        });

        it("is enabled by the override even though the ECS flag is off", () => {
            setFlags(false);
            stubOverride(true);

            expect(AgenticCreateHandler.isEnabled()).to.be.true;
        });

        it("stays enabled from ECS when the override is off", () => {
            setFlags(true);
            stubOverride(false);

            expect(AgenticCreateHandler.isEnabled()).to.be.true;
        });
    });
});
