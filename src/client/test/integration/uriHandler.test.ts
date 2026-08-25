/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { UriHandler } from "../../uriHandler/uriHandler";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
import { PacWrapper } from "../../pac/PacWrapper";
import { AgenticCreateHandler } from "../../uriHandler/handlers/agenticCreateHandler";
import { PacCreateHandler } from "../../uriHandler/handlers/pacCreateHandler";

// Shape used to stub the private route targets on the prototype without resorting to `any`.
type UriHandlerRoutes = {
    pcfInit: () => Promise<void>;
    handleOpenPowerPages: (uri: vscode.Uri) => Promise<void>;
};

describe("UriHandler routing", () => {
    let sandbox: sinon.SinonSandbox;
    let pcfInitStub: sinon.SinonStub;
    let openStub: sinon.SinonStub;
    let agenticCreateStub: sinon.SinonStub;
    let pacCreateStub: sinon.SinonStub;
    let handler: UriHandler;

    const makeUri = (path: string): vscode.Uri =>
        vscode.Uri.parse(`vscode://${URI_CONSTANTS.EXTENSION_ID}${path}`);

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        const prototype = UriHandler.prototype as unknown as UriHandlerRoutes;
        pcfInitStub = sandbox.stub(prototype, "pcfInit").resolves();
        openStub = sandbox.stub(prototype, "handleOpenPowerPages").resolves();
        agenticCreateStub = sandbox.stub(AgenticCreateHandler.prototype, "handle").resolves();
        pacCreateStub = sandbox.stub(PacCreateHandler.prototype, "handle").resolves();
        handler = new UriHandler({} as PacWrapper);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("activates the extension when a Power Pages URI is invoked", () => {
        const packageJson = vscode.extensions.getExtension(URI_CONSTANTS.EXTENSION_ID)?.packageJSON;

        expect(packageJson?.activationEvents).to.include("onUri");
    });

    it("dispatches /pcfInit to the PCF init handler", async () => {
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.PCF_INIT));

        expect(pcfInitStub.calledOnce).to.be.true;
        expect(openStub.called).to.be.false;
        expect(agenticCreateStub.called).to.be.false;
        expect(pacCreateStub.called).to.be.false;
    });

    it("dispatches /open to the open Power Pages handler", async () => {
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.OPEN));

        expect(openStub.calledOnce).to.be.true;
        expect(pcfInitStub.called).to.be.false;
        expect(agenticCreateStub.called).to.be.false;
        expect(pacCreateStub.called).to.be.false;
    });

    it("dispatches /agenticCreate to the agentic create handler", async () => {
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.AGENTIC_CREATE));

        expect(agenticCreateStub.calledOnce).to.be.true;
        expect(pacCreateStub.called).to.be.false;
        expect(pcfInitStub.called).to.be.false;
        expect(openStub.called).to.be.false;
    });

    it("dispatches /agenticCreate before PAC initialization", async () => {
        const earlyHandler = new UriHandler();

        await earlyHandler.handleUri(makeUri(URI_CONSTANTS.PATHS.AGENTIC_CREATE));

        expect(agenticCreateStub.calledOnce).to.be.true;
        expect(pacCreateStub.notCalled).to.be.true;
    });

    it("dispatches /pacCreate to the PAC create handler", async () => {
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.PAC_CREATE));

        expect(pacCreateStub.calledOnce).to.be.true;
        expect(agenticCreateStub.called).to.be.false;
        expect(pcfInitStub.called).to.be.false;
        expect(openStub.called).to.be.false;
    });

    it("defers /pacCreate until PAC initialization completes", async () => {
        const earlyHandler = new UriHandler();
        const dispatch = earlyHandler.handleUri(makeUri(URI_CONSTANTS.PATHS.PAC_CREATE));
        await Promise.resolve();

        expect(pacCreateStub.notCalled).to.be.true;

        earlyHandler.initializePacWrapper({} as PacWrapper);
        await dispatch;

        expect(pacCreateStub.calledOnce).to.be.true;
    });

    it("releases deferred PAC routes when PAC initialization fails", async () => {
        const earlyHandler = new UriHandler();
        const dispatch = earlyHandler.handleUri(makeUri(URI_CONSTANTS.PATHS.PAC_CREATE));
        earlyHandler.failPacInitialization(new Error("PAC unavailable"));

        let error: unknown;
        try {
            await dispatch;
        } catch (caughtError) {
            error = caughtError;
        }

        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal("PAC unavailable");
        expect(pacCreateStub.notCalled).to.be.true;
    });

    it("ignores unknown paths without throwing", async () => {
        await handler.handleUri(makeUri("/someUnknownPath"));

        expect(pcfInitStub.called).to.be.false;
        expect(openStub.called).to.be.false;
        expect(agenticCreateStub.called).to.be.false;
        expect(pacCreateStub.called).to.be.false;
    });
});
