/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { performDiscard } from '../../../../client/power-pages/metadata-diff/MetadataDiffCommands';

// Minimal mock ExtensionContext for performDiscard (only storageUri is required for materialize flow)
interface MinimalContext extends Partial<vscode.ExtensionContext> { storageUri: vscode.Uri; }

describe('metadata-diff performDiscard', () => {
    const sandbox = sinon.createSandbox();
    let workspaceRoot: string;
    let storageRoot: string;
    let context: MinimalContext;

    beforeEach(() => {
        workspaceRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mdiff-workspace-'));
        storageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'mdiff-storage-'));
        context = { storageUri: vscode.Uri.file(storageRoot) } as MinimalContext;
        // Patch workspaceFolders (read-only in normal runtime) for test purposes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (vscode.workspace as any).workspaceFolders = [{ uri: vscode.Uri.file(workspaceRoot) }];
        // Stub dialogs to auto-confirm using first action item
        sandbox.stub(vscode.window, 'showWarningMessage').callsFake((...args: unknown[]) => {
            // action items start after the (possibly) options object
            const items = args.filter(a => typeof a === 'string').slice(1); // crude but effective for this controlled usage
            const first = items[0];
            return Promise.resolve(first as never);
        });
        sandbox.stub(vscode.window, 'showInformationMessage').resolves(undefined as never);
    });

    afterEach(() => {
        sandbox.restore();
        // Cleanup temp dirs
        try { fs.rmSync(workspaceRoot, { recursive: true, force: true }); } catch { /* ignore */ }
        try { fs.rmSync(storageRoot, { recursive: true, force: true }); } catch { /* ignore */ }
    });

    it('overwrites modified local file with environment copy (actionType overwrite)', async () => {
        const localFile = path.join(workspaceRoot, 'folder', 'file.txt');
        fs.mkdirSync(path.dirname(localFile), { recursive: true });
        fs.writeFileSync(localFile, 'LOCAL', 'utf8');
        const storedFile = path.join(storageRoot, 'guid-site', 'folder', 'file.txt');
        fs.mkdirSync(path.dirname(storedFile), { recursive: true });
        fs.writeFileSync(storedFile, 'REMOTE', 'utf8');

        const result = await performDiscard(context as unknown as vscode.ExtensionContext, { workspaceFile: localFile, storedFilePath: storedFile });
        expect(result?.actionType).to.equal('overwrite');
        expect(fs.readFileSync(localFile, 'utf8')).to.equal('REMOTE');
    });

    it('deletes local-only file (actionType delete)', async () => {
        const localFile = path.join(workspaceRoot, 'onlyLocal.txt');
        fs.writeFileSync(localFile, 'ONLY_LOCAL', 'utf8');
        const result = await performDiscard(context as unknown as vscode.ExtensionContext, { workspaceFile: localFile });
        expect(result?.actionType).to.equal('delete');
        expect(fs.existsSync(localFile)).to.be.false;
    });

    it('materializes environment-only file (actionType materialize)', async () => {
        const storedFile = path.join(storageRoot, 'site-guid', 'nested', 'envOnly.txt');
        fs.mkdirSync(path.dirname(storedFile), { recursive: true });
        fs.writeFileSync(storedFile, 'ENV_ONLY', 'utf8');
        const relativePath = 'nested/envOnly.txt';
        const result = await performDiscard(context as unknown as vscode.ExtensionContext, { storedFilePath: storedFile, relativePath });
        expect(result?.actionType).to.equal('materialize');
        const localPath = path.join(workspaceRoot, relativePath);
        expect(fs.existsSync(localPath)).to.be.true;
        expect(fs.readFileSync(localPath, 'utf8')).to.equal('ENV_ONLY');
    });
});
