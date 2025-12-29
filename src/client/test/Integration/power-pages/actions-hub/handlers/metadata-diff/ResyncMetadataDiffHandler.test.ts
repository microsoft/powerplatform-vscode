/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { resyncMetadataDiff } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/ResyncMetadataDiffHandler";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import { PacTerminal } from "../../../../../../lib/PacTerminal";
import { MetadataDiffSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffSiteTreeItem";
import { ISiteComparisonResults, FileComparisonStatus } from "../../../../../../power-pages/actions-hub/models/IFileComparisonResult";
import { SiteVisibility } from "../../../../../../power-pages/actions-hub/models/SiteVisibility";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import * as WorkspaceInfoFinderUtil from "../../../../../../../common/utilities/WorkspaceInfoFinderUtil";
import * as MetadataDiffUtils from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/MetadataDiffUtils";

describe("ResyncMetadataDiffHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowErrorMessage: sinon.SinonStub;
    let mockShowWarningMessage: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let mockPacTerminal: sinon.SinonStubbedInstance<PacTerminal>;
    let mockExtensionContext: vscode.ExtensionContext;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowErrorMessage = sandbox.stub(vscode.window, "showErrorMessage");
        mockShowWarningMessage = sandbox.stub(vscode.window, "showWarningMessage");
        sandbox.stub(vscode.window, "showInformationMessage");
        traceInfoStub = sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(TelemetryHelper, "traceError");
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: "bar" });
        sandbox.stub(vscode.env, "sessionId").get(() => "test-session-id");

        // Mock PacTerminal
        mockPacTerminal = sandbox.createStubInstance(PacTerminal);

        // Mock ExtensionContext
        mockExtensionContext = {
            storageUri: { fsPath: "/test/storage/path" }
        } as unknown as vscode.ExtensionContext;

        // Clear MetadataDiffContext before each test
        MetadataDiffContext.clear();
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    function createMockSiteComparisonResults(overrides: Partial<ISiteComparisonResults> = {}): ISiteComparisonResults {
        return {
            siteName: "Test Site",
            localSiteName: "Local Site",
            environmentName: "Test Environment",
            websiteId: "test-website-id",
            environmentId: "test-environment-id",
            comparisonResults: [
                {
                    localPath: "/local/path/file.html",
                    remotePath: "/remote/path/file.html",
                    relativePath: "file.html",
                    status: FileComparisonStatus.MODIFIED
                }
            ],
            isImported: false,
            dataModelVersion: 2,
            websiteUrl: "https://test-site.powerappsportals.com",
            siteVisibility: SiteVisibility.Public,
            creator: "test-creator@contoso.com",
            createdOn: "2024-01-15T10:30:00Z",
            ...overrides
        };
    }

    function createMockSiteTreeItem(overrides: Partial<ISiteComparisonResults> = {}): MetadataDiffSiteTreeItem {
        const siteResults = createMockSiteComparisonResults(overrides);
        return new MetadataDiffSiteTreeItem(siteResults);
    }

    describe("resyncMetadataDiff", () => {
        describe("when site is imported", () => {
            it("should show warning message and not proceed", async () => {
                const siteItem = createMockSiteTreeItem({ isImported: true });

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(mockShowWarningMessage.calledOnce).to.be.true;
                expect(mockShowWarningMessage.firstCall.args[0]).to.equal(Constants.Strings.METADATA_DIFF_CANNOT_RESYNC_IMPORTED);
            });

            it("should log telemetry event", async () => {
                const siteItem = createMockSiteTreeItem({ isImported: true });

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_CALLED)).to.be.true;
                const callArgs = traceInfoStub.getCalls().find(
                    call => call.args[0] === Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_CALLED
                )?.args[1];
                expect(callArgs).to.deep.include({
                    methodName: "resyncMetadataDiff",
                    isImported: true
                });
            });
        });

        describe("when no workspace folders exist", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => undefined);
            });

            it("should show error message", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
            });

            it("should log telemetry event", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_WORKSPACE)).to.be.true;
            });
        });

        describe("when workspace folders are empty", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => []);
            });

            it("should show error message", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
            });
        });

        describe("when website ID is not found", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns(undefined as unknown as string);
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(undefined as unknown as string);
            });

            it("should show error message", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.WEBSITE_ID_NOT_FOUND);
            });

            it("should log telemetry event", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_WEBSITE_ID_NOT_FOUND)).to.be.true;
            });
        });

        describe("when storage path is not available", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-site-id");
            });

            it("should return early without error", async () => {
                const contextWithoutStorage = {
                    storageUri: undefined
                } as unknown as vscode.ExtensionContext;

                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, contextWithoutStorage);
                await handler(siteItem);

                expect(mockShowErrorMessage.called).to.be.false;
            });
        });

        describe("telemetry", () => {
            it("should log initial telemetry event when handler is called", async () => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => undefined);

                const siteItem = createMockSiteTreeItem({
                    websiteId: "my-site-id",
                    environmentId: "my-env-id",
                    siteName: "My Site",
                    environmentName: "My Environment"
                });

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_CALLED)).to.be.true;
                const callArgs = traceInfoStub.getCalls().find(
                    call => call.args[0] === Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_RESYNC_CALLED
                )?.args[1];
                expect(callArgs).to.deep.include({
                    methodName: "resyncMetadataDiff",
                    siteName: "My Site",
                    environmentName: "My Environment",
                    websiteId: "my-site-id",
                    environmentId: "my-env-id",
                    isImported: false
                });
            });
        });

        describe("when resync completes with no differences", () => {
            let mockPacWrapper: {
                downloadSiteWithProgress: sinon.SinonStub;
            };
            let clearSiteByKeyStub: sinon.SinonStub;
            let processComparisonResultsStub: sinon.SinonStub;

            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                // Stub prepareSiteStoragePath to return a test path
                sandbox.stub(MetadataDiffUtils, "prepareSiteStoragePath").returns("/test/storage/sites-for-comparison/test-website-id");

                mockPacWrapper = {
                    downloadSiteWithProgress: sandbox.stub().resolves(true)
                };
                mockPacTerminal.getWrapper.returns(mockPacWrapper as unknown as ReturnType<PacTerminal["getWrapper"]>);

                // Stub processComparisonResults to return false (no differences)
                processComparisonResultsStub = sandbox.stub(MetadataDiffUtils, "processComparisonResults").resolves(false);

                // Set up initial comparison results
                MetadataDiffContext.setResults(
                    [{
                        localPath: "/local/path/file.html",
                        remotePath: "/remote/path/file.html",
                        relativePath: "file.html",
                        status: FileComparisonStatus.MODIFIED
                    }],
                    "Test Site",
                    "Local Site",
                    "Test Environment",
                    "test-website-id",
                    "test-environment-id",
                    false
                );

                clearSiteByKeyStub = sandbox.stub(MetadataDiffContext, "clearSiteByKey");
            });

            it("should clear the site from MetadataDiffContext when no differences found", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(clearSiteByKeyStub.calledOnce).to.be.true;
                expect(clearSiteByKeyStub.firstCall.args[0]).to.equal("test-website-id");
                expect(clearSiteByKeyStub.firstCall.args[1]).to.equal("test-environment-id");
                expect(clearSiteByKeyStub.firstCall.args[2]).to.equal(false);
            });

            it("should call processComparisonResults with correct parameters", async () => {
                const siteItem = createMockSiteTreeItem({
                    dataModelVersion: 2
                });

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(processComparisonResultsStub.calledOnce).to.be.true;
                const callArgs = processComparisonResultsStub.firstCall.args;
                expect(callArgs[2]).to.equal("Test Site"); // siteName
                expect(callArgs[3]).to.equal("Local Site"); // localSiteName
                expect(callArgs[4]).to.equal("Test Environment"); // environmentName
                expect(callArgs[11]).to.equal(2); // dataModelVersion
            });
        });

        describe("when resync completes with differences", () => {
            let mockPacWrapper: {
                downloadSiteWithProgress: sinon.SinonStub;
            };
            let clearSiteByKeyStub: sinon.SinonStub;
            let mockShowInformationMessage: sinon.SinonStub;

            beforeEach(() => {
                sandbox.restore(); // Restore to avoid conflicts

                sandbox = sinon.createSandbox();
                mockShowErrorMessage = sandbox.stub(vscode.window, "showErrorMessage");
                mockShowWarningMessage = sandbox.stub(vscode.window, "showWarningMessage");
                mockShowInformationMessage = sandbox.stub(vscode.window, "showInformationMessage");
                traceInfoStub = sandbox.stub(TelemetryHelper, "traceInfo");
                sandbox.stub(TelemetryHelper, "traceError");
                sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: "bar" });
                sandbox.stub(vscode.env, "sessionId").get(() => "test-session-id");

                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                // Stub prepareSiteStoragePath to return a test path
                sandbox.stub(MetadataDiffUtils, "prepareSiteStoragePath").returns("/test/storage/sites-for-comparison/test-website-id");

                mockPacWrapper = {
                    downloadSiteWithProgress: sandbox.stub().resolves(true)
                };

                mockPacTerminal = sandbox.createStubInstance(PacTerminal);
                mockPacTerminal.getWrapper.returns(mockPacWrapper as unknown as ReturnType<PacTerminal["getWrapper"]>);

                // Stub processComparisonResults to return true (has differences)
                sandbox.stub(MetadataDiffUtils, "processComparisonResults").resolves(true);

                clearSiteByKeyStub = sandbox.stub(MetadataDiffContext, "clearSiteByKey");
            });

            it("should not clear the site from MetadataDiffContext when differences are found", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(clearSiteByKeyStub.called).to.be.false;
            });

            it("should show success information message when differences are found", async () => {
                const siteItem = createMockSiteTreeItem();

                const handler = resyncMetadataDiff(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(siteItem);

                expect(mockShowInformationMessage.calledOnce).to.be.true;
                expect(mockShowInformationMessage.firstCall.args[0]).to.equal(Constants.Strings.METADATA_DIFF_RESYNC_COMPLETED);
            });
        });
    });
});
