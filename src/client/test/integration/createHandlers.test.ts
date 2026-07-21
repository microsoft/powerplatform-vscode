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

describe("Create deep-link handlers (gated)", () => {
    let sandbox: sinon.SinonSandbox;
    let getConfigStub: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

    const pacCreateUri = vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.PAC_CREATE}` +
        `?${URI_CONSTANTS.PARAMETERS.SOURCE}=${URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME}` +
        `&${URI_CONSTANTS.PARAMETERS.ENV_ID}=env-1&${URI_CONSTANTS.PARAMETERS.VERSION}=${URI_CONSTANTS.CONTRACT_VERSION.CURRENT}`
    );
    const agenticCreateUri = vscode.Uri.parse(
        `vscode://${URI_CONSTANTS.EXTENSION_ID}${URI_CONSTANTS.PATHS.AGENTIC_CREATE}` +
        `?${URI_CONSTANTS.PARAMETERS.SOURCE}=${URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME}` +
        `&${URI_CONSTANTS.PARAMETERS.AGENT_HOST}=${URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT}`
    );

    const setFlags = (enabled: boolean): void => {
        getConfigStub.returns({
            enablePacCreateFromHome: enabled,
            enableAgenticCreateFromHome: enabled
        });
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        getConfigStub = sandbox.stub(ECSFeaturesClient, "getConfig") as unknown as sinon.SinonStub;
        traceInfoStub = sandbox.stub();
        traceErrorStub = sandbox.stub();
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(
            { traceInfo: traceInfoStub, traceError: traceErrorStub } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>
        );
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("PacCreateHandler is a no-op that only emits disabled telemetry when the flag is off", async () => {
        setFlags(false);
        const handler = new PacCreateHandler({} as PacWrapper);

        await handler.handle(pacCreateUri);

        expect(PacCreateHandler.isEnabled()).to.be.false;
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_DISABLED)).to.be.true;
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED)).to.be.false;
    });

    it("PacCreateHandler parses params and emits triggered telemetry when the flag is on", async () => {
        setFlags(true);
        const handler = new PacCreateHandler({} as PacWrapper);

        await handler.handle(pacCreateUri);

        expect(PacCreateHandler.isEnabled()).to.be.true;
        const triggered = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_PAC_CREATE_TRIGGERED
        );
        expect(triggered, "expected a triggered telemetry event").to.not.be.undefined;
        expect(triggered?.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            version: URI_CONSTANTS.CONTRACT_VERSION.CURRENT,
            hasEnvironmentId: "true"
        });
    });

    it("AgenticCreateHandler is a no-op that only emits disabled telemetry when the flag is off", async () => {
        setFlags(false);
        const handler = new AgenticCreateHandler({} as PacWrapper);

        await handler.handle(agenticCreateUri);

        expect(AgenticCreateHandler.isEnabled()).to.be.false;
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_DISABLED)).to.be.true;
        expect(traceInfoStub.calledWith(uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED)).to.be.false;
    });

    it("AgenticCreateHandler parses params and emits triggered telemetry when the flag is on", async () => {
        setFlags(true);
        const handler = new AgenticCreateHandler({} as PacWrapper);

        await handler.handle(agenticCreateUri);

        expect(AgenticCreateHandler.isEnabled()).to.be.true;
        const triggered = traceInfoStub.getCalls().find(
            (call) => call.args[0] === uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_TRIGGERED
        );
        expect(triggered, "expected a triggered telemetry event").to.not.be.undefined;
        expect(triggered?.args[1]).to.include({
            source: URI_CONSTANTS.SOURCE_VALUES.POWER_PAGES_HOME,
            agentHost: URI_CONSTANTS.AGENT_HOST_VALUES.COPILOT
        });
    });
});
