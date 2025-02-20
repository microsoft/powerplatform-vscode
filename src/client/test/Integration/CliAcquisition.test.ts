/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CliAcquisition } from '../../lib/CliAcquisition';
import { ICliAcquisitionContext } from '../../lib/CliAcquisitionContext';
import { expect } from 'chai';

const repoRootDir = path.resolve(__dirname, '../../../..');
const outdir = path.resolve(repoRootDir, 'out');
const mockRootDir = path.resolve(outdir, 'testdata');
const mockDistDir = path.resolve(mockRootDir, 'dist');

class MockContext implements ICliAcquisitionContext {
    private readonly _testBaseDir: string;
    private readonly _infoMessages: string[];
    private readonly _errorMessages: string[];

    public constructor() {
        this._testBaseDir = path.resolve(outdir, 'testOut');
        fs.ensureDirSync(this._testBaseDir);
        this._infoMessages = [];
        this._errorMessages = [];
    }

    public get extensionPath(): string { return mockRootDir; }
    public get globalStorageLocalPath(): string { return this._testBaseDir; }

    public get infoMessages(): string[] { return this._infoMessages; }
    public get errorMessages(): string[] { return this._errorMessages; }
    public get noErrors(): boolean { return this._errorMessages.length === 0; }


    public showInformationMessage(message: string, ...items: string[]): void {
        this._infoMessages.push(JSON.stringify({ message: message, items: items }));
    }

    public showErrorMessage(message: string, ...items: string[]): void {
        this._errorMessages.push(JSON.stringify({ message: message, items: items }));
    }

    public showCliPreparingMessage(version: string): void {
        this._infoMessages.push(`Preparing pac CLI (v${version})...`);
    }

    public showCliReadyMessage(): void {
        this._infoMessages.push('The pac CLI is ready for use in your VS Code terminal!');
    }

    public showCliInstallFailedError(err: string): void {
        this._errorMessages.push(`Cannot install pac CLI: ${err}`)
    }

    public locDotnetNotInstalledOrInsufficient(): string {
        return "dotnet sdk 6.0 or greater must be installed";
    }
}

describe('CliAcquisition', () => {
    let acq: CliAcquisition;
    let spy: MockContext;

    before(() => {
        const pacDistDir = path.resolve(mockDistDir, 'pac');
        fs.ensureDirSync(pacDistDir);
        const testDataDir = path.resolve(__dirname, 'data');
        const nupkgs = ['microsoft.powerapps.cli.0.9.99.nupkg', 'microsoft.powerapps.cli.tool.0.9.99.nupkg']
        nupkgs.forEach(file => {
            fs.copyFileSync(path.resolve(testDataDir, file), path.resolve(pacDistDir, file));
        });
    });

    beforeEach(() => {
        spy = new MockContext();
        acq = new CliAcquisition(spy);
    });

    afterEach(() => {
        fs.emptyDirSync(path.resolve(spy.globalStorageLocalPath));
    });

    it('determine dist versions and exe path', () => {
        expect(acq.cliVersion).to.be.not.undefined;
        expect(acq.cliExePath).to.be.not.undefined;
        expect(spy.infoMessages).to.be.empty;
        expect(spy.noErrors).to.be.true;
    });

    // it('unpacks latest CLI nupkg', async () => {
    //     fs.removeSync(path.resolve(spy.globalStorageLocalPath, 'installTracker.json'));
    //     const exePath = await acq.ensureInstalled();

    //     expect(exePath).to.be.not.undefined;
    //     expect(fs.existsSync(path.resolve(exePath, 'pac'))).to.be.true;
    //     expect(spy.infoMessages).to.be.not.empty;
    //     expect(spy.noErrors).to.be.true;
    // }).timeout(20000);

    // it('updates older version to latest CLI nupkg', async () => {
    //     const trackerFile = path.resolve(spy.globalStorageLocalPath, 'installTracker.json');
    //     fs.removeSync(trackerFile);
    //     fs.writeJSONSync(trackerFile, { pac: '0.9.42' });
    //     const exePath = await acq.ensureInstalled();

    //     expect(exePath).to.be.not.undefined;
    //     expect(fs.existsSync(path.resolve(exePath, 'pac'))).to.be.true;
    //     expect(spy.infoMessages).to.be.not.empty;
    //     expect(spy.noErrors).to.be.true;
    //     const versionInfo = fs.readJSONSync(trackerFile);
    //     expect(versionInfo.pac).to.be.equal('0.9.99');
    // }).timeout(20000);
});
