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

describe("ClearMetadataDiffHandler", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, "sessionId").get(() => "test-session-id");
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    describe("clearMetadataDiff", () => {
        it("should clear the metadata diff context", () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Test Environment");

            clearMetadataDiff();

            expect(MetadataDiffContext.comparisonResults).to.deep.equal([]);
            expect(MetadataDiffContext.siteName).to.equal("");
            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should log telemetry event", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            clearMetadataDiff();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffClear");
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "clearMetadataDiff"
            });
        });

        it("should work when context is already empty", () => {
            MetadataDiffContext.clear();

            clearMetadataDiff();

            expect(MetadataDiffContext.comparisonResults).to.deep.equal([]);
            expect(MetadataDiffContext.isActive).to.be.false;
        });
    });
});
