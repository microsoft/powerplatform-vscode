/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import * as sinon from "sinon";
import { UriHandler } from "../../uriHandler/uriHandler";
import * as ImportMetadataDiffHandler from "../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import { URI_CONSTANTS } from "../../uriHandler/constants/uriConstants";
import { PacWrapper } from "../../pac/PacWrapper";
import { AgenticCreateHandler } from "../../uriHandler/handlers/agenticCreateHandler";
import { PacCreateHandler } from "../../uriHandler/handlers/pacCreateHandler";

type UriHandlerRoutes = {
    pcfInit: () => Promise<void>;
    handleOpenPowerPages: (uri: vscode.Uri) => Promise<void>;
};

describe("UriHandler routing", () => {
    let sandbox: sinon.SinonSandbox;
    let importStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;
    let pcfInitStub: sinon.SinonStub;
    let openStub: sinon.SinonStub;
    let agenticCreateStub: sinon.SinonStub;
    let pacCreateStub: sinon.SinonStub;
    let handler: UriHandler;

    const buildUri = (filePath: string) =>
        vscode.Uri.parse(
            `vscode://microsoft-IsvExpTools.powerplatform-vscode/metadataDiffImport?filePath=${encodeURIComponent(filePath)}`
        );

    const makeUri = (path: string): vscode.Uri =>
        vscode.Uri.parse(`vscode://${URI_CONSTANTS.EXTENSION_ID}${path}`);

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        importStub = sandbox.stub(ImportMetadataDiffHandler, "importMetadataDiff").resolves();
        showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: () => { /* no-op */ },
            traceError: () => { /* no-op */ },
            traceWarning: () => { /* no-op */ },
            featureUsage: () => { /* no-op */ }
        } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>);
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

    it("routes /metadataDiffImport and calls importMetadataDiff with the file URI and { openFirstFile: true }", async () => {
        const absolutePath = "/abs/path/diff.json";

        await handler.handleUri(buildUri(absolutePath));

        expect(importStub.calledOnce).to.be.true;
        const [fileUriArg, optionsArg] = importStub.firstCall.args;
        expect(fileUriArg.fsPath).to.equal(vscode.Uri.file(absolutePath).fsPath);
        expect(optionsArg).to.deep.equal({ openFirstFile: true });
        expect(showErrorMessageStub.called).to.be.false;
    });

    it("does not call importMetadataDiff when filePath is missing", async () => {
        await handler.handleUri(
            vscode.Uri.parse("vscode://microsoft-IsvExpTools.powerplatform-vscode/metadataDiffImport")
        );

        expect(importStub.called).to.be.false;
        expect(showErrorMessageStub.calledOnce).to.be.true;
    });

    it("does not call importMetadataDiff when filePath is relative or contains '..'", async () => {
        await handler.handleUri(buildUri("relative/diff.json"));
        await handler.handleUri(buildUri("/abs/../etc/diff.json"));

        expect(importStub.called).to.be.false;
        expect(showErrorMessageStub.callCount).to.equal(2);
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

    it("dispatches /pacCreate to the PAC create handler", async () => {
        await handler.handleUri(makeUri(URI_CONSTANTS.PATHS.PAC_CREATE));

        expect(pacCreateStub.calledOnce).to.be.true;
        expect(agenticCreateStub.called).to.be.false;
        expect(pcfInitStub.called).to.be.false;
        expect(openStub.called).to.be.false;
    });

    it("ignores unknown paths without throwing", async () => {
        await handler.handleUri(makeUri("/someUnknownPath"));

        expect(pcfInitStub.called).to.be.false;
        expect(openStub.called).to.be.false;
        expect(agenticCreateStub.called).to.be.false;
        expect(pacCreateStub.called).to.be.false;
    });
});
