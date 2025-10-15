/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { expect } from 'chai';
import { initializeGenerator } from '../../power-pages/create/CreateCommandWrapper';
import { GeneratorAcquisition } from '../../lib/GeneratorAcquisition';
import { ICliAcquisitionContext } from '../../lib/CliAcquisitionContext';

describe('CreateCommandWrapper', () => {
    let context: vscode.ExtensionContext;
    let cliContext: ICliAcquisitionContext;
    let registerCommandStub: sinon.SinonStub;
    let generatorStub: sinon.SinonStubbedInstance<GeneratorAcquisition>;

    beforeEach(() => {
        registerCommandStub = sinon.stub(vscode.commands, 'registerCommand');
        
        context = {
            subscriptions: [],
            globalState: {
                get: sinon.stub(),
                update: sinon.stub(),
                setKeysForSync: sinon.stub()
            },
            workspaceState: {
                get: sinon.stub(),
                update: sinon.stub(),
                keys: sinon.stub().returns([])
            }
        } as unknown as vscode.ExtensionContext;

        cliContext = {
            extensionPath: '/mock/path',
            globalStorageLocalPath: '/mock/storage',
            showInformationMessage: sinon.stub(),
            showErrorMessage: sinon.stub(),
            showCliPreparingMessage: sinon.stub(),
            showCliReadyMessage: sinon.stub(),
            showCliInstallFailedError: sinon.stub(),
            locDotnetNotInstalledOrInsufficient: sinon.stub()
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should register commands even when generator installation fails', () => {
        // Stub GeneratorAcquisition to simulate failed installation
        sinon.stub(GeneratorAcquisition.prototype, 'ensureInstalled').returns(null);
        sinon.stub(GeneratorAcquisition.prototype, 'yoCommandPath').get(() => null);

        initializeGenerator(context, cliContext);

        // Verify that all Power Pages commands were registered despite installation failure
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.contentsnippet')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.webtemplate')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.webpage')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.pagetemplate')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.webfile')).to.be.true;
    });

    it('should register commands when generator installation succeeds', () => {
        // Stub GeneratorAcquisition to simulate successful installation
        sinon.stub(GeneratorAcquisition.prototype, 'ensureInstalled').returns('/mock/yo/path');
        sinon.stub(GeneratorAcquisition.prototype, 'yoCommandPath').get(() => '/mock/yo/path');

        const updateStub = sinon.stub();
        sinon.stub(vscode.workspace, 'getConfiguration').returns({
            update: updateStub
        } as unknown as vscode.WorkspaceConfiguration);

        initializeGenerator(context, cliContext);

        // Verify that all Power Pages commands were registered
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.contentsnippet')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.webtemplate')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.webpage')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.pagetemplate')).to.be.true;
        expect(registerCommandStub.calledWith('microsoft-powerapps-portals.webfile')).to.be.true;

        // Verify that the configuration was updated to indicate generator is installed
        expect(updateStub.calledWith('generatorInstalled', true, true)).to.be.true;
    });

    it('should show error message when command is invoked without generator installed', async () => {
        // Stub GeneratorAcquisition to simulate failed installation
        sinon.stub(GeneratorAcquisition.prototype, 'ensureInstalled').returns(null);
        sinon.stub(GeneratorAcquisition.prototype, 'yoCommandPath').get(() => null);

        const showErrorMessageStub = sinon.stub(vscode.window, 'showErrorMessage').resolves(undefined);

        initializeGenerator(context, cliContext);

        // Get the registered command handler for webpage
        const webpageCommand = registerCommandStub.getCalls().find(
            call => call.args[0] === 'microsoft-powerapps-portals.webpage'
        );
        expect(webpageCommand).to.not.be.undefined;

        // Execute the command handler
        if (webpageCommand) {
            await webpageCommand.args[1]();

            // Verify that an error message was shown
            expect(showErrorMessageStub.called).to.be.true;
            const errorMessage = showErrorMessageStub.getCall(0).args[0];
            expect(errorMessage).to.contain('Power Pages generator is not available');
        }
    });
});
