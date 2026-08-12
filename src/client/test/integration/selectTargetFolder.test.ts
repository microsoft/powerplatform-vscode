/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import { URI_HANDLER_STRINGS } from "../../uriHandler/constants/uriStrings";
import { selectTargetFolder } from "../../uriHandler/utils/selectTargetFolder";

describe("selectTargetFolder", () => {
    let sandbox: sinon.SinonSandbox;
    let showOpenDialogStub: sinon.SinonStub;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        showOpenDialogStub = sandbox.stub(vscode.window, "showOpenDialog");
    });

    afterEach(() => {
        sandbox.restore();
    });

    it("returns the selected folder", async () => {
        const selectedFolder = vscode.Uri.file("C:\\sites");
        showOpenDialogStub.resolves([selectedFolder]);

        const result = await selectTargetFolder();

        expect(result).to.equal(selectedFolder);
        expect(showOpenDialogStub.calledOnceWithExactly({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: URI_HANDLER_STRINGS.BUTTONS.SELECT_FOLDER,
            title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER
        })).to.be.true;
    });

    it("returns undefined when the user cancels", async () => {
        showOpenDialogStub.resolves(undefined);

        const result = await selectTargetFolder();

        expect(result).to.be.undefined;
    });
});
