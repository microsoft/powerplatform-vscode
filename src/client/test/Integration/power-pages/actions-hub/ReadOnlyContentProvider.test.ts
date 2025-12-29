/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import * as vscode from "vscode";
import * as fs from "fs";
import { ReadOnlyContentProvider, METADATA_DIFF_READONLY_SCHEME } from "../../../../power-pages/actions-hub/ReadOnlyContentProvider";

describe("ReadOnlyContentProvider", () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

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

    describe("stat", () => {
        it("should return FileStat with Readonly permission for existing file", () => {
            const provider = ReadOnlyContentProvider.getInstance();
            const testPath = "/test/file.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(testPath);

            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(fs, "statSync").returns({
                isDirectory: () => false,
                ctimeMs: 1000,
                mtimeMs: 2000,
                size: 100
            } as fs.Stats);

            const stat = provider.stat(uri);

            expect(stat.permissions).to.equal(vscode.FilePermission.Readonly);
            expect(stat.type).to.equal(vscode.FileType.File);
            expect(stat.size).to.equal(100);
        });

        it("should throw FileNotFound for non-existing file", () => {
            const provider = ReadOnlyContentProvider.getInstance();
            const testPath = "/test/nonexistent.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(testPath);

            sandbox.stub(fs, "existsSync").returns(false);

            expect(() => provider.stat(uri)).to.throw();
        });

        it("should return Directory type for directories", () => {
            const provider = ReadOnlyContentProvider.getInstance();
            const testPath = "/test/folder";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(testPath);

            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(fs, "statSync").returns({
                isDirectory: () => true,
                ctimeMs: 1000,
                mtimeMs: 2000,
                size: 0
            } as fs.Stats);

            const stat = provider.stat(uri);

            expect(stat.type).to.equal(vscode.FileType.Directory);
            expect(stat.permissions).to.equal(vscode.FilePermission.Readonly);
        });
    });

    describe("readFile", () => {
        it("should return file contents as Uint8Array", () => {
            const provider = ReadOnlyContentProvider.getInstance();
            const testPath = "/test/file.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(testPath);
            const testContent = Buffer.from("test content");

            sandbox.stub(fs, "existsSync").returns(true);
            sandbox.stub(fs, "readFileSync").returns(testContent);

            const content = provider.readFile(uri);

            expect(content).to.deep.equal(testContent);
        });

        it("should throw FileNotFound for non-existing file", () => {
            const provider = ReadOnlyContentProvider.getInstance();
            const testPath = "/test/nonexistent.txt";
            const uri = ReadOnlyContentProvider.createReadOnlyUri(testPath);

            sandbox.stub(fs, "existsSync").returns(false);

            expect(() => provider.readFile(uri)).to.throw();
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
