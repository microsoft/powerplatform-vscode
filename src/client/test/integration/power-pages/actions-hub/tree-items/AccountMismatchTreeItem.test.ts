/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as vscode from "vscode";
import { AccountMismatchTreeItem } from "../../../../../power-pages/actions-hub/tree-items/AccountMismatchTreeItem";
import { LoginPromptTreeItem } from "../../../../../power-pages/actions-hub/tree-items/LoginPromptTreeItem";
import { Constants } from "../../../../../power-pages/actions-hub/Constants";

describe("AccountMismatchTreeItem", () => {
    let accountMismatchTreeItem: AccountMismatchTreeItem;

    beforeEach(() => {
        accountMismatchTreeItem = new AccountMismatchTreeItem();
    });

    describe("constructor", () => {
        it("should initialize with correct properties", () => {
            expect(accountMismatchTreeItem.label).to.equal(Constants.Strings.ACCOUNT_MISMATCH_DETECTED);
            expect(accountMismatchTreeItem.description).to.equal(Constants.Strings.ACCOUNT_MISMATCH_DESCRIPTION);
            expect(accountMismatchTreeItem.tooltip).to.equal(Constants.Strings.ACCOUNT_MISMATCH_TOOLTIP);
            expect(accountMismatchTreeItem.contextValue).to.equal(Constants.ContextValues.ACCOUNT_MISMATCH);
            expect(accountMismatchTreeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.Expanded);
        });

        it("should have warning icon", () => {
            expect(accountMismatchTreeItem.iconPath).to.be.instanceOf(vscode.ThemeIcon);
            const icon = accountMismatchTreeItem.iconPath as vscode.ThemeIcon;
            expect(icon.id).to.equal("warning");
        });
    });

    describe("getChildren", () => {
        it("should return LoginPromptTreeItem as child", () => {
            const children = accountMismatchTreeItem.getChildren();

            expect(children).to.have.lengthOf(1);
            expect(children[0]).to.be.instanceOf(LoginPromptTreeItem);
        });
    });
});
