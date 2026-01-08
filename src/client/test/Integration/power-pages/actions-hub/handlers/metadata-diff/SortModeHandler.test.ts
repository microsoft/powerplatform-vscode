/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { sortByName, sortByPath, sortByStatus } from "../../../../../../power-pages/actions-hub/handlers/metadata-diff/SortModeHandler";
import MetadataDiffContext, { MetadataDiffSortMode } from "../../../../../../power-pages/actions-hub/MetadataDiffContext";
import * as TelemetryHelper from "../../../../../../power-pages/actions-hub/TelemetryHelper";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";

describe("SortModeHandler", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(TelemetryHelper, "traceInfo");

        // Initialize MetadataDiffContext with a mock extension context to enable setSortMode
        const mockGlobalState = {
            get: sandbox.stub().returns(undefined),
            update: sandbox.stub().resolves()
        };
        const mockContext = {
            globalState: mockGlobalState
        } as unknown as vscode.ExtensionContext;
        MetadataDiffContext.initialize(mockContext);

        // Reset sort mode to default state before each test
        MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);
    });

    afterEach(() => {
        sandbox.restore();
        MetadataDiffContext.clear();
    });

    describe("sortByName", () => {
        it("should set sort mode to name", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);

            sortByName();

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Name);
        });

        it("should log telemetry event with name sort mode", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            sortByName();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SORT_MODE_CHANGED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "sortByName",
                sortMode: MetadataDiffSortMode.Name
            });
        });

        it("should work when already in name sort mode", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);

            sortByName();

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Name);
        });
    });

    describe("sortByPath", () => {
        it("should set sort mode to path", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Name);

            sortByPath();

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Path);
        });

        it("should log telemetry event with path sort mode", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            sortByPath();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SORT_MODE_CHANGED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "sortByPath",
                sortMode: MetadataDiffSortMode.Path
            });
        });

        it("should work when already in path sort mode", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);

            sortByPath();

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Path);
        });
    });

    describe("sortByStatus", () => {
        it("should set sort mode to status", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Path);

            sortByStatus();

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Status);
        });

        it("should log telemetry event with status sort mode", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            sortByStatus();

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_METADATA_DIFF_SORT_MODE_CHANGED);
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                methodName: "sortByStatus",
                sortMode: MetadataDiffSortMode.Status
            });
        });

        it("should work when already in status sort mode", () => {
            MetadataDiffContext.setSortMode(MetadataDiffSortMode.Status);

            sortByStatus();

            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Status);
        });
    });

    describe("sort mode switching workflow", () => {
        it("should allow switching between all sort modes", () => {
            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Path);

            sortByName();
            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Name);

            sortByStatus();
            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Status);

            sortByPath();
            expect(MetadataDiffContext.sortMode).to.equal(MetadataDiffSortMode.Path);
        });

        it("should log telemetry for each sort mode change", () => {
            const traceInfoStub = TelemetryHelper.traceInfo as sinon.SinonStub;

            sortByName();
            sortByStatus();
            sortByPath();

            expect(traceInfoStub.calledThrice).to.be.true;
            expect(traceInfoStub.firstCall.args[1].sortMode).to.equal(MetadataDiffSortMode.Name);
            expect(traceInfoStub.secondCall.args[1].sortMode).to.equal(MetadataDiffSortMode.Status);
            expect(traceInfoStub.thirdCall.args[1].sortMode).to.equal(MetadataDiffSortMode.Path);
        });
    });
});
