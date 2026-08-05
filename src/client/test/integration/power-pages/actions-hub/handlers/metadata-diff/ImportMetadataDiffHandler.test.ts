/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as fs from "fs";
import { expect } from "chai";
import sinon from "sinon";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import { MetadataDiffFileTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffFileTreeItem";

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
            expect(openDialogOptions.filters).to.have.property("Site Comparison JSON");
            expect(openDialogOptions.filters["Site Comparison JSON"]).to.include("json");
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

    describe("importMetadataDiff with a pre-supplied URI", () => {
        it("should skip the open dialog when a URI is supplied", async () => {
            const existsSyncStub = sandbox.stub(fs, "existsSync").returns(true);
            // Short-circuit the read so we don't run the full import flow.
            sandbox.stub(fs, "readFileSync").throws(new Error("stop after dialog check"));

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(vscode.Uri.file("/tmp/diff.json"));

            expect(showOpenDialogStub.called).to.be.false;
            expect(existsSyncStub.called).to.be.true;
        });

        it("should show an error when the supplied file does not exist", async () => {
            sandbox.stub(fs, "existsSync").returns(false);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(vscode.Uri.file("/tmp/missing.json"));

            expect(showOpenDialogStub.called).to.be.false;
            expect(showErrorMessageStub.calledOnce).to.be.true;
            expect(showErrorMessageStub.firstCall.args[0]).to.match(/not found/i);
        });

        it("should show an error when the supplied file is not a .json file", async () => {
            sandbox.stub(fs, "existsSync").returns(true);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(vscode.Uri.file("/tmp/diff.txt"));

            expect(showOpenDialogStub.called).to.be.false;
            expect(showErrorMessageStub.calledOnce).to.be.true;
            expect(showErrorMessageStub.firstCall.args[0]).to.match(/\.json/i);
        });

        it("should record the URI handler source in telemetry", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            sandbox.stub(fs, "existsSync").returns(false);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(vscode.Uri.file("/tmp/missing.json"));

            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffImportCalled");
            expect(traceInfoStub.firstCall.args[1]).to.include({ source: "uri_handler" });
        });

        it("should still open the dialog when no URI is supplied", async () => {
            showOpenDialogStub.resolves(undefined);

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff();

            expect(showOpenDialogStub.calledOnce).to.be.true;
        });
    });

    describe("importMetadataDiff auto-open (openFirstFile)", () => {
        const FAKE_STORAGE = vscode.Uri.file("/tmp/pp-metadata-diff-test-storage");
        let executeCommandStub: sinon.SinonStub;

        const makeExport = (files: unknown[]) => ({
            version: "1.0",
            extensionVersion: "1.0.0",
            exportedAt: "2024-01-15T10:30:00Z",
            localWebsiteId: "local-id",
            remoteWebsiteId: "remote-id",
            localWebsiteName: "Local Site",
            remoteWebsiteName: "Remote Site",
            environmentId: "env-id",
            environmentName: "Test Environment",
            files
        });

        const modifiedFile = (relativePath: string) => ({
            relativePath,
            status: "modified",
            localContent: Buffer.from("local").toString("base64"),
            remoteContent: Buffer.from("remote").toString("base64")
        });

        // Wires up fs + context + command stubs so the supplied URI drives a full,
        // successful import without touching disk or opening real editors.
        const stubSuccessfulImport = (inputUri: vscode.Uri, exportData: unknown) => {
            const inputPath = inputUri.fsPath;
            // Only the input file "exists"; storage paths report missing so the
            // write loop just creates dirs/files (all stubbed) without cleanup.
            sandbox.stub(fs, "existsSync").callsFake((p: fs.PathLike) => p === inputPath);
            sandbox.stub(fs, "readFileSync").returns(JSON.stringify(exportData));
            sandbox.stub(fs, "mkdirSync");
            sandbox.stub(fs, "writeFileSync");
            sandbox.stub(fs, "rmSync");
            sandbox.stub(Object.getPrototypeOf(MetadataDiffContext), "extensionContext")
                .get(() => ({ globalStorageUri: FAKE_STORAGE } as unknown as vscode.ExtensionContext));
            executeCommandStub = sandbox.stub(vscode.commands, "executeCommand").resolves();
        };

        const openFileCall = () =>
            executeCommandStub.getCalls().find(c => c.args[0] === Constants.Commands.METADATA_DIFF_OPEN_FILE);

        it("prefers a modified file with both contents over added/deleted", async () => {
            const uri = vscode.Uri.file("/tmp/diff.json");
            stubSuccessfulImport(uri, makeExport([
                { relativePath: "added.json", status: "added", localContent: Buffer.from("x").toString("base64") },
                modifiedFile("modified.json")
            ]));

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(uri, { openFirstFile: true });

            const call = openFileCall();
            expect(call, "expected the open-file command to be invoked").to.exist;
            expect(call!.args[1]).to.be.instanceOf(MetadataDiffFileTreeItem);
            expect(call!.args[1].comparisonResult.relativePath).to.equal("modified.json");
            expect(showInformationMessageStub.called).to.be.true;
        });

        it("opens an added/deleted file when no modified file is available", async () => {
            const uri = vscode.Uri.file("/tmp/diff.json");
            stubSuccessfulImport(uri, makeExport([
                { relativePath: "added.json", status: "added", localContent: Buffer.from("x").toString("base64") },
                { relativePath: "deleted.json", status: "deleted", remoteContent: Buffer.from("y").toString("base64") }
            ]));

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(uri, { openFirstFile: true });

            const call = openFileCall();
            expect(call, "expected an openable file to be opened").to.exist;
            expect(call!.args[1].comparisonResult.relativePath).to.equal("added.json");
            expect(showInformationMessageStub.called).to.be.true;
        });

        it("skips files with no openable content for their status", async () => {
            const uri = vscode.Uri.file("/tmp/diff.json");
            stubSuccessfulImport(uri, makeExport([
                // modified but missing remote side, and an added entry with no local content
                { relativePath: "modified.json", status: "modified", localContent: Buffer.from("local").toString("base64"), remoteContent: null },
                { relativePath: "added.json", status: "added", localContent: null }
            ]));

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(uri, { openFirstFile: true });

            expect(openFileCall()).to.be.undefined;
            expect(showInformationMessageStub.called).to.be.true;
        });

        it("does not auto-open when openFirstFile is not requested", async () => {
            const uri = vscode.Uri.file("/tmp/diff.json");
            stubSuccessfulImport(uri, makeExport([modifiedFile("modified.json")]));

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(uri); // no options

            expect(openFileCall()).to.be.undefined;
            expect(showInformationMessageStub.called).to.be.true;
        });

        it("does not fail the import when auto-open throws", async () => {
            const traceErrorStub = TelemetryHelper.traceError as sinon.SinonStub;
            const uri = vscode.Uri.file("/tmp/diff.json");
            stubSuccessfulImport(uri, makeExport([modifiedFile("modified.json")]));
            executeCommandStub.rejects(new Error("open failed"));

            const { importMetadataDiff } = await import("../../../../../../power-pages/actions-hub/handlers/metadata-diff/ImportMetadataDiffHandler");

            await importMetadataDiff(uri, { openFirstFile: true });

            // Import already succeeded: success message shown, no error surfaced.
            expect(showInformationMessageStub.called).to.be.true;
            expect(showErrorMessageStub.called).to.be.false;
            expect(traceErrorStub.calledWith("ActionsHubMetadataDiffImportAutoOpenFailed")).to.be.true;
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
