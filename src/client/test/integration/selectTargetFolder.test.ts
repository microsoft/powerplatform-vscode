/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../../uriHandler/constants/uriStrings";
import {
    selectTargetFolder,
    SelectTargetFolderDependencies
} from "../../uriHandler/utils/selectTargetFolder";

describe("selectTargetFolder", () => {
    const firstFolder = {
        index: 0,
        name: "Current site",
        uri: vscode.Uri.file("C:\\sites\\current")
    } as vscode.WorkspaceFolder;
    const secondFolder = {
        index: 1,
        name: "Other site",
        uri: vscode.Uri.file("C:\\sites\\other")
    } as vscode.WorkspaceFolder;

    let showQuickPickStub: sinon.SinonStub;
    let showOpenDialogStub: sinon.SinonStub;
    let dependencies: SelectTargetFolderDependencies;

    beforeEach(() => {
        showQuickPickStub = sinon.stub();
        showOpenDialogStub = sinon.stub();
        dependencies = {
            getWorkspaceFolders: () => [firstFolder, secondFolder],
            showQuickPick: showQuickPickStub,
            showOpenDialog: showOpenDialogStub
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it("selects a workspace folder from the Quick Pick without opening the file explorer", async () => {
        showQuickPickStub.callsFake(async (items: Array<vscode.QuickPickItem & { uri?: vscode.Uri }>) => items[1]);

        const result = await selectTargetFolder(dependencies);

        expect(result).to.equal(secondFolder.uri);
        expect(showOpenDialogStub.notCalled).to.be.true;
        const items = showQuickPickStub.firstCall.firstArg as Array<vscode.QuickPickItem & { uri?: vscode.Uri }>;
        expect(items.map(item => ({
            label: item.label,
            description: item.description,
            uri: item.uri
        }))).to.deep.equal([
            {
                label: firstFolder.name,
                description: firstFolder.uri.fsPath,
                uri: firstFolder.uri
            },
            {
                label: secondFolder.name,
                description: secondFolder.uri.fsPath,
                uri: secondFolder.uri
            },
            {
                label: URI_HANDLER_STRINGS.BUTTONS.BROWSE,
                description: undefined,
                uri: undefined
            }
        ]);
        expect(showQuickPickStub.firstCall.args[1]).to.deep.equal({
            canPickMany: false,
            title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
        });
    });

    it("opens the file explorer only after Browse is selected", async () => {
        const selectedFolder = vscode.Uri.file("C:\\sites\\new");
        showQuickPickStub.callsFake(async (items: Array<vscode.QuickPickItem & { browse?: true }>) =>
            items.find(item => item.browse)
        );
        showOpenDialogStub.resolves([selectedFolder]);

        const result = await selectTargetFolder(dependencies);

        expect(result).to.equal(selectedFolder);
        expect(showOpenDialogStub.calledOnceWithExactly({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: URI_HANDLER_STRINGS.BUTTONS.SELECT_FOLDER,
            title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
        })).to.be.true;
    });

    it("returns undefined without opening the file explorer when the Quick Pick is cancelled", async () => {
        showQuickPickStub.resolves(undefined);

        const result = await selectTargetFolder(dependencies);

        expect(result).to.be.undefined;
        expect(showOpenDialogStub.notCalled).to.be.true;
    });

    it("returns undefined when the Browse dialog is cancelled", async () => {
        showQuickPickStub.callsFake(async (items: Array<vscode.QuickPickItem & { browse?: true }>) =>
            items.find(item => item.browse)
        );
        showOpenDialogStub.resolves(undefined);

        const result = await selectTargetFolder(dependencies);

        expect(result).to.be.undefined;
    });

    it("still offers Browse when no workspace folder is open", async () => {
        dependencies.getWorkspaceFolders = () => [];
        showQuickPickStub.resolves(undefined);

        await selectTargetFolder(dependencies);

        const items = showQuickPickStub.firstCall.firstArg as vscode.QuickPickItem[];
        expect(items).to.have.lengthOf(1);
        expect(items[0].label).to.equal(URI_HANDLER_STRINGS.BUTTONS.BROWSE);
    });
});
