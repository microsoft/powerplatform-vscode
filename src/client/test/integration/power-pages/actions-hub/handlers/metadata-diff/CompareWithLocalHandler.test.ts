/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { compareWithLocal } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/CompareWithLocalHandler";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import { PacTerminal } from "../../../../../../lib/PacTerminal";
import { SiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/SiteTreeItem";
import { IWebsiteInfo } from "../../../../../../power-pages/actions-hub/models/IWebsiteInfo";
import { WebsiteStatus } from "../../../../../../power-pages/actions-hub/models/WebsiteStatus";
import { SiteVisibility } from "../../../../../../power-pages/actions-hub/models/SiteVisibility";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import * as WorkspaceInfoFinderUtil from "../../../../../../../common/utilities/WorkspaceInfoFinderUtil";
import * as MetadataDiffUtils from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/MetadataDiffUtils";

describe("CompareWithLocalHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowErrorMessage: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let mockPacTerminal: sinon.SinonStubbedInstance<PacTerminal>;
    let mockExtensionContext: vscode.ExtensionContext;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowErrorMessage = sandbox.stub(vscode.window, "showErrorMessage");
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

    function createMockSiteTreeItem(overrides: Partial<IWebsiteInfo> = {}): SiteTreeItem {
        const defaultSiteInfo: IWebsiteInfo = {
            name: "Test Site",
            websiteId: "test-site-id",
            dataModelVersion: 2,
            status: WebsiteStatus.Active,
            websiteUrl: "https://test-site.com",
            isCurrent: true,
            siteVisibility: SiteVisibility.Public,
            siteManagementUrl: "https://management.com",
            createdOn: "2025-03-20",
            creator: "Test Creator",
            isCodeSite: false,
            ...overrides
        };
        return new SiteTreeItem(defaultSiteInfo);
    }

    describe("compareWithLocal", () => {
        describe("when no workspace folders exist", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => undefined);
            });

            it("should show error message", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem());

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
            });

            it("should log telemetry event", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem());

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_WORKSPACE)).to.be.true;
            });
        });

        describe("when workspace folders are empty", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => []);
            });

            it("should show error message", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem());

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
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem());

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.WEBSITE_ID_NOT_FOUND);
            });

            it("should log telemetry event", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem());

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

                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, contextWithoutStorage);
                await handler(createMockSiteTreeItem());

                expect(mockShowErrorMessage.called).to.be.false;
            });
        });

        describe("telemetry", () => {
            it("should log initial telemetry event when handler is called", async () => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => undefined);

                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem({ websiteId: "my-site-id", dataModelVersion: 2 }));

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_CALLED)).to.be.true;
                const callArgs = traceInfoStub.getCalls().find(
                    call => call.args[0] === Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_CALLED
                )?.args[1];
                expect(callArgs).to.deep.include({
                    methodName: "compareWithLocal",
                    siteId: "my-site-id",
                    dataModelVersion: 2
                });
            });
        });

        describe("finding website ID from nested folder", () => {
            it("should find website ID from Power Pages site folder when not found in workspace root", async () => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);

                const getWebsiteRecordIdStub = sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId");
                getWebsiteRecordIdStub.onFirstCall().returns(undefined as unknown as string);
                getWebsiteRecordIdStub.onSecondCall().returns(undefined as unknown as string);

                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns("/test/workspace/site-folder");

                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem());

                // Should have attempted to get website ID from both locations
                expect(getWebsiteRecordIdStub.calledTwice).to.be.true;
            });
        });

        describe("code site download behavior", () => {
            let mockPacWrapper: {
                downloadSiteWithProgress: sinon.SinonStub;
                downloadCodeSiteWithProgress: sinon.SinonStub;
            };

            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-site-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);
                sandbox.stub(MetadataDiffUtils, "prepareSiteStoragePath").returns("/test/storage/sites-for-comparison");

                mockPacWrapper = {
                    downloadSiteWithProgress: sandbox.stub().resolves(false), // Return false to stop after download
                    downloadCodeSiteWithProgress: sandbox.stub().resolves(false)
                };
                mockPacTerminal.getWrapper.returns(mockPacWrapper as unknown as ReturnType<PacTerminal["getWrapper"]>);
            });

            it("should use downloadSiteWithProgress for regular sites", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem({ isCodeSite: false }));

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.downloadCodeSiteWithProgress.called).to.be.false;
            });

            it("should use downloadCodeSiteWithProgress for code sites", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem({ isCodeSite: true }));

                expect(mockPacWrapper.downloadCodeSiteWithProgress.calledOnce).to.be.true;
                expect(mockPacWrapper.downloadSiteWithProgress.called).to.be.false;
            });

            it("should pass websiteId to downloadCodeSiteWithProgress for code sites", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem({ isCodeSite: true, websiteId: "code-site-123" }));

                expect(mockPacWrapper.downloadCodeSiteWithProgress.calledOnce).to.be.true;
                const callArgs = mockPacWrapper.downloadCodeSiteWithProgress.firstCall.args;
                expect(callArgs[1]).to.equal("code-site-123"); // websiteId
            });

            it("should pass websiteId and dataModelVersion to downloadSiteWithProgress for regular sites", async () => {
                const handler = compareWithLocal(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(createMockSiteTreeItem({ isCodeSite: false, websiteId: "regular-site-123", dataModelVersion: 2 }));

                expect(mockPacWrapper.downloadSiteWithProgress.calledOnce).to.be.true;
                const callArgs = mockPacWrapper.downloadSiteWithProgress.firstCall.args;
                expect(callArgs[1]).to.equal("regular-site-123"); // websiteId
                expect(callArgs[2]).to.equal(2); // dataModelVersion
            });
        });
    });
});
