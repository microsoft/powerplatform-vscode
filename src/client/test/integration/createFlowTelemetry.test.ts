/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
import {
    buildCreateFlowTelemetry,
    CreateFlowParameters,
    parseCreateFlowParameters
} from "../../uriHandler/handlers/createFlowParams";
import {
    emitCreateFlowError,
    emitCreateFlowEvent
} from "../../uriHandler/telemetry/createFlowTelemetry";
import { uriHandlerTelemetryEventNames } from "../../uriHandler/telemetry/uriHandlerTelemetryEvents";

describe("Create-flow telemetry", () => {
    let sandbox: sinon.SinonSandbox;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

    const params: CreateFlowParameters = {
        environmentId: 'environment-secret',
        orgUrl: 'https://secret.crm.dynamics.com',
        region: 'NAM',
        tenantId: 'tenant-secret',
        websiteId: 'website-secret',
        source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
        agentHost: URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT,
        version: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
        correlationId: 'correlation-123'
    };

    const expectIdentifiersHandled = (properties: Record<string, string>): void => {
        expect(properties.environmentId).to.equal(params.environmentId);
        expect(properties.websiteId).to.equal(params.websiteId);
        expect(properties).to.not.have.property('orgUrl');
        expect(properties).to.not.have.property('tenantId');
        expect(Object.values(properties)).to.not.include(params.orgUrl);
        expect(Object.values(properties)).to.not.include(params.tenantId);
        expect(properties).to.include({
            hasEnvironmentId: 'true',
            hasOrgUrl: 'true',
            hasTenantId: 'true',
            hasWebsiteId: 'true'
        });
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        traceInfoStub = sandbox.stub();
        traceErrorStub = sandbox.stub();
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(
            { traceInfo: traceInfoStub, traceError: traceErrorStub } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>
        );
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("defines the create-flow funnel events in stage order", () => {
        expect(Object.values(uriHandlerTelemetryEventNames).slice(-19)).to.deep.equal([
            'UriHandlerCreateAuthStarted',
            'UriHandlerCreateAuthCompleted',
            'UriHandlerCreateAuthFailed',
            'UriHandlerCreateEnvironmentSet',
            'UriHandlerCreateFolderSelected',
            'UriHandlerCreateFolderCancelled',
            'UriHandlerPacCreateParamsCollected',
            'UriHandlerPacCreateTerminalLaunched',
            'UriHandlerAgenticCreateHostDetected',
            'UriHandlerAgenticCreateHostSelected',
            'UriHandlerAgenticCreatePluginSequenceLaunched',
            'UriHandlerAgenticCreateSamplePromptSent',
            'UriHandlerCreateFlowDropped',
            'UriHandlerAgenticCreateHostInstallPrompted',
            'UriHandlerAgenticCreateHostInstallGuideOpened',
            'UriHandlerAgenticCreateHostInstallRechecked',
            'UriHandlerAgenticCreateHostInstallReloadRequested',
            'UriHandlerAgenticCreateHostInstallResumed',
            'UriHandlerAgenticCreateHostInstallDismissed'
        ]);
    });

    it("parses the defensive referrer session ID as the correlation ID", () => {
        const uri = vscode.Uri.parse(
            `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.PAC_CREATE}` +
            `?${URI_CONSTANTS.PARAMETERS.REFERRER_SESSION_ID}=correlation-456`
        );

        expect(parseCreateFlowParameters(uri).correlationId).to.equal('correlation-456');
    });

    it("emits information events with common, extra, and redacted properties", () => {
        emitCreateFlowEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED,
            params,
            'pac',
            { authenticationMode: 'existing', region: 'extra-region' }
        );

        expect(traceInfoStub.calledOnce).to.be.true;
        expect(traceInfoStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED
        );
        const properties = traceInfoStub.firstCall.args[1] as Record<string, string>;
        expect(properties).to.include({
            channel: 'pac',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: params.correlationId,
            authenticationMode: 'existing',
            region: 'extra-region'
        });
        expectIdentifiersHandled(properties);
    });

    it("emits normalized errors with common, extra, and redacted properties", () => {
        emitCreateFlowError(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED,
            'Create flow dropped',
            'authentication failed',
            params,
            'agent',
            { dropStage: 'authentication' }
        );

        expect(traceErrorStub.calledOnce).to.be.true;
        expect(traceErrorStub.firstCall.args[0]).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        );
        expect(traceErrorStub.firstCall.args[1]).to.equal('Create flow dropped');
        expect(traceErrorStub.firstCall.args[2]).to.be.instanceOf(Error);
        expect((traceErrorStub.firstCall.args[2] as Error).message).to.equal('authentication failed');
        const properties = traceErrorStub.firstCall.args[3] as Record<string, string>;
        expect(properties).to.include({
            channel: 'agent',
            contractVersion: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            correlationId: params.correlationId,
            dropStage: 'authentication'
        });
        expectIdentifiersHandled(properties);
    });

    it("uses an empty correlation ID when the referrer session ID is absent", () => {
        emitCreateFlowEvent(
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_ENVIRONMENT_SET,
            { ...params, correlationId: null },
            'pac'
        );

        expect((traceInfoStub.firstCall.args[1] as Record<string, string>).correlationId).to.equal('');
    });

    it("includes website and environment IDs while redacting organization URL and tenant ID", () => {
        const properties = buildCreateFlowTelemetry(params);

        expectIdentifiersHandled(properties);
    });

    it("uses empty identifier values when website and environment IDs are absent", () => {
        const properties = buildCreateFlowTelemetry({
            ...params,
            environmentId: null,
            orgUrl: null,
            websiteId: null
        });

        expect(properties).to.include({
            environmentId: '',
            websiteId: ''
        });
        expect(properties).to.not.have.property('orgUrl');
    });
});
