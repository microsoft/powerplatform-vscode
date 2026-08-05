/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import sinon from "sinon";
import { UriHandler } from "../../uriHandler/uriHandler";
import * as ImportMetadataDiffHandler from "../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

describe("UriHandler - metadataDiffImport", () => {
    let sandbox: sinon.SinonSandbox;
    let importStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;

    const buildUri = (filePath: string) =>
        vscode.Uri.parse(
            `vscode://microsoft-IsvExpTools.powerplatform-vscode/metadataDiffImport?filePath=${encodeURIComponent(filePath)}`
        );

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        importStub = sandbox.stub(ImportMetadataDiffHandler, "importMetadataDiff").resolves();
        showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
        // Telemetry is a no-op when uninitialized; stub to keep the test hermetic.
        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns({
            traceInfo: () => { /* no-op */ },
            traceError: () => { /* no-op */ },
            traceWarning: () => { /* no-op */ },
            featureUsage: () => { /* no-op */ }
        } as unknown as ReturnType<typeof oneDSLoggerWrapper.getLogger>);
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("routes /metadataDiffImport and calls importMetadataDiff with the file URI and { openFirstFile: true }", async () => {
        const handler = new UriHandler({} as never);
        const absolutePath = "/abs/path/diff.json";

        await handler.handleUri(buildUri(absolutePath));

        expect(importStub.calledOnce).to.be.true;
        const [fileUriArg, optionsArg] = importStub.firstCall.args;
        expect(fileUriArg.fsPath).to.equal(vscode.Uri.file(absolutePath).fsPath);
        expect(optionsArg).to.deep.equal({ openFirstFile: true });
        expect(showErrorMessageStub.called).to.be.false;
    });

    it("does not call importMetadataDiff when filePath is missing", async () => {
        const handler = new UriHandler({} as never);

        await handler.handleUri(
            vscode.Uri.parse("vscode://microsoft-IsvExpTools.powerplatform-vscode/metadataDiffImport")
        );

        expect(importStub.called).to.be.false;
        expect(showErrorMessageStub.calledOnce).to.be.true;
    });

    it("does not call importMetadataDiff when filePath is relative or contains '..'", async () => {
        const handler = new UriHandler({} as never);

        await handler.handleUri(buildUri("relative/diff.json"));
        await handler.handleUri(buildUri("/abs/../etc/diff.json"));

        expect(importStub.called).to.be.false;
        expect(showErrorMessageStub.callCount).to.equal(2);
    });
});
