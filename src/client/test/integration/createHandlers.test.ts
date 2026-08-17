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
import { CreateFlowParameters } from "../../uriHandler/handlers/createFlowParams";
import {
    emitCreateFlowError,
    emitCreateFlowEvent
} from "../../uriHandler/telemetry/createFlowTelemetry";
import { AuthEnvironmentService } from "../../uriHandler/utils/authEnvironment";

type CreateFlowChannel = createFlowCommonStages.CreateFlowChannel;

describe("Create deep-link handlers (gated)", () => {
    let sandbox: sinon.SinonSandbox;
    let getConfigStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let runCreateFlowCommonStagesStub: sinon.SinonStub;
    const realRunCreateFlowCommonStages = createFlowCommonStages.runCreateFlowCommonStages;
    const selectedFolder = vscode.Uri.file("C:\\sensitive\\sites");
    const pacOrgUrl = 'https://pac.crm.dynamics.com';
    const agentOrgUrl = 'https://agent.crm.dynamics.com';
    const pacTenantId = 'pac-sensitive-tenant';
    const agentTenantId = 'agent-sensitive-tenant';

    const pacCreateUri = vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.PAC_CREATE}` +
        `?${URI_CONSTANTS.PARAMETERS.SOURCE}=${URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME}` +
        `&${URI_CONSTANTS.PARAMETERS.ENV_ID}=env-1&${URI_CONSTANTS.PARAMETERS.VERSION}=${URI_CONSTANTS.CONTRACT_VERSION.CURRENT}` +
        `&${URI_CONSTANTS.PARAMETERS.ORG_URL}=https%3A%2F%2Fpac.crm.dynamics.com` +
        `&${URI_CONSTANTS.PARAMETERS.TENANT_ID}=${pacTenantId}` +
        `&${URI_CONSTANTS.PARAMETERS.WEBSITE_ID}=pac-website` +
        `&${URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID}=pac-correlation`
    );
    const agenticCreateUri = vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.AGENTIC_CREATE}` +
        `?${URI_CONSTANTS.PARAMETERS.SOURCE}=${URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME}` +
        `&${URI_CONSTANTS.PARAMETERS.AGENT_HOST}=${URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT}` +
        `&${URI_CONSTANTS.PARAMETERS.ENV_ID}=agent-env` +
        `&${URI_CONSTANTS.PARAMETERS.ORG_URL}=https%3A%2F%2Fagent.crm.dynamics.com` +
        `&${URI_CONSTANTS.PARAMETERS.TENANT_ID}=${agentTenantId}` +
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

    const expectRedactedProperties = (
        properties: Record<string, string>,
        environmentId: string,
        websiteId: string,
        orgUrl: string,
        tenantId: string
    ): void => {
        expect(properties).to.include({
            environmentId,
            websiteId,
            hasEnvironmentId: 'true',
            hasOrgUrl: 'true',
            hasTenantId: 'true',
            hasWebsiteId: 'true'
        });
        expect(properties).to.not.have.property('orgUrl');
        expect(properties).to.not.have.property('tenantId');
        expect(properties).to.not.have.property('folderPath');
        expect(Object.values(properties)).to.not.include(orgUrl);
        expect(Object.values(properties)).to.not.include(tenantId);
        expect(Object.values(properties)).to.not.include(selectedFolder.fsPath);
        for (const presenceProperty of [
            'hasEnvironmentId',
            'hasOrgUrl',
            'hasTenantId',
            'hasWebsiteId'
        ]) {
            expect(properties[presenceProperty]).to.be.a('string');
        }
    };

    const expectCreateFlowEnvelope = (
        properties: Record<string, string>,
        channel: CreateFlowChannel,
        correlationId: string
    ): void => {
        expect(properties).to.include({
            channel,
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId
        });
    };

    const expectAllCapturedPropertiesRedacted = (
        environmentId: string,
        websiteId: string,
        orgUrl: string,
        tenantId: string
    ): void => {
        const properties = [
            ...traceInfoStub.getCalls().map((call) => call.args[1] as Record<string, string>),
            ...traceErrorStub.getCalls().map((call) => call.args[3] as Record<string, string>)
        ];

        for (const eventProperties of properties) {
            expectRedactedProperties(eventProperties, environmentId, websiteId, orgUrl, tenantId);
        }
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getConfigStub = sandbox.stub(ECSFeaturesClient, "getConfig") as unknown as sinon.SinonStub;
        traceInfoStub = sandbox.stub();
        traceErrorStub = sandbox.stub();
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(
            { traceInfo: traceInfoStub, traceError: traceErrorStub } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>
        );
        const commonStageDependencies: createFlowCommonStages.CreateFlowCommonStagesDependencies = {
            createAuthEnvironmentService: sandbox.stub().returns({
                prepareAuthenticationAndEnvironment: sandbox.stub().resolves()
            } as unknown as AuthEnvironmentService),
            selectTargetFolder: sandbox.stub().resolves(selectedFolder),
            emitCreateFlowEvent,
            emitCreateFlowError
        };
        runCreateFlowCommonStagesStub = sandbox.stub(
            createFlowCommonStages,
            "runCreateFlowCommonStages"
        ).callsFake((
            params: CreateFlowParameters,
            channel: CreateFlowChannel,
            telemetryData: Record<string, string>,
            pacWrapper: PacWrapper
        ) => realRunCreateFlowCommonStages(
            params,
            channel,
            telemetryData,
            pacWrapper,
            commonStageDependencies
        ));
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("PacCreateHandler is a no-op that only emits disabled telemetry when the flag is off", async () => {
        setFlags(false);
        const handler = new PacCreateHandler({} as PacWrapper);

        await handler.handle(pacCreateUri);

        expect(PacCreateHandler.isEnabled()).to.be.false;
        expect(traceInfoStub.callCount).to.equal(1);
        expect(traceErrorStub.called).to.be.false;
        expect(traceInfoStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_DISABLED
        );
        expect(traceInfoStub.firstCall.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            hasEnvironmentId: "true"
        });
        expect(traceInfoStub.firstCall.args[1]).to.not.have.property('channel');
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED)).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
        expectAllCapturedPropertiesRedacted('env-1', 'pac-website', pacOrgUrl, pacTenantId);
    });

    it("PacCreateHandler proceeds with the supported contract version when the flag is on", async () => {
        setFlags(true);
        const pacWrapper = {} as PacWrapper;
        const handler = new PacCreateHandler(pacWrapper);

        await handler.handle(pacCreateUri);

        expect(PacCreateHandler.isEnabled()).to.be.true;
        expect(traceInfoStub.getCalls().map((call) => call.args[0])).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_COMPLETED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_ENVIRONMENT_SET,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED
        ]);
        expect(traceErrorStub.called).to.be.false;
        expect(traceInfoStub.firstCall.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            version: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            hasEnvironmentId: "true"
        });
        for (const call of traceInfoStub.getCalls()) {
            expectCreateFlowEnvelope(call.args[1] as Record<string, string>, 'pac', 'pac-correlation');
        }
        expectAllCapturedPropertiesRedacted('env-1', 'pac-website', pacOrgUrl, pacTenantId);
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

        expect(traceInfoStub.callCount).to.equal(1);
        expect(traceErrorStub.called).to.be.false;
        expect(traceInfoStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(traceInfoStub.firstCall.args[1]).to.include({
            channel: 'pac',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'pac-correlation',
            reason: 'unsupportedContractVersion',
            version: '2'
        });
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED
        )).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
        expectAllCapturedPropertiesRedacted('env-1', 'pac-website', pacOrgUrl, pacTenantId);
    });

    it("PacCreateHandler emits failed telemetry through the create-flow helper", async () => {
        setFlags(true);
        runCreateFlowCommonStagesStub.rejects(new Error('create flow failed'));
        const handler = new PacCreateHandler({} as PacWrapper);

        await handler.handle(pacCreateUri);

        expect(traceInfoStub.calledOnceWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED
        )).to.be.true;
        expect(traceErrorStub.calledOnce).to.be.true;
        expect(traceErrorStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_FAILED
        );
        expect(traceErrorStub.firstCall.args[3]).to.include({
            channel: 'pac',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'pac-correlation'
        });
        expectAllCapturedPropertiesRedacted('env-1', 'pac-website', pacOrgUrl, pacTenantId);
    });

    it("AgenticCreateHandler is a no-op that only emits disabled telemetry when the flag is off", async () => {
        setFlags(false);
        const handler = new AgenticCreateHandler({} as PacWrapper);

        await handler.handle(agenticCreateUri);

        expect(AgenticCreateHandler.isEnabled()).to.be.false;
        expect(traceInfoStub.callCount).to.equal(1);
        expect(traceErrorStub.called).to.be.false;
        expect(traceInfoStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_DISABLED
        );
        expect(traceInfoStub.firstCall.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            agentHost: URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT
        });
        expect(traceInfoStub.firstCall.args[1]).to.not.have.property('channel');
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED)).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
        expectAllCapturedPropertiesRedacted(
            'agent-env',
            'agent-website',
            agentOrgUrl,
            agentTenantId
        );
    });

    it("AgenticCreateHandler proceeds without a contract version when the flag is on", async () => {
        setFlags(true);
        const pacWrapper = {} as PacWrapper;
        const handler = new AgenticCreateHandler(pacWrapper);

        await handler.handle(agenticCreateUri);

        expect(AgenticCreateHandler.isEnabled()).to.be.true;
        expect(traceInfoStub.getCalls().map((call) => call.args[0])).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_COMPLETED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_ENVIRONMENT_SET,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED
        ]);
        expect(traceErrorStub.called).to.be.false;
        expect(traceInfoStub.firstCall.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            agentHost: URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT,
            version: 'unspecified'
        });
        for (const call of traceInfoStub.getCalls()) {
            expectCreateFlowEnvelope(call.args[1] as Record<string, string>, 'agent', 'agent-correlation');
        }
        expectAllCapturedPropertiesRedacted(
            'agent-env',
            'agent-website',
            agentOrgUrl,
            agentTenantId
        );
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

        expect(traceInfoStub.callCount).to.equal(1);
        expect(traceErrorStub.called).to.be.false;
        expect(traceInfoStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(traceInfoStub.firstCall.args[1]).to.include({
            channel: 'agent',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'agent-correlation',
            reason: 'unsupportedContractVersion',
            version: '2'
        });
        expect(traceInfoStub.calledWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED
        )).to.be.false;
        expect(runCreateFlowCommonStagesStub.called).to.be.false;
        expectAllCapturedPropertiesRedacted(
            'agent-env',
            'agent-website',
            agentOrgUrl,
            agentTenantId
        );
    });

    it("AgenticCreateHandler emits failed telemetry through the create-flow helper", async () => {
        setFlags(true);
        runCreateFlowCommonStagesStub.rejects(new Error('create flow failed'));
        const handler = new AgenticCreateHandler({} as PacWrapper);

        await handler.handle(agenticCreateUri);

        expect(traceInfoStub.calledOnceWith(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED
        )).to.be.true;
        expect(traceErrorStub.calledOnce).to.be.true;
        expect(traceErrorStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_FAILED
        );
        expect(traceErrorStub.firstCall.args[3]).to.include({
            channel: 'agent',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: 'agent-correlation'
        });
        expectAllCapturedPropertiesRedacted(
            'agent-env',
            'agent-website',
            agentOrgUrl,
            agentTenantId
        );
    });
});
