/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Tests for MetadataDiffTreeDataProvider
import * as sinon from "sinon";
import { expect } from "chai";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { MetadataDiffTreeDataProvider } from "../../../../common/power-pages/metadata-diff/MetadataDiffTreeDataProvider";
import { oneDSLoggerWrapper } from "../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";

// Helper to create a mock extension context with in-memory storage path
function createMockContext(tmpDir: string): vscode.ExtensionContext {
    const ctx = {
        extensionUri: vscode.Uri.file(tmpDir),
        storageUri: vscode.Uri.file(path.join(tmpDir, 'storage')),
        globalStorageUri: vscode.Uri.file(path.join(tmpDir, 'gstorage')),
        logUri: vscode.Uri.file(path.join(tmpDir, 'log')),
        extensionPath: tmpDir,
        globalState: { } as unknown,
        workspaceState: { } as unknown,
        subscriptions: [],
        asAbsolutePath: (p: string) => path.join(tmpDir, p),
        environmentVariableCollection: { } as unknown,
        extensionMode: vscode.ExtensionMode.Test,
        storagePath: path.join(tmpDir, 'storage'),
        globalStoragePath: path.join(tmpDir, 'gstorage'),
        logPath: path.join(tmpDir, 'log'),
        secrets: { } as unknown,
        extension: { } as unknown,
        languageModelAccessInformation: { } as unknown
    } as unknown;
    return ctx as vscode.ExtensionContext;
}

describe("MetadataDiffTreeDataProvider", () => {
    let sandbox: sinon.SinonSandbox;
    let tmpDir: string;
    let context: vscode.ExtensionContext;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        tmpDir = fs.mkdtempSync(path.join(process.cwd(), 'mdiff-test-'));
        context = createMockContext(tmpDir);
        fs.mkdirSync(context.storageUri!.fsPath, { recursive: true });
        sandbox.stub(oneDSLoggerWrapper, 'getLogger').returns({
            traceInfo: () => {},
            traceError: () => {}
        } as any);
    });

    afterEach(() => {
        sandbox.restore();
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    it("returns empty when no workspace", async () => {
        sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
        const provider = new MetadataDiffTreeDataProvider(context);
        const children = await provider.getChildren();
        expect(children).to.deep.equal([]);
    });

    it("setDiffFiles populates items and contexts", async () => {
    sandbox.stub(vscode.workspace, 'workspaceFolders').value([ { uri: vscode.Uri.file(tmpDir), name: 'ws', index: 0 } as any ]);
        const execSpy = sandbox.stub(vscode.commands, 'executeCommand').resolves();
        const provider = new MetadataDiffTreeDataProvider(context);
        await provider.setDiffFiles([
            { relativePath: 'a/b/file.txt', changes: 'Modified', type: 'modified', workspaceContent: 'one', storageContent: 'two' }
        ] as any);
        expect(provider.items.length).to.equal(1);
        expect(execSpy.calledWith('setContext', 'microsoft.powerplatform.pages.metadataDiff.hasData', true)).to.be.true;
    });

    it("clearItems resets state and context", async () => {
        const execSpy = sandbox.stub(vscode.commands, 'executeCommand').resolves();
        const provider = new MetadataDiffTreeDataProvider(context);
        await provider.setDiffFiles([
            { relativePath: 'file.txt', changes: 'Modified', type: 'modified', workspaceContent: 'one', storageContent: 'two' }
        ] as any);
        expect(provider.items.length).to.equal(1);
        provider.clearItems();
        expect(provider.items.length).to.equal(0);
        expect(execSpy.calledWith('setContext', 'microsoft.powerplatform.pages.metadataDiff.hasData', false)).to.be.true;
    });
});
