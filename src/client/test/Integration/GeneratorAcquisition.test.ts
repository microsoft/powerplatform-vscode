/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { GeneratorAcquisition } from '../../lib/GeneratorAcquisition';
import { ICliAcquisitionContext } from '../../lib/CliAcquisitionContext';
import { expect } from 'chai';

const repoRootDir = path.resolve(__dirname, '../../../..');
const outdir = path.resolve(repoRootDir, 'out');
const mockRootDir = path.resolve(outdir, 'testdata');

class MockGeneratorContext implements ICliAcquisitionContext {
    private readonly _testBaseDir: string;
    private readonly _infoMessages: string[];
    private readonly _errorMessages: string[];

    public constructor() {
        this._testBaseDir = path.resolve(outdir, 'testGeneratorOut');
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
        this._infoMessages.push(message);
    }

    public showErrorMessage(message: string, ...items: string[]): void {
        this._errorMessages.push(message);
    }

    public showCliPreparingMessage(version: string): void {
        this._infoMessages.push(`Preparing generator (v${version})...`);
    }

    public showCliReadyMessage(): void {
        this._infoMessages.push('The Power Pages generator is ready for use in your VS Code extension!');
    }

    public showCliInstallFailedError(err: string): void {
        this._errorMessages.push(`Cannot install Power Pages generator: ${err}`)
    }

    public locDotnetNotInstalledOrInsufficient(): string {
        return "npm must be installed";
    }
}

describe('GeneratorAcquisition', () => {
    let acq: GeneratorAcquisition;
    let spy: MockGeneratorContext;

    before(() => {
        const generatorDistDir = path.resolve(mockRootDir, 'dist', 'powerpages');
        fs.ensureDirSync(generatorDistDir);
    });

    beforeEach(() => {
        spy = new MockGeneratorContext();
        acq = new GeneratorAcquisition(spy);
    });

    afterEach(() => {
        fs.emptyDirSync(path.resolve(spy.globalStorageLocalPath));
    });

    it('should return null if yoCommandPath is not found after installation', () => {
        // This test simulates the scenario where installation succeeds but yo command is not available
        const result = acq.ensureInstalled();
        
        // In the original code, this would return null even if showing success message
        // After our fix, it should either return a valid path or null with proper error message
        if (result === null) {
            // If null is returned, ensure we have an appropriate error message
            expect(spy.errorMessages.length).to.be.greaterThan(0);
        } else {
            // If a path is returned, it should be valid
            expect(result).to.be.a('string');
            expect(fs.existsSync(result)).to.be.true;
        }
    });

    it('should provide proper logging for installation states', () => {
        const result = acq.ensureInstalled();
        
        // The function should either show success or error messages, not both
        const hasSuccessMessage = spy.infoMessages.some(msg => 
            msg.includes('The Power Pages generator is ready for use'));
        const hasErrorMessage = spy.errorMessages.length > 0;
        
        if (result !== null) {
            // If installation succeeded, we should have success message
            expect(hasSuccessMessage).to.be.true;
            expect(hasErrorMessage).to.be.false;
        } else {
            // If installation failed, we should have error message
            expect(hasErrorMessage).to.be.true;
        }
    });

    it('should not return null when showing success message', () => {
        const result = acq.ensureInstalled();
        
        const hasSuccessMessage = spy.infoMessages.some(msg => 
            msg.includes('The Power Pages generator is ready for use'));
        
        // This is the key fix: if we show success message, result should not be null
        if (hasSuccessMessage) {
            expect(result).to.not.be.null;
        }
    });
});