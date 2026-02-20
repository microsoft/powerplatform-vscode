/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as sinon from "sinon";
import { expect } from "chai";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { ToolsGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ToolsGroupTreeItem";
import { MetadataDiffGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/metadata-diff/MetadataDiffGroupTreeItem";
import * as ActionsHubModule from "../../../../../power-pages/actions-hub/ActionsHub";

describe('ToolsGroupTreeItem', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it('should be of type ActionsHubTreeItem', () => {
        sandbox.stub(ActionsHubModule.ActionsHub, 'isMetadataDiffEnabled').returns(false);
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
    });

    it('should have the expected label', () => {
        sandbox.stub(ActionsHubModule.ActionsHub, 'isMetadataDiffEnabled').returns(false);
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.label).to.be.equal("Tools");
    });

    it('should have the expected collapsibleState', () => {
        sandbox.stub(ActionsHubModule.ActionsHub, 'isMetadataDiffEnabled').returns(false);
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Expanded);
    });

    it('should have the expected icon', () => {
        sandbox.stub(ActionsHubModule.ActionsHub, 'isMetadataDiffEnabled').returns(false);
        const treeItem = new ToolsGroupTreeItem();

        expect((treeItem.iconPath as vscode.ThemeIcon).id).to.be.equal('tools');
    });

    it('should have the expected contextValue', () => {
        sandbox.stub(ActionsHubModule.ActionsHub, 'isMetadataDiffEnabled').returns(false);
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.contextValue).to.be.equal("toolsGroup");
    });

    it('should return empty children array when metadata diff is disabled', () => {
        sandbox.stub(ActionsHubModule.ActionsHub, 'isMetadataDiffEnabled').returns(false);
        const treeItem = new ToolsGroupTreeItem();

        expect(treeItem.getChildren()).to.be.an('array').that.is.empty;
    });

    it('should return MetadataDiffGroupTreeItem when metadata diff is enabled', () => {
        sandbox.stub(ActionsHubModule.ActionsHub, 'isMetadataDiffEnabled').returns(true);
        const treeItem = new ToolsGroupTreeItem();

        const children = treeItem.getChildren();

        expect(children).to.have.lengthOf(1);
        expect(children[0]).to.be.instanceOf(MetadataDiffGroupTreeItem);
    });
});
