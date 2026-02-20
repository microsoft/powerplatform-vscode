/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as sinon from "sinon";
import { expect } from "chai";
import {
    MetadataDiffWelcomeTreeItem,
    detectSiteInWorkspace
} from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffWelcomeTreeItem";
import { MetadataDiffWelcomeNoSiteTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffWelcomeNoSiteTreeItem";
import { MetadataDiffWelcomeCTATreeItem } from "../../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffWelcomeCTATreeItem";
import { ActionsHubTreeItem } from "../../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { Constants } from "../../../../../../power-pages/actions-hub/Constants";

describe("MetadataDiffWelcomeTreeItem", () => {
    let workspaceFoldersStub: sinon.SinonStub;

    beforeEach(() => {
        // Reset stubs before each test
        workspaceFoldersStub = sinon.stub(vscode.workspace, "workspaceFolders");
    });

    afterEach(() => {
        sinon.restore();
    });

    describe("detectSiteInWorkspace", () => {
        it("should return false when no workspace folders", () => {
            workspaceFoldersStub.value(undefined);
            expect(detectSiteInWorkspace()).to.be.false;
        });

        it("should return false when empty workspace folders array", () => {
            workspaceFoldersStub.value([]);
            expect(detectSiteInWorkspace()).to.be.false;
        });
    });

    describe("MetadataDiffWelcomeTreeItem", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffWelcomeTreeItem();
            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the welcome description as label", () => {
            const treeItem = new MetadataDiffWelcomeTreeItem();
            expect(treeItem.label).to.equal(Constants.Strings.METADATA_DIFF_WELCOME_DESCRIPTION);
        });

        it("should have Expanded collapsible state", () => {
            const treeItem = new MetadataDiffWelcomeTreeItem();
            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have unique id", () => {
            const treeItem = new MetadataDiffWelcomeTreeItem();
            expect(treeItem.id).to.equal("metadataDiffWelcome");
        });

        it("should have METADATA_DIFF_WELCOME_DESCRIPTION context value", () => {
            const treeItem = new MetadataDiffWelcomeTreeItem();
            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_WELCOME_DESCRIPTION);
        });

        it("should return children array", () => {
            const treeItem = new MetadataDiffWelcomeTreeItem();
            const children = treeItem.getChildren();
            expect(children).to.be.an("array").with.length(1);
        });

        it("should return NoSiteTreeItem when no site detected", () => {
            workspaceFoldersStub.value([]);
            const treeItem = new MetadataDiffWelcomeTreeItem();
            const children = treeItem.getChildren();
            expect(children[0]).to.be.instanceOf(MetadataDiffWelcomeNoSiteTreeItem);
        });
    });

    describe("MetadataDiffWelcomeNoSiteTreeItem", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffWelcomeNoSiteTreeItem();
            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the no-site instruction as label", () => {
            const treeItem = new MetadataDiffWelcomeNoSiteTreeItem();
            expect(treeItem.label).to.equal(Constants.Strings.METADATA_DIFF_WELCOME_NO_SITE_INSTRUCTION);
        });

        it("should have None collapsible state", () => {
            const treeItem = new MetadataDiffWelcomeNoSiteTreeItem();
            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
        });

        it("should have unique id", () => {
            const treeItem = new MetadataDiffWelcomeNoSiteTreeItem();
            expect(treeItem.id).to.equal("metadataDiffWelcomeNoSite");
        });

        it("should have METADATA_DIFF_WELCOME_NO_SITE context value", () => {
            const treeItem = new MetadataDiffWelcomeNoSiteTreeItem();
            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_WELCOME_NO_SITE);
        });

        it("should not have a command", () => {
            const treeItem = new MetadataDiffWelcomeNoSiteTreeItem();
            expect(treeItem.command).to.be.undefined;
        });
    });

    describe("MetadataDiffWelcomeCTATreeItem", () => {
        it("should be an instance of ActionsHubTreeItem", () => {
            const treeItem = new MetadataDiffWelcomeCTATreeItem();
            expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
        });

        it("should have the CTA text as label", () => {
            const treeItem = new MetadataDiffWelcomeCTATreeItem();
            expect(treeItem.label).to.equal(Constants.Strings.METADATA_DIFF_COMPARE_SITE_CTA);
        });

        it("should have None collapsible state", () => {
            const treeItem = new MetadataDiffWelcomeCTATreeItem();
            expect(treeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
        });

        it("should have unique id", () => {
            const treeItem = new MetadataDiffWelcomeCTATreeItem();
            expect(treeItem.id).to.equal("metadataDiffWelcomeCTA");
        });

        it("should have METADATA_DIFF_WELCOME_WITH_SITE context value", () => {
            const treeItem = new MetadataDiffWelcomeCTATreeItem();
            expect(treeItem.contextValue).to.equal(Constants.ContextValues.METADATA_DIFF_WELCOME_WITH_SITE);
        });

        it("should have the compare with environment command", () => {
            const treeItem = new MetadataDiffWelcomeCTATreeItem();
            expect(treeItem.command).to.not.be.undefined;
            expect(treeItem.command?.command).to.equal(Constants.Commands.COMPARE_WITH_ENVIRONMENT);
        });
    });
});
