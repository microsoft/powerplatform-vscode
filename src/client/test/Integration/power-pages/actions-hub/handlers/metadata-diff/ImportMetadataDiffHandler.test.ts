/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import sinon from "sinon";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";

describe("ImportMetadataDiffHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let showOpenDialogStub: sinon.SinonStub;
    let showInformationMessageStub: sinon.SinonStub;
    let showErrorMessageStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showOpenDialogStub = sandbox.stub(vscode.window, "showOpenDialog");
        showInformationMessageStub = sandbox.stub(vscode.window, "showInformationMessage");
        showErrorMessageStub = sandbox.stub(vscode.window, "showErrorMessage");
        sandbox.stub(vscode.window, "showWarningMessage");
        // Stub telemetry helpers
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(TelemetryHelper, "traceError");
        // Clear context before each test
        MetadataDiffContext.clear();
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    describe("importMetadataDiff", () => {
        it("should prompt user to select file", async () => {
            showOpenDialogStub.resolves(undefined); // User cancelled

            // Import the module dynamically to ensure stubs are in place
            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff();

            expect(showOpenDialogStub.calledOnce).to.be.true;
            expect(showOpenDialogStub.firstCall.args[0]).to.have.property("filters");
        });

        it("should not proceed when user cancels file selection", async () => {
            showOpenDialogStub.resolves(undefined);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff();

            expect(showOpenDialogStub.calledOnce).to.be.true;
            expect(showInformationMessageStub.called).to.be.false;
            expect(showErrorMessageStub.called).to.be.false;
        });

        it("should not proceed when user selects empty array", async () => {
            showOpenDialogStub.resolves([]);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff();

            expect(showOpenDialogStub.calledOnce).to.be.true;
            expect(showInformationMessageStub.called).to.be.false;
        });

        it("should have JSON filter in open dialog", async () => {
            showOpenDialogStub.resolves(undefined);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff();

            const openDialogOptions = showOpenDialogStub.firstCall.args[0];
            expect(openDialogOptions.filters).to.have.property("Metadata Diff JSON");
            expect(openDialogOptions.filters["Metadata Diff JSON"]).to.include("json");
        });

        it("should not allow multiple file selection", async () => {
            showOpenDialogStub.resolves(undefined);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff();

            const openDialogOptions = showOpenDialogStub.firstCall.args[0];
            expect(openDialogOptions.canSelectMany).to.be.false;
        });

        it("should log telemetry on import start", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            showOpenDialogStub.resolves(undefined);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff();

            expect(traceInfoStub.called).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffImport");
        });
    });
});
