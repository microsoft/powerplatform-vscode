/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { PacWrapper } from "../../pac/PacWrapper";
import {
    CreateFlowCommonStagesDependencies,
    runCreateFlowCommonStages
} from "../../uriHandler/handlers/createFlowCommonStages";
import {
    buildCreateFlowTelemetry,
    CreateFlowParameters
} from "../../uriHandler/handlers/createFlowParams";
import {
    emitCreateFlowError,
    emitCreateFlowEvent
} from "../../uriHandler/telemetry/createFlowTelemetry";
import { uriHandlerTelemetryEventNames } from "../../uriHandler/telemetry/uriHandlerTelemetryEvents";
import { AuthEnvironmentService } from "../../uriHandler/utils/authEnvironment";

describe("Create-flow common stages", () => {
    let sandbox: sinon.SinonSandbox;
    let prepareAuthenticationAndEnvironmentStub: sinon.SinonStub;
    let selectTargetFolderStub: sinon.SinonStub;
    let emitCreateFlowEventStub: sinon.SinonStub;
    let emitCreateFlowErrorStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;
    let emittedEventNames: string[];
    let dependencies: CreateFlowCommonStagesDependencies;

    const params: CreateFlowParameters = {
        environmentId: 'environment-id',
        orgUrl: 'https://sensitive.crm.dynamics.com',
        region: 'NAM',
        tenantId: 'sensitive-tenant-id',
        websiteId: 'website-id',
        source: 'power-pages-home',
        agentHost: null,
        version: '1',
        correlationId: 'correlation-id'
    };
    const telemetryData = buildCreateFlowTelemetry(params);
    const pacWrapper = {} as PacWrapper;
    const selectedFolder = vscode.Uri.file("C:\\sensitive\\selected-folder");

    const expectRedactedTelemetry = (): void => {
        const properties = [
            ...traceInfoStub.getCalls().map((call) => call.args[1] as Record<string, string>),
            ...traceErrorStub.getCalls().map((call) => call.args[3] as Record<string, string>)
        ];

        for (const eventProperties of properties) {
            expect(eventProperties).to.not.have.property('folderPath');
            expect(eventProperties).to.not.have.property('orgUrl');
            expect(eventProperties).to.not.have.property('tenantId');
            expect(Object.values(eventProperties)).to.not.include(selectedFolder.fsPath);
            expect(Object.values(eventProperties)).to.not.include(params.orgUrl);
            expect(Object.values(eventProperties)).to.not.include(params.tenantId);
            expect(eventProperties).to.include({
                environmentId: params.environmentId,
                websiteId: params.websiteId,
                correlationId: params.correlationId
            });
        }
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        emittedEventNames = [];
        prepareAuthenticationAndEnvironmentStub = sandbox.stub().resolves();
        selectTargetFolderStub = sandbox.stub();
        traceInfoStub = sandbox.stub();
        traceErrorStub = sandbox.stub();
        emitCreateFlowEventStub = sandbox.stub().callsFake((
            eventName: string,
            eventParams: CreateFlowParameters,
            channel: 'pac' | 'agent'
        ) => {
            emittedEventNames.push(eventName);
            emitCreateFlowEvent(eventName, eventParams, channel);
        });
        emitCreateFlowErrorStub = sandbox.stub().callsFake((
            eventName: string,
            message: string,
            error: unknown,
            eventParams: CreateFlowParameters,
            channel: 'pac' | 'agent'
        ) => {
            emittedEventNames.push(eventName);
            emitCreateFlowError(eventName, message, error, eventParams, channel);
        });

        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(
            { traceInfo: traceInfoStub, traceError: traceErrorStub } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>
        );

        const authEnvironmentService = {
            prepareAuthenticationAndEnvironment: prepareAuthenticationAndEnvironmentStub
        } as unknown as AuthEnvironmentService;
        dependencies = {
            createAuthEnvironmentService: sandbox.stub().returns(authEnvironmentService),
            selectTargetFolder: selectTargetFolderStub,
            emitCreateFlowEvent: emitCreateFlowEventStub,
            emitCreateFlowError: emitCreateFlowErrorStub
        };
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("emits ordered stages and returns the selected folder", async () => {
        selectTargetFolderStub.resolves(selectedFolder);

        const result = await runCreateFlowCommonStages(
            params,
            'pac',
            telemetryData,
            pacWrapper,
            dependencies
        );

        expect(result).to.equal(selectedFolder);
        expect(prepareAuthenticationAndEnvironmentStub.calledOnceWithExactly(
            {
                environmentId: params.environmentId,
                orgUrl: params.orgUrl
            },
            telemetryData
        )).to.be.true;
        expect(emittedEventNames).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_COMPLETED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_ENVIRONMENT_SET,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_SELECTED
        ]);
        expectRedactedTelemetry();
    });

    it("emits cancellation and drop stages when folder selection is cancelled", async () => {
        selectTargetFolderStub.resolves(undefined);

        const result = await runCreateFlowCommonStages(
            params,
            'agent',
            telemetryData,
            pacWrapper,
            dependencies
        );

        expect(result).to.be.undefined;
        expect(emittedEventNames).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_COMPLETED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_ENVIRONMENT_SET,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FOLDER_CANCELLED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        ]);
        expectRedactedTelemetry();
    });

    it("emits authentication failure and drop stages when authentication fails", async () => {
        prepareAuthenticationAndEnvironmentStub.rejects(new Error('authentication failed'));

        const result = await runCreateFlowCommonStages(
            params,
            'pac',
            telemetryData,
            pacWrapper,
            dependencies
        );

        expect(result).to.be.undefined;
        expect(selectTargetFolderStub.called).to.be.false;
        expect(emittedEventNames).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_STARTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_AUTH_FAILED,
            uriHandlerTelemetryEventNames.URI_HANDLER_CREATE_FLOW_DROPPED
        ]);
        expect(traceErrorStub.calledOnce).to.be.true;
        expectRedactedTelemetry();
    });
});
