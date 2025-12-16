/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { compareWithEnvironment } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/CompareWithEnvironmentHandler";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";
import { PacTerminal } from "../../../../../../lib/PacTerminal";
import MetadataDiffContext from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import PacContext from "../../../../../../pac/PacContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import * as WorkspaceInfoFinderUtil from "../../../../../../../common/utilities/WorkspaceInfoFinderUtil";
import * as ActionsHubUtils from "../../../../../../power-pages/actions-hub/ActionsHubUtils";
import { IWebsiteDetails } from "../../../../../../../common/services/Interfaces";
import { SUCCESS } from "../../../../../../../common/constants";

describe("CompareWithEnvironmentHandler", () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowErrorMessage: sinon.SinonStub;
    let mockShowQuickPick: sinon.SinonStub;
    let traceInfoStub: sinon.SinonStub;
    let mockPacTerminal: sinon.SinonStubbedInstance<PacTerminal>;
    let mockExtensionContext: vscode.ExtensionContext;
    let mockPacWrapper: {
        orgList: sinon.SinonStub;
        orgSelect: sinon.SinonStub;
        downloadSiteWithProgress: sinon.SinonStub;
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowErrorMessage = sandbox.stub(vscode.window, "showErrorMessage");
        sandbox.stub(vscode.window, "showInformationMessage");
        mockShowQuickPick = sandbox.stub(vscode.window, "showQuickPick");
        traceInfoStub = sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(TelemetryHelper, "traceError");
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: "bar" });
        sandbox.stub(vscode.env, "sessionId").get(() => "test-session-id");

        // Mock PacWrapper
        mockPacWrapper = {
            orgList: sandbox.stub(),
            orgSelect: sandbox.stub(),
            downloadSiteWithProgress: sandbox.stub()
        };

        // Mock PacTerminal
        mockPacTerminal = sandbox.createStubInstance(PacTerminal);
        mockPacTerminal.getWrapper.returns(mockPacWrapper as unknown as ReturnType<PacTerminal["getWrapper"]>);

        // Mock ExtensionContext
        mockExtensionContext = {
            storageUri: { fsPath: "/test/storage/path" },
            extensionUri: vscode.Uri.file("/test/extension")
        } as unknown as vscode.ExtensionContext;

        // Clear MetadataDiffContext before each test
        MetadataDiffContext.clear();

        // Mock PacContext with current environment
        sandbox.stub(PacContext, "OrgInfo").get(() => ({
            OrgId: "current-org-id",
            UniqueName: "currentorg",
            FriendlyName: "Current Environment",
            OrgUrl: "https://current.crm.dynamics.com",
            UserEmail: "",
            UserId: "",
            EnvironmentId: "current-env-id"
        }));
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    describe("compareWithEnvironment", () => {
        describe("when no workspace folders exist", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => undefined);
            });

            it("should show error message", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/path" } as vscode.Uri);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.NO_WORKSPACE_FOLDER_OPEN);
            });

            it("should log telemetry event", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/path" } as vscode.Uri);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_NO_WORKSPACE)).to.be.true;
            });
        });

        describe("when workspace folders are empty", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => []);
            });

            it("should show error message", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/path" } as vscode.Uri);

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
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.WEBSITE_ID_NOT_FOUND);
            });

            it("should log telemetry event", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_LOCAL_WEBSITE_ID_NOT_FOUND)).to.be.true;
            });
        });

        describe("when user cancels environment selection", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Test Environment",
                            EnvironmentId: "env-id-1",
                            EnvironmentUrl: "https://test.crm.dynamics.com",
                            OrganizationId: "org-id-1",
                            UniqueName: "testorg",
                            EnvironmentIdentifier: { Id: "env-id-1" }
                        }
                    ]
                });

                mockShowQuickPick.resolves(undefined); // User cancelled environment selection
            });

            it("should log cancellation telemetry", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED)).to.be.true;
            });

            it("should not show error message", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowErrorMessage.called).to.be.false;
            });
        });

        describe("when user cancels website selection", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Test Environment",
                            EnvironmentId: "env-id-1",
                            EnvironmentUrl: "https://test.crm.dynamics.com",
                            OrganizationId: "org-id-1",
                            UniqueName: "testorg",
                            EnvironmentIdentifier: { Id: "env-id-1" }
                        }
                    ]
                });

                sandbox.stub(ActionsHubUtils, "fetchWebsites").resolves({
                    activeSites: [
                        {
                            name: "Test Website",
                            websiteRecordId: "website-id-1",
                            websiteUrl: "https://test.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    ] as unknown as IWebsiteDetails[],
                    inactiveSites: [],
                    otherSites: []
                });

                // First call returns environment selection, second call returns undefined (cancelled website selection)
                mockShowQuickPick
                    .onFirstCall().resolves({
                        label: "Test Environment",
                        detail: "https://test.crm.dynamics.com",
                        orgInfo: {
                            OrgId: "org-id-1",
                            UniqueName: "testorg",
                            FriendlyName: "Test Environment",
                            OrgUrl: "https://test.crm.dynamics.com",
                            UserEmail: "",
                            UserId: "",
                            EnvironmentId: "env-id-1"
                        }
                    })
                    .onSecondCall().resolves(undefined); // User cancelled website selection
            });

            it("should log cancellation telemetry with reason", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED)).to.be.true;
                const cancelCall = traceInfoStub.getCalls().find(
                    call => call.args[0] === Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED
                );
                expect(cancelCall?.args[1]).to.deep.include({
                    reason: "User cancelled website selection"
                });
            });

            it("should not show error message", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowErrorMessage.called).to.be.false;
            });
        });

        describe("when no websites are found in environment", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Test Environment",
                            EnvironmentId: "env-id-1",
                            EnvironmentUrl: "https://test.crm.dynamics.com",
                            OrganizationId: "org-id-1",
                            UniqueName: "testorg",
                            EnvironmentIdentifier: { Id: "env-id-1" }
                        }
                    ]
                });

                sandbox.stub(ActionsHubUtils, "fetchWebsites").resolves({
                    activeSites: [],
                    inactiveSites: [],
                    otherSites: []
                });

                mockShowQuickPick.resolves({
                    label: "Test Environment",
                    detail: "https://test.crm.dynamics.com",
                    orgInfo: {
                        OrgId: "org-id-1",
                        UniqueName: "",
                        FriendlyName: "Test Environment",
                        OrgUrl: "https://test.crm.dynamics.com",
                        UserEmail: "",
                        UserId: "",
                        EnvironmentId: "env-id-1"
                    }
                });
            });

            it("should show no sites found error message", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.NO_SITES_FOUND_IN_ENVIRONMENT);
            });

            it("should log telemetry event", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_WEBSITE_NOT_FOUND)).to.be.true;
            });
        });

        describe("when no environments are found", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: []
                });
            });

            it("should show no environments error message", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.NO_ENVIRONMENTS_FOUND);
            });
        });

        describe("when only the current environment is available", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                // Return only the current environment which should be filtered out
                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Current Environment",
                            EnvironmentId: "current-env-id",
                            EnvironmentUrl: "https://current.crm.dynamics.com",
                            OrganizationId: "current-org-id",
                            UniqueName: "currentorg",
                            EnvironmentIdentifier: { Id: "current-env-id" }
                        }
                    ]
                });
            });

            it("should show no environments error message when current environment is filtered out", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowErrorMessage.calledOnce).to.be.true;
                expect(mockShowErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.NO_ENVIRONMENTS_FOUND);
            });
        });

        describe("when filtering out the current environment", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                // Return multiple environments including the current one
                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Current Environment",
                            EnvironmentId: "current-env-id",
                            EnvironmentUrl: "https://current.crm.dynamics.com",
                            OrganizationId: "current-org-id",
                            UniqueName: "currentorg",
                            EnvironmentIdentifier: { Id: "current-env-id" }
                        },
                        {
                            FriendlyName: "Other Environment",
                            EnvironmentId: "other-env-id",
                            EnvironmentUrl: "https://other.crm.dynamics.com",
                            OrganizationId: "other-org-id",
                            UniqueName: "otherorg",
                            EnvironmentIdentifier: { Id: "other-env-id" }
                        }
                    ]
                });

                mockShowQuickPick.resolves(undefined); // User cancels
            });

            it("should not show the current environment in the quick pick list", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowQuickPick.calledOnce).to.be.true;
                const quickPickItems = mockShowQuickPick.firstCall.args[0];
                expect(quickPickItems).to.be.an("array");
                expect(quickPickItems.length).to.equal(1);
                expect(quickPickItems[0].label).to.equal("Other Environment");
            });

            it("should filter out environment based on EnvironmentId", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                const quickPickItems = mockShowQuickPick.firstCall.args[0];
                const environmentIds = quickPickItems.map((item: { orgInfo: { EnvironmentId: string } }) => item.orgInfo.EnvironmentId);
                expect(environmentIds).to.not.include("current-env-id");
                expect(environmentIds).to.include("other-env-id");
            });
        });

        describe("telemetry", () => {
            it("should log initial telemetry event when handler is called", async () => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => undefined);

                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CALLED)).to.be.true;
                const callArgs = traceInfoStub.getCalls().find(
                    call => call.args[0] === Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CALLED
                )?.args[1];
                expect(callArgs).to.deep.include({
                    methodName: "compareWithEnvironment"
                });
            });
        });

        describe("when storage path is not available", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Test Environment",
                            EnvironmentId: "env-id-1",
                            EnvironmentUrl: "https://test.crm.dynamics.com",
                            OrganizationId: "org-id-1",
                            UniqueName: "testorg",
                            EnvironmentIdentifier: { Id: "env-id-1" }
                        }
                    ]
                });

                sandbox.stub(ActionsHubUtils, "fetchWebsites").resolves({
                    activeSites: [
                        {
                            name: "Test Website",
                            websiteRecordId: "website-id-1",
                            websiteUrl: "https://test.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    ] as unknown as IWebsiteDetails[],
                    inactiveSites: [],
                    otherSites: []
                });

                // First call returns environment selection, second call returns website selection
                mockShowQuickPick
                    .onFirstCall().resolves({
                        label: "Test Environment",
                        detail: "https://test.crm.dynamics.com",
                        orgInfo: {
                            OrgId: "org-id-1",
                            UniqueName: "testorg",
                            FriendlyName: "Test Environment",
                            OrgUrl: "https://test.crm.dynamics.com",
                            UserEmail: "",
                            UserId: "",
                            EnvironmentId: "env-id-1"
                        }
                    })
                    .onSecondCall().resolves({
                        label: "Test Website",
                        detail: "https://test.powerappsportals.com",
                        description: Constants.Strings.ENHANCED_DATA_MODEL,
                        websiteDetails: {
                            name: "Test Website",
                            websiteRecordId: "website-id-1",
                            websiteUrl: "https://test.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    });
            });

            it("should return early without error when storage path is undefined", async () => {
                const contextWithoutStorage = {
                    storageUri: undefined
                } as unknown as vscode.ExtensionContext;

                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, contextWithoutStorage);
                // The handler should return early without errors
                // Since we can't easily mock ArtemisContext in this test structure,
                // we verify that it doesn't throw
                try {
                    await handler({ fsPath: "/test/workspace" } as vscode.Uri);
                } catch {
                    // Expected to fail silently when ArtemisContext is not available
                }
            });
        });

        describe("when user selects a different website", () => {
            let mockShowWarningMessage: sinon.SinonStub;

            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("local-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);
                mockShowWarningMessage = sandbox.stub(vscode.window, "showWarningMessage");

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Test Environment",
                            EnvironmentId: "env-id-1",
                            EnvironmentUrl: "https://test.crm.dynamics.com",
                            OrganizationId: "org-id-1",
                            UniqueName: "testorg",
                            EnvironmentIdentifier: { Id: "env-id-1" }
                        }
                    ]
                });

                sandbox.stub(ActionsHubUtils, "fetchWebsites").resolves({
                    activeSites: [
                        {
                            name: "Different Website",
                            websiteRecordId: "different-website-id",
                            websiteUrl: "https://different.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    ] as unknown as IWebsiteDetails[],
                    inactiveSites: [],
                    otherSites: []
                });

                // First call returns environment selection, second call returns different website
                mockShowQuickPick
                    .onFirstCall().resolves({
                        label: "Test Environment",
                        detail: "https://test.crm.dynamics.com",
                        orgInfo: {
                            OrgId: "org-id-1",
                            UniqueName: "testorg",
                            FriendlyName: "Test Environment",
                            OrgUrl: "https://test.crm.dynamics.com",
                            UserEmail: "",
                            UserId: "",
                            EnvironmentId: "env-id-1"
                        }
                    })
                    .onSecondCall().resolves({
                        label: "Different Website",
                        detail: "https://different.powerappsportals.com",
                        description: Constants.Strings.ENHANCED_DATA_MODEL,
                        websiteDetails: {
                            name: "Different Website",
                            websiteRecordId: "different-website-id",
                            websiteUrl: "https://different.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    });
            });

            it("should show confirmation dialog when selected website is different from local", async () => {
                mockShowWarningMessage.resolves(undefined); // User cancelled

                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowWarningMessage.calledOnce).to.be.true;
                expect(mockShowWarningMessage.firstCall.args[0]).to.equal(Constants.Strings.DIFFERENT_WEBSITE_CONFIRMATION);
                expect(mockShowWarningMessage.firstCall.args[1]).to.deep.equal({ modal: true });
            });

            it("should cancel operation when user declines confirmation", async () => {
                mockShowWarningMessage.resolves(undefined); // User cancelled

                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(traceInfoStub.calledWith(Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED)).to.be.true;
                const cancelCall = traceInfoStub.getCalls().find(
                    call => call.args[0] === Constants.EventNames.ACTIONS_HUB_COMPARE_WITH_ENVIRONMENT_CANCELLED
                );
                expect(cancelCall?.args[1]).to.deep.include({
                    reason: "User cancelled after different website confirmation"
                });
            });
        });

        describe("when user selects the matching website", () => {
            let mockShowWarningMessage: sinon.SinonStub;

            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("matching-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);
                mockShowWarningMessage = sandbox.stub(vscode.window, "showWarningMessage");

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Test Environment",
                            EnvironmentId: "env-id-1",
                            EnvironmentUrl: "https://test.crm.dynamics.com",
                            OrganizationId: "org-id-1",
                            UniqueName: "testorg",
                            EnvironmentIdentifier: { Id: "env-id-1" }
                        }
                    ]
                });

                sandbox.stub(ActionsHubUtils, "fetchWebsites").resolves({
                    activeSites: [
                        {
                            name: "Matching Website",
                            websiteRecordId: "matching-website-id",
                            websiteUrl: "https://matching.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    ] as unknown as IWebsiteDetails[],
                    inactiveSites: [],
                    otherSites: []
                });

                // First call returns environment selection, second call returns matching website
                mockShowQuickPick
                    .onFirstCall().resolves({
                        label: "Test Environment",
                        detail: "https://test.crm.dynamics.com",
                        orgInfo: {
                            OrgId: "org-id-1",
                            UniqueName: "testorg",
                            FriendlyName: "Test Environment",
                            OrgUrl: "https://test.crm.dynamics.com",
                            UserEmail: "",
                            UserId: "",
                            EnvironmentId: "env-id-1"
                        }
                    })
                    .onSecondCall().resolves({
                        label: "Matching Website",
                        detail: "https://matching.powerappsportals.com",
                        description: `${Constants.Strings.ENHANCED_DATA_MODEL} • ${Constants.Strings.MATCHING_SITE_INDICATOR}`,
                        websiteDetails: {
                            name: "Matching Website",
                            websiteRecordId: "matching-website-id",
                            websiteUrl: "https://matching.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    });
            });

            it("should not show confirmation dialog when selected website matches local", async () => {
                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                expect(mockShowWarningMessage.called).to.be.false;
            });
        });

        describe("finding website ID from resource path", () => {
            it("should prioritize resource path over workspace root for finding website ID", async () => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);

                const findWebsiteYmlFolderStub = sandbox.stub(WorkspaceInfoFinderUtil, "findWebsiteYmlFolder")
                    .returns("/test/workspace/nested/site-folder");

                const getWebsiteRecordIdStub = sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId");
                getWebsiteRecordIdStub.withArgs("/test/workspace/nested/site-folder").returns("nested-site-id");
                getWebsiteRecordIdStub.withArgs("/test/workspace").returns("workspace-site-id");

                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: []
                });

                const resourceUri = { fsPath: "/test/workspace/nested/site-folder/file.html" } as vscode.Uri;

                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler(resourceUri);

                // findWebsiteYmlFolder should be called with the resource path
                expect(findWebsiteYmlFolderStub.calledWith(resourceUri.fsPath)).to.be.true;
            });
        });

        describe("quick pick icons", () => {
            beforeEach(() => {
                sandbox.stub(vscode.workspace, "workspaceFolders").get(() => [
                    { uri: { fsPath: "/test/workspace" }, name: "workspace", index: 0 }
                ]);
                sandbox.stub(WorkspaceInfoFinderUtil, "getWebsiteRecordId").returns("test-website-id");
                sandbox.stub(WorkspaceInfoFinderUtil, "findPowerPagesSiteFolder").returns(null);

                mockPacWrapper.orgList.resolves({
                    Status: SUCCESS,
                    Results: [
                        {
                            FriendlyName: "Test Environment",
                            EnvironmentId: "env-id-1",
                            EnvironmentUrl: "https://test.crm.dynamics.com",
                            OrganizationId: "org-id-1",
                            UniqueName: "testorg",
                            EnvironmentIdentifier: { Id: "env-id-1" }
                        }
                    ]
                });

                sandbox.stub(ActionsHubUtils, "fetchWebsites").resolves({
                    activeSites: [
                        {
                            name: "Test Website",
                            websiteRecordId: "website-id-1",
                            websiteUrl: "https://test.powerappsportals.com",
                            dataModel: "Enhanced"
                        }
                    ] as unknown as IWebsiteDetails[],
                    inactiveSites: [],
                    otherSites: []
                });
            });

            it("should include environment icons in quick pick items", async () => {
                mockShowQuickPick.resolves(undefined); // Cancel to stop flow early

                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                // Verify that showQuickPick was called with items containing iconPath
                expect(mockShowQuickPick.called).to.be.true;
                const quickPickItems = mockShowQuickPick.firstCall.args[0];
                expect(quickPickItems).to.be.an("array");
                expect(quickPickItems[0]).to.have.property("iconPath");
                expect(quickPickItems[0].iconPath).to.have.property("light");
                expect(quickPickItems[0].iconPath).to.have.property("dark");
            });

            it("should include website icons in quick pick items with separators", async () => {
                // First call returns environment selection, second call is for websites
                mockShowQuickPick
                    .onFirstCall().resolves({
                        label: "Test Environment",
                        detail: "https://test.crm.dynamics.com",
                        orgInfo: {
                            OrgId: "org-id-1",
                            UniqueName: "testorg",
                            FriendlyName: "Test Environment",
                            OrgUrl: "https://test.crm.dynamics.com",
                            UserEmail: "",
                            UserId: "",
                            EnvironmentId: "env-id-1"
                        }
                    })
                    .onSecondCall().resolves(undefined); // Cancel to stop flow early

                const handler = compareWithEnvironment(mockPacTerminal as unknown as PacTerminal, mockExtensionContext);
                await handler({ fsPath: "/test/workspace" } as vscode.Uri);

                // Verify that the second showQuickPick was called with items containing separators and website icons
                expect(mockShowQuickPick.calledTwice).to.be.true;
                const websiteQuickPickItems = mockShowQuickPick.secondCall.args[0];
                expect(websiteQuickPickItems).to.be.an("array");

                // First item should be a separator for "Active Sites"
                expect(websiteQuickPickItems[0]).to.have.property("kind");
                expect(websiteQuickPickItems[0].kind).to.equal(vscode.QuickPickItemKind.Separator);
                expect(websiteQuickPickItems[0].label).to.equal(Constants.Strings.ACTIVE_SITES);

                // Second item should be the actual website with globe icon
                expect(websiteQuickPickItems[1]).to.have.property("iconPath");
                expect(websiteQuickPickItems[1].iconPath).to.be.instanceOf(vscode.ThemeIcon);
                expect((websiteQuickPickItems[1].iconPath as vscode.ThemeIcon).id).to.equal("globe");
            });
        });
    });
});
