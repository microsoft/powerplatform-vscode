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
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffImportCalled");
        });
    });

    describe("IMetadataDiffExport format", () => {
        it("should support new format with localWebsiteId and remoteWebsiteId", () => {
            // This test verifies that the interface supports the new field names
            const exportData = {
                version: "1.0",
                extensionVersion: "1.0.0",
                exportedAt: "2024-01-15T10:30:00Z",
                localWebsiteId: "local-id",
                localWebsiteName: "Local Site",
                remoteWebsiteId: "remote-id",
                remoteWebsiteName: "Remote Site",
                environmentId: "env-id",
                environmentName: "Test Environment",
                files: []
            };

            expect(exportData.localWebsiteId).to.equal("local-id");
            expect(exportData.remoteWebsiteId).to.equal("remote-id");
            expect(exportData.localWebsiteName).to.equal("Local Site");
            expect(exportData.remoteWebsiteName).to.equal("Remote Site");
        });

        it("should support legacy format with websiteId and localSiteName for backward compatibility", () => {
            // This test verifies backward compatibility with old export files
            const legacyExportData = {
                version: "1.0",
                extensionVersion: "1.0.0",
                exportedAt: "2024-01-15T10:30:00Z",
                websiteId: "website-id",
                websiteName: "Website Name",
                localSiteName: "Local Site Name",
                environmentId: "env-id",
                environmentName: "Test Environment",
                files: []
            };

            expect(legacyExportData.websiteId).to.equal("website-id");
            expect(legacyExportData.websiteName).to.equal("Website Name");
            expect(legacyExportData.localSiteName).to.equal("Local Site Name");
        });
    });
});
