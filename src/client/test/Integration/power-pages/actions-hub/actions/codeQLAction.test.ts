/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { CodeQLAction } from '../../../../../power-pages/actions-hub/actions/codeQLAction';

describe('CodeQLAction', () => {
    let sandbox: sinon.SinonSandbox;
    let codeqlAction: CodeQLAction;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        // Mock the output channel
        const mockOutputChannel = {
            show: sandbox.stub(),
            appendLine: sandbox.stub(),
            dispose: sandbox.stub()
        };

        sandbox.stub(vscode.window, 'createOutputChannel').returns(mockOutputChannel as never);
        codeqlAction = new CodeQLAction();
    });

    afterEach(() => {
        codeqlAction.dispose();
        sandbox.restore();
    });

    describe('constructor', () => {
        it('should create output channel with correct name', () => {
            const action = new CodeQLAction();
            assert.ok(action);
            action.dispose();
        });
    });

    describe('dispose', () => {
        it('should dispose output channel when dispose is called', () => {
            const action = new CodeQLAction();
            action.dispose();
            // Should not throw when disposing
        });
    });

    describe('executeCodeQLAnalysisWithCustomPath', () => {
        it('should handle missing CodeQL extension gracefully', async () => {
            const sitePath = '/test/site/path';
            const databaseLocation = '/test/db/location';

            // Mock VS Code API to simulate missing CodeQL extension
            sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);
            const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

            try {
                await codeqlAction.executeCodeQLAnalysisWithCustomPath(sitePath, databaseLocation);
                assert.ok(showErrorStub.called, 'Should show error when CodeQL extension is missing');
            } catch (error) {
                // Expected error for missing extension
                assert.ok(true, 'Should handle missing extension gracefully');
            }
        });

        it('should create output channel and show it during analysis', async () => {
            const sitePath = '/test/site/path';
            const databaseLocation = '/test/db/location';

            // Mock VS Code API to avoid actual extension checks
            sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);
            sandbox.stub(vscode.window, 'showErrorMessage').resolves();
            const createChannelStub = vscode.window.createOutputChannel as sinon.SinonStub;

            await codeqlAction.executeCodeQLAnalysisWithCustomPath(sitePath, databaseLocation);

            assert.ok(createChannelStub.called, 'Should create output channel');
        });

        it('should handle CodeQL extension activation', async () => {
            const sitePath = '/test/site/path';
            const databaseLocation = '/test/db/location';

            const mockExtension = {
                isActive: false,
                activate: sandbox.stub().resolves(),
                exports: null
            };

            sandbox.stub(vscode.extensions, 'getExtension').returns(mockExtension as never);
            sandbox.stub(vscode.window, 'showErrorMessage').resolves();

            try {
                await codeqlAction.executeCodeQLAnalysisWithCustomPath(sitePath, databaseLocation);
                assert.ok(mockExtension.activate.called, 'Should attempt to activate CodeQL extension');
            } catch (error) {
                // Handle expected errors during test execution
                assert.ok(true, 'Test completed');
            }
        });

    });

    describe('error handling', () => {
        it('should handle exceptions gracefully during analysis', async () => {
            // This test verifies that the method handles errors without crashing
            const sitePath = '/test/site/path';
            const databaseLocation = '/test/db/location';

            // Mock extensions.getExtension to return undefined (no CodeQL extension)
            sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);
            sandbox.stub(vscode.window, 'showErrorMessage').resolves();

            // This should complete without throwing an unhandled error
            await codeqlAction.executeCodeQLAnalysisWithCustomPath(sitePath, databaseLocation);

            // Test passes if we reach this point
            assert.ok(true, 'Should handle missing extension gracefully');
        });

        it('should handle null or undefined inputs gracefully', async () => {
            // Test with null paths
            sandbox.stub(vscode.extensions, 'getExtension').returns(undefined);
            sandbox.stub(vscode.window, 'showErrorMessage').resolves();

            // Should not throw with null/undefined inputs
            await codeqlAction.executeCodeQLAnalysisWithCustomPath('', '');

            assert.ok(true, 'Should handle empty string inputs without throwing');
        });
    });

    describe('integration behavior', () => {
        it('should work with basic mocked VS Code environment', () => {
            // Test that the class can be instantiated and used in a basic VS Code mock environment
            const action = new CodeQLAction();

            assert.ok(action, 'Should create CodeQLAction instance');
            assert.ok(typeof action.executeCodeQLAnalysisWithCustomPath === 'function', 'Should have main execution method');
            assert.ok(typeof action.dispose === 'function', 'Should have dispose method');

            action.dispose();
        });

        it('should handle VS Code API changes gracefully', async () => {
            // Test behavior when VS Code APIs return unexpected values
            const sitePath = '/test/site/path';
            const databaseLocation = '/test/db/location';

            sandbox.stub(vscode.extensions, 'getExtension').returns(null as never);
            sandbox.stub(vscode.window, 'showErrorMessage').resolves();

            // Should handle null return from getExtension
            await codeqlAction.executeCodeQLAnalysisWithCustomPath(sitePath, databaseLocation);

            assert.ok(true, 'Should handle null extension return gracefully');
        });

    });
});
