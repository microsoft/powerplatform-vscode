/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as vscode from "vscode";
import { ReadOnlyContentProvider, METADATA_DIFF_READONLY_SCHEME } from "../../../../power-pages/actions-hub/ReadOnlyContentProvider";

describe("ReadOnlyContentProvider", () => {
    describe("getInstance", () => {
        it("should return the same instance on multiple calls", () => {
            const instance1 = ReadOnlyContentProvider.getInstance();
            const instance2 = ReadOnlyContentProvider.getInstance();

            expect(instance1).to.equal(instance2);
        });
    });

    describe("createReadOnlyUri", () => {
        it("should create URI with the correct scheme", () => {
            const filePath = "/path/to/file.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(filePath);

            expect(uri.scheme).to.equal(METADATA_DIFF_READONLY_SCHEME);
        });

        it("should preserve the file path in the URI", () => {
            const filePath = "/path/to/file.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(filePath);

            expect(uri.fsPath).to.include("file.txt");
        });

        it("should handle Windows paths correctly", () => {
            const filePath = "C:\\Users\\test\\file.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(filePath);

            expect(uri.scheme).to.equal(METADATA_DIFF_READONLY_SCHEME);
            // The path should be properly converted to URI format
            expect(uri.path).to.match(/^\/[cC]:\//);
        });

        it("should handle paths with spaces", () => {
            const filePath = "/path/to/my file.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(filePath);

            expect(uri.scheme).to.equal(METADATA_DIFF_READONLY_SCHEME);
            expect(uri.fsPath).to.include("my file.txt");
        });
    });

    describe("write operations", () => {
        it("should throw NoPermissions on writeFile", () => {
            const provider = ReadOnlyContentProvider.getInstance();

            expect(() => provider.writeFile()).to.throw();
        });

        it("should throw NoPermissions on delete", () => {
            const provider = ReadOnlyContentProvider.getInstance();

            expect(() => provider.delete()).to.throw();
        });

        it("should throw NoPermissions on rename", () => {
            const provider = ReadOnlyContentProvider.getInstance();

            expect(() => provider.rename()).to.throw();
        });

        it("should throw NoPermissions on createDirectory", () => {
            const provider = ReadOnlyContentProvider.getInstance();

            expect(() => provider.createDirectory()).to.throw();
        });
    });

    describe("watch", () => {
        it("should return a Disposable", () => {
            const provider = ReadOnlyContentProvider.getInstance();

            const disposable = provider.watch();

            expect(disposable).to.be.instanceOf(vscode.Disposable);
        });
    });

    describe("METADATA_DIFF_READONLY_SCHEME", () => {
        it("should be the expected scheme value", () => {
            expect(METADATA_DIFF_READONLY_SCHEME).to.equal("pp-metadata-diff-readonly");
        });
    });
});
