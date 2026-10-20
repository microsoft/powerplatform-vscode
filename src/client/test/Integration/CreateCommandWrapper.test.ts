/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as vscode from 'vscode';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { initializeGenerator } from '../../power-pages/create/CreateCommandWrapper';
import { ICliAcquisitionContext } from '../../lib/CliAcquisitionContext';

const repoRootDir = path.resolve(__dirname, '../../../..');
const outdir = path.resolve(repoRootDir, 'out');

class MockInitContext implements ICliAcquisitionContext {
    private readonly _testBaseDir: string;
    private readonly _infoMessages: string[];
    private readonly _errorMessages: string[];

    public constructor() {
        this._testBaseDir = path.resolve(outdir, 'testInitOut');
        fs.ensureDirSync(this._testBaseDir);
        this._infoMessages = [];
        this._errorMessages = [];
    }

    public get extensionPath(): string { return repoRootDir; }
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

describe('CreateCommandWrapper Integration', () => {
    let mockContext: vscode.ExtensionContext;
    let cliContext: MockInitContext;
    let configUpdateStub: sinon.SinonStub;
    let commandsRegisterStub: sinon.SinonStub;

    beforeEach(() => {
        cliContext = new MockInitContext();
        
        // Create mock VS Code extension context
        mockContext = {
            subscriptions: []
        } as any;

        // Stub vscode.workspace.getConfiguration
        configUpdateStub = sinon.stub();
        const mockConfig = {
            update: configUpdateStub
        };
        sinon.stub(vscode.workspace, 'getConfiguration').returns(mockConfig as any);

        // Stub vscode.commands.registerCommand
        commandsRegisterStub = sinon.stub(vscode.commands, 'registerCommand');
    });

    afterEach(() => {
        fs.emptyDirSync(path.resolve(cliContext.globalStorageLocalPath));
        sinon.restore();
    });

    it('should set generatorInstalled config only when generator is actually available', () => {
        // Call initializeGenerator
        initializeGenerator(mockContext, cliContext);

        // Check if the config was properly set
        const configCalls = configUpdateStub.getCalls();
        const generatorInstalledCall = configCalls.find(call => 
            call.args[0] === 'generatorInstalled' && call.args[1] === true);

        const hasSuccessMessage = cliContext.infoMessages.some(msg => 
            msg.includes('The Power Pages generator is ready for use'));

        // This is the key assertion: if we show success message, config should be set
        if (hasSuccessMessage) {
            expect(generatorInstalledCall).to.not.be.undefined;
        } else {
            expect(generatorInstalledCall).to.be.undefined;
        }
    });

    it('should register commands only when generator is available', () => {
        // Call initializeGenerator
        initializeGenerator(mockContext, cliContext);

        // Check if commands were registered
        const commandRegistrationCalls = commandsRegisterStub.getCalls();
        const powerPagesCommands = commandRegistrationCalls.filter(call => 
            call.args[0].includes('microsoft-powerapps-portals.'));

        const configCalls = configUpdateStub.getCalls();
        const generatorInstalledCall = configCalls.find(call => 
            call.args[0] === 'generatorInstalled' && call.args[1] === true);

        // Commands should be registered if and only if config is set
        if (generatorInstalledCall) {
            expect(powerPagesCommands.length).to.be.greaterThan(0);
        } else {
            expect(powerPagesCommands.length).to.equal(0);
        }
    });
});