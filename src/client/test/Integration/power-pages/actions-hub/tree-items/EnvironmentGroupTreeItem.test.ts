/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { expect } from "chai";
import { EnvironmentGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/EnvironmentGroupTreeItem";
import { ActionsHubTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActionsHubTreeItem";
import { IWebsiteDetails } from "../../../../../../common/services/Interfaces";
import { WebsiteDataModel } from "../../../../../../common/services/Constants";
import { ActiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/ActiveGroupTreeItem";
import { InactiveGroupTreeItem } from "../../../../../power-pages/actions-hub/tree-items/InactiveGroupTreeItem";

describe('EnvironmentGroupTreeItem',
    () => {
        it('should be of type EnvironmentGroupTreeItem',
            () => {
                const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" },
                    { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext,
                    [],
                    []);

                expect(treeItem).to.be.instanceOf(ActionsHubTreeItem);
            });

        it('should have the expected label',
            () => {
                const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" },
                    { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext,
                    [],
                    []);

                expect(treeItem.label).to.be.equal("Test Environment");
            });

        it('should have the expected collapsibleState',
            () => {
                const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" },
                    { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext,
                    [],
                    []);

                expect(treeItem.collapsibleState).to.be.equal(vscode.TreeItemCollapsibleState.Expanded);
            });

        it('should have the expected icon',
            () => {
                const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" },
                    { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext,
                    [],
                    []);

                expect((treeItem.iconPath as {
                    light: vscode.Uri,
                    dark: vscode.Uri
                }).light.path).to.be.equal('/src/client/assets/environment-icon/light/environment.svg');
                expect((treeItem.iconPath as {
                    light: vscode.Uri,
                    dark: vscode.Uri
                }).dark.path).to.be.equal('/src/client/assets/environment-icon/dark/environment.svg');
            });

        it('should have the expected contextValue',
            () => {
                const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" },
                    { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext,
                    [],
                    []);

                expect(treeItem.contextValue).to.be.equal("environmentGroup");
            });

        it('should return the expected children',
            () => {
                const activeWebsites: IWebsiteDetails[] = [
                    {
                        websiteRecordId: "1",
                        name: "Active Site 1",
                        websiteUrl: "http://activesite1.com",
                        dataverseInstanceUrl: "http://dataverse1.com",
                        dataverseOrganizationId: "org1",
                        dataModel: WebsiteDataModel.Standard,
                        environmentId: "env1",
                        siteManagementUrl: "http://siteManagement1.com",
                        createdOn: '2023-01-01T00:00:00Z',
                        creator: 'Test creator',
                        siteVisibility: undefined,
                        isCodeSite: true
                    },
                    {
                        websiteRecordId: "2",
                        name: "Active Site 2",
                        websiteUrl: "http://activesite2.com",
                        dataverseInstanceUrl: "http://dataverse2.com",
                        dataverseOrganizationId: "org2",
                        dataModel: WebsiteDataModel.Enhanced,
                        environmentId: "env2",
                        siteManagementUrl: "http://siteManagement1.com",
                        createdOn: '2023-01-01T00:00:00Z',
                        creator: 'Test creator',
                        siteVisibility: undefined,
                        isCodeSite: true
                    }
                ];

                const inactiveWebsites: IWebsiteDetails[] = [
                    {
                        websiteRecordId: "3",
                        name: "Inactive Site 1",
                        websiteUrl: "http://inactivesite1.com",
                        dataverseInstanceUrl: "http://dataverse3.com",
                        dataverseOrganizationId: "org3",
                        dataModel: WebsiteDataModel.Standard,
                        environmentId: "env3",
                        siteManagementUrl: "http://siteManagement1.com",
                        createdOn: '2023-01-01T00:00:00Z',
                        creator: 'Test creator',
                        siteVisibility: undefined,
                        isCodeSite: true
                    },
                    {
                        websiteRecordId: "4",
                        name: "Inactive Site 2",
                        websiteUrl: "http://inactivesite2.com",
                        dataverseInstanceUrl: "http://dataverse4.com",
                        dataverseOrganizationId: "org4",
                        dataModel: WebsiteDataModel.Enhanced,
                        environmentId: "env4",
                        siteManagementUrl: "http://siteManagement1.com",
                        createdOn: '2023-01-01T00:00:00Z',
                        creator: 'Test creator',
                        siteVisibility: undefined,
                        isCodeSite: true
                    }
                ];

                const treeItem = new EnvironmentGroupTreeItem({ currentEnvironmentName: "Test Environment" },
                    { extensionUri: vscode.Uri.parse("http://localhost") } as vscode.ExtensionContext,
                    activeWebsites,
                    inactiveWebsites);
                const children = treeItem.getChildren();

                expect(children).to.have.lengthOf(2);

                const activeGroup = children[0] as ActiveGroupTreeItem;
                expect(activeGroup).to.be.instanceOf(ActiveGroupTreeItem);
                expect(activeGroup.getChildren()).to.have.lengthOf(2);
                expect(activeGroup.getChildren()[0].label).to.equal("Active Site 1");
                expect(activeGroup.getChildren()[1].label).to.equal("Active Site 2");

                const inactiveGroup = children[1] as InactiveGroupTreeItem;
                expect(inactiveGroup).to.be.instanceOf(InactiveGroupTreeItem);
                expect(inactiveGroup.getChildren()).to.have.lengthOf(2);
                expect(inactiveGroup.getChildren()[0].label).to.equal("Inactive Site 1");
                expect(inactiveGroup.getChildren()[1].label).to.equal("Inactive Site 2");
            });
    });
