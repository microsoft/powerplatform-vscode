/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as vscode from "vscode";
import { LoginPromptTreeItem } from "../../../../../power-pages/actions-hub/tree-items/LoginPromptTreeItem";
import { Constants } from "../../../../../power-pages/actions-hub/Constants";

describe("LoginPromptTreeItem", () => {
    let loginPromptTreeItem: LoginPromptTreeItem;

    beforeEach(() => {
        loginPromptTreeItem = new LoginPromptTreeItem();
    });

    describe("constructor", () => {
        it("should initialize with correct properties", () => {
            expect(loginPromptTreeItem.label).to.equal(Constants.Strings.LOGIN_PROMPT_LABEL);
            expect(loginPromptTreeItem.description).to.equal("");
            expect(loginPromptTreeItem.tooltip).to.equal(Constants.Strings.LOGIN_PROMPT_TOOLTIP);
            expect(loginPromptTreeItem.contextValue).to.equal(Constants.ContextValues.LOGIN_PROMPT);
            expect(loginPromptTreeItem.collapsibleState).to.equal(vscode.TreeItemCollapsibleState.None);
        });

        it("should have account icon", () => {
            expect(loginPromptTreeItem.iconPath).to.be.instanceOf(vscode.ThemeIcon);
            const icon = loginPromptTreeItem.iconPath as vscode.ThemeIcon;
            expect(icon.id).to.equal("account");
        });

        it("should have login command configured", () => {
            expect(loginPromptTreeItem.command).to.not.be.undefined;
            expect(loginPromptTreeItem.command?.command).to.equal('microsoft.powerplatform.pages.actionsHub.loginToMatch');
            expect(loginPromptTreeItem.command?.title).to.equal(Constants.Strings.LOGIN_PROMPT_TITLE);
        });
    });

    describe("getChildren", () => {
        it("should return empty array", () => {
            const children = loginPromptTreeItem.getChildren();

            expect(children).to.be.an('array').that.is.empty;
        });
    });
});
