/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { clearMetadataDiff } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/ClearMetadataDiffHandler";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";

describe("ClearMetadataDiffHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let showWarningMessageStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, "sessionId").get(() => "test-session-id");
        showWarningMessageStub = sandbox.stub(vscode.window, "showWarningMessage");
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    describe("clearMetadataDiff", () => {
        it("should clear the metadata diff context when user confirms", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            showWarningMessageStub.resolves(Constants.Strings.CLEAR_ALL);

            await clearMetadataDiff();

            expect(MetadataDiffContext.comparisonResults).to.deep.equal([]);
            expect(MetadataDiffContext.siteName).to.equal("");
            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should not clear when user cancels", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            showWarningMessageStub.resolves(undefined); // User cancelled

            await clearMetadataDiff();

            expect(MetadataDiffContext.comparisonResults).to.have.lengthOf(1);
            expect(MetadataDiffContext.isActive).to.be.true;
        });

        it("should log telemetry event", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            showWarningMessageStub.resolves(Constants.Strings.CLEAR_ALL);

            await clearMetadataDiff();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffClear");
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "clearMetadataDiff"
            });
        });

        it("should show confirmation dialog with correct message", async () => {
            showWarningMessageStub.resolves(undefined);

            await clearMetadataDiff();

            expect(showWarningMessageStub.calledOnce).to.be.true;
            expect(showWarningMessageStub.firstCall.args[0]).to.equal(Constants.Strings.CLEAR_ALL_RESULTS_TITLE);
            expect(showWarningMessageStub.firstCall.args[1]).to.deep.equal({
                modal: true,
                detail: Constants.Strings.CLEAR_ALL_RESULTS_MESSAGE
            });
            expect(showWarningMessageStub.firstCall.args[2]).to.equal(Constants.Strings.CLEAR_ALL);
        });

        it("should work when context is already empty and user confirms", async () => {
            MetadataDiffContext.clear();
            showWarningMessageStub.resolves(Constants.Strings.CLEAR_ALL);

            await clearMetadataDiff();

            expect(MetadataDiffContext.comparisonResults).to.deep.equal([]);
            expect(MetadataDiffContext.isActive).to.be.false;
        });
    });
});
