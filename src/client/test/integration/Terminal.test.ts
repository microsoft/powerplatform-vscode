// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { expect } from 'chai';
import { before, describe, it } from 'mocha';

const repoRootDir = path.resolve(__dirname, '../../../..');
const outdir = path.resolve(repoRootDir, 'out');

const delay = (t:number) => new Promise(resolve => setTimeout(resolve, t));

describe('Terminal tests', () => {
    before(() => {
        fs.ensureDirSync(outdir);
        vscode.window.showInformationMessage('Start all tests.');
    });

    it('launch CLI', (done) => {
        const terminal = vscode.window.createTerminal();
        terminal.show();
        const logFile = path.resolve(outdir, 'int-test.log');
        terminal.sendText(`pac help > ${logFile}`);
        delay(10000)
            .then(() => {
                const log = fs.readFileSync(logFile, 'utf-8');
                vscode.window.showInformationMessage(`Got pac CLI output: ${log}`);
                expect(log).to.contain('Usage: pac');
                expect(log).to.contain('auth');
                delay(2000).then(() => done());
            });
    }).timeout(15000);
});
