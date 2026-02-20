/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { viewAsTree, viewAsList } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/ToggleViewModeHandler";
import MetadataDiffContext, { MetadataDiffViewMode } from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";

describe("ToggleViewModeHandler", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(TelemetryHelper, "traceInfo");

        // Initialize MetadataDiffContext with a mock extension context to enable setViewMode
        const mockGlobalState = {
            get: sandbox.stub().returns(undefined),
            update: sandbox.stub().resolves()
        };
        const mockContext = {
            globalState: mockGlobalState
        } as unknown as vscode.ExtensionContext;
        MetadataDiffContext.initialize(mockContext);

        // Reset view mode to default state before each test
        MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    describe("viewAsTree", () => {
        it("should set view mode to tree", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);

            viewAsTree();

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.Tree);
        });

        it("should log telemetry event with tree view mode", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            viewAsTree();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_VIEW_MODE_CHANGED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "viewAsTree",
                viewMode: MetadataDiffViewMode.Tree
            });
        });

        it("should work when already in tree mode", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);

            viewAsTree();

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.Tree);
        });

        it("should set isTreeView to true after switching", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);

            viewAsTree();

            expect(MetadataDiffContext.isTreeView).to.be.true;
            expect(MetadataDiffContext.isListView).to.be.false;
        });
    });

    describe("viewAsList", () => {
        it("should set view mode to list", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);

            viewAsList();

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);
        });

        it("should log telemetry event with list view mode", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            viewAsList();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_VIEW_MODE_CHANGED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "viewAsList",
                viewMode: MetadataDiffViewMode.List
            });
        });

        it("should work when already in list mode", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.List);

            viewAsList();

            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);
        });

        it("should set isListView to true after switching", () => {
            MetadataDiffContext.setViewMode(MetadataDiffViewMode.Tree);

            viewAsList();

            expect(MetadataDiffContext.isListView).to.be.true;
            expect(MetadataDiffContext.isTreeView).to.be.false;
        });
    });

    describe("view mode toggling workflow", () => {
        it("should allow switching from list to tree and back", () => {
            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);

            viewAsTree();
            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.Tree);

            viewAsList();
            expect(MetadataDiffContext.viewMode).to.equal(MetadataDiffViewMode.List);
        });

        it("should log telemetry for each view mode change", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            viewAsTree();
            viewAsList();

            expect(traceInfoStub.calledTwice).to.be.true;
            expect(traceInfoStub.firstCall.args[1].viewMode).to.equal(MetadataDiffViewMode.Tree);
            expect(traceInfoStub.secondCall.args[1].viewMode).to.equal(MetadataDiffViewMode.List);
        });
    });
});
