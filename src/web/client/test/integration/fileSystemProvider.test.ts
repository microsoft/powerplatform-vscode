/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import { expect } from "chai";
import Sinon, { stub, assert } from "sinon";
import vscode from "vscode";
import { Directory, PortalsFS } from "../../dal/fileSystemProvider";

const portalsFS = new PortalsFS();
describe("fileSystemProvider", () => {
    afterEach(() => {
        Sinon.restore();
    });

    it("stat", async () => {
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        portalsFS.root = new Directory("");
        portalsFS.root.entries.set("testuri", portalsFS.root);
        const result = await portalsFS.stat(fileUri);
        expect(result).not.to.be.undefined;
    });

    it("readDirectory", async () => {
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        portalsFS.root = new Directory("");
        portalsFS.root.name = "name";
        portalsFS.root.type = vscode.FileType.File;
        portalsFS.root.entries.set("testuri", portalsFS.root);
        const result = await portalsFS.readDirectory(fileUri);
        expect(result).not.to.be.undefined;
    });

    it("readDirectory should return empty array", async () => {
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        portalsFS.root = new Directory("");
        portalsFS.root.name = "name";
        portalsFS.root.type = vscode.FileType.File;
        portalsFS.root.entries.set("t", portalsFS.root);
        const result = await portalsFS.readDirectory(fileUri);
        expect(result).empty;
    });

    it("readFile", async () => {
        const fileUri: vscode.Uri = { path: "testuri" } as vscode.Uri;
        portalsFS.root = new Directory("");
        portalsFS.root.name = "name";
        portalsFS.root.type = vscode.FileType.File;
        portalsFS.root.entries.set("testuri", portalsFS.root);
        const result = await portalsFS.readFile(fileUri);
        expect(result).not.to.be.undefined;
    });

    it("writeFile", async () => {
        const content = new Uint8Array();
        const options = { create: true, overwrite: false };
        const basename = stub(path.posix, "basename").resolves("testuri");

        const fileUri: vscode.Uri = {
            path: "testuri",
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            with: (path) => {
                return fileUri;
            },
        } as vscode.Uri;
        portalsFS.root = new Directory("");
        portalsFS.root.name = "name";
        portalsFS.root.type = vscode.FileType.File;
        portalsFS.root.entries.set("testuri", portalsFS.root);
        await portalsFS.writeFile(fileUri, content, options);
        assert.calledOnce(basename);
    });
});
