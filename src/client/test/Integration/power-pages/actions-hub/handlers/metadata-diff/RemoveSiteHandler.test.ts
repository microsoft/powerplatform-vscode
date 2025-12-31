/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { removeSiteComparison } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/RemoveSiteHandler";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { IFileComparisonResult } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";

describe("RemoveSiteHandler", () => {
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

    function createSiteTreeItem(siteName: string): MetadataDiffSiteTreeItem {
        const results: IFileComparisonResult[] = [
            {
                localPath: "/local/file.txt",
                remotePath: "/remote/file.txt",
                relativePath: "file.txt",
                status: "modified"
            }
        ];

        return new MetadataDiffSiteTreeItem({
            siteName,
            localSiteName: `Local ${siteName}`,
            environmentName: "Test Environment",
            websiteId: "test-website-id",
            environmentId: "test-environment-id",
            comparisonResults: results
        });
    }

    describe("removeSiteComparison", () => {
        it("should remove the site comparison when user confirms", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            const siteItem = createSiteTreeItem("Test Site");
            showWarningMessageStub.resolves(Constants.Strings.CLEAR);

            await removeSiteComparison(siteItem);

            expect(MetadataDiffContext.isActive).to.be.false;
        });

        it("should not remove when user cancels", async () => {
            const results: IFileComparisonResult[] = [
                {
                    localPath: "/local/file.txt",
                    remotePath: "/remote/file.txt",
                    relativePath: "file.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results, "Test Site", "Local Test Site", "Test Environment", "test-website-id", "test-environment-id");
            const siteItem = createSiteTreeItem("Test Site");
            showWarningMessageStub.resolves(undefined); // User cancelled

            await removeSiteComparison(siteItem);

            expect(MetadataDiffContext.isActive).to.be.true;
        });

        it("should log telemetry event", async () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;
            const siteItem = createSiteTreeItem("Test Site");
            showWarningMessageStub.resolves(Constants.Strings.CLEAR);

            await removeSiteComparison(siteItem);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal("ActionsHubMetadataDiffClear");
            expect(traceInfoStub.firstCall.args[1]).to.deep.include({
                methodName: "removeSiteComparison",
                siteName: "Test Site"
            });
        });

        it("should show confirmation dialog with correct message", async () => {
            const siteItem = createSiteTreeItem("Test Site");
            showWarningMessageStub.resolves(undefined);

            await removeSiteComparison(siteItem);

            expect(showWarningMessageStub.calledOnce).to.be.true;
            expect(showWarningMessageStub.firstCall.args[0]).to.equal(Constants.Strings.CLEAR_RESULT_TITLE);
            expect(showWarningMessageStub.firstCall.args[1]).to.deep.equal({
                modal: true,
                detail: Constants.Strings.CLEAR_RESULT_MESSAGE
            });
            expect(showWarningMessageStub.firstCall.args[2]).to.equal(Constants.Strings.CLEAR);
        });

        it("should only remove the specified site when multiple sites exist", async () => {
            // Add first site
            const results1: IFileComparisonResult[] = [
                {
                    localPath: "/local/file1.txt",
                    remotePath: "/remote/file1.txt",
                    relativePath: "file1.txt",
                    status: "modified"
                }
            ];
            MetadataDiffContext.setResults(results1, "Site 1", "Local Site 1", "Environment 1", "website-id-1", "environment-id-1");

            // Add second site
            const results2: IFileComparisonResult[] = [
                {
                    localPath: "/local/file2.txt",
                    remotePath: "/remote/file2.txt",
                    relativePath: "file2.txt",
                    status: "added"
                }
            ];
            MetadataDiffContext.setResults(results2, "Site 2", "Local Site 2", "Environment 2", "website-id-2", "environment-id-2");

            const siteItem = createSiteTreeItem("Site 1");
            showWarningMessageStub.resolves(Constants.Strings.CLEAR);

            await removeSiteComparison(siteItem);

            // Site 2 should still be active
            expect(MetadataDiffContext.isActive).to.be.true;
            expect(MetadataDiffContext.allSiteResults).to.have.lengthOf(1);
            expect(MetadataDiffContext.allSiteResults[0].siteName).to.equal("Site 2");
        });
    });
});
