/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import * as vscode from 'vscode';
import {
    ServerLogicDebugProvider,
    providedServerLogicDebugConfig,
    generateServerMockSdk,
    isServerLogicFile,
    SERVER_LOGIC_COMMANDS
} from '../../server-logic';

describe('ServerLogicDebugger', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('isServerLogicFile', () => {
        it('should return true for .js files in server-logics folder', () => {
            expect(isServerLogicFile('/project/server-logics/handler.js')).to.be.true;
            expect(isServerLogicFile('C:\\project\\server-logics\\handler.js')).to.be.true;
        });

        it('should return true for .js files in server-logic folder (singular)', () => {
            expect(isServerLogicFile('/project/server-logic/handler.js')).to.be.true;
            expect(isServerLogicFile('C:\\project\\server-logic\\handler.js')).to.be.true;
        });

        it('should return false for .ts files in server-logics folder', () => {
            expect(isServerLogicFile('/project/server-logics/handler.ts')).to.be.false;
        });

        it('should return false for .js files outside server-logics folder', () => {
            expect(isServerLogicFile('/project/src/handler.js')).to.be.false;
            expect(isServerLogicFile('/project/server-logic-other/handler.js')).to.be.false;
        });
    });

    describe('SERVER_LOGIC_COMMANDS', () => {
        it('should have correct debug command', () => {
            expect(SERVER_LOGIC_COMMANDS.DEBUG).to.equal('microsoft.powerplatform.pages.debugServerLogic');
        });

        it('should have correct run command', () => {
            expect(SERVER_LOGIC_COMMANDS.RUN).to.equal('microsoft.powerplatform.pages.runServerLogic');
        });
    });

    describe('providedServerLogicDebugConfig', () => {
        it('should have correct type', () => {
            expect(providedServerLogicDebugConfig.type).to.equal('node');
        });

        it('should have correct request', () => {
            expect(providedServerLogicDebugConfig.request).to.equal('launch');
        });

        it('should have program set to ${file}', () => {
            expect(providedServerLogicDebugConfig.program).to.equal('${file}');
        });

        it('should skip node internals', () => {
            expect(providedServerLogicDebugConfig.skipFiles).to.deep.equal(['<node_internals>/**']);
        });

        it('should use internal console', () => {
            expect(providedServerLogicDebugConfig.console).to.equal('internalConsole');
        });
    });

    describe('ServerLogicDebugProvider', () => {
        let provider: ServerLogicDebugProvider;

        beforeEach(() => {
            provider = new ServerLogicDebugProvider();
        });

        describe('provideDebugConfigurations', () => {
            it('should return array with providedServerLogicDebugConfig', () => {
                const configs = provider.provideDebugConfigurations(undefined) as vscode.DebugConfiguration[];
                expect(configs).to.be.an('array');
                expect(configs).to.have.lengthOf(1);
                expect(configs[0]).to.deep.equal(providedServerLogicDebugConfig);
            });
        });

        describe('resolveDebugConfiguration', () => {
            let showErrorMessageStub: sinon.SinonStub;

            beforeEach(() => {
                showErrorMessageStub = sandbox.stub(vscode.window, 'showErrorMessage');
            });

            it('should return undefined and show error when no folder provided', async () => {
                const config: vscode.DebugConfiguration = {
                    type: 'node',
                    request: 'launch',
                    name: 'Test'
                };

                const result = await provider.resolveDebugConfiguration(
                    undefined,
                    config,
                    {} as vscode.CancellationToken
                );

                expect(result).to.be.undefined;
                expect(showErrorMessageStub.calledOnce).to.be.true;
            });

            it('should show error when empty config and no server logic file open', async () => {
                const folder: vscode.WorkspaceFolder = {
                    uri: vscode.Uri.file('some/path'),
                    index: 0,
                    name: 'Workspace',
                };
                const emptyConfig: vscode.DebugConfiguration = {
                    type: '',
                    request: '',
                    name: ''
                };

                sandbox.stub(vscode.window, 'activeTextEditor').value(undefined);

                const result = await provider.resolveDebugConfiguration(
                    folder,
                    emptyConfig,
                    {} as vscode.CancellationToken
                );

                expect(result).to.be.undefined;
                expect(showErrorMessageStub.calledOnce).to.be.true;
            });

            it('should show error when file is not in server-logics folder', async () => {
                const folder: vscode.WorkspaceFolder = {
                    uri: vscode.Uri.file('some/path'),
                    index: 0,
                    name: 'Workspace',
                };
                const emptyConfig: vscode.DebugConfiguration = {
                    type: '',
                    request: '',
                    name: ''
                };

                const mockEditor = {
                    document: {
                        uri: {
                            fsPath: '/some/path/regular-folder/test.js'
                        }
                    }
                };
                sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

                const result = await provider.resolveDebugConfiguration(
                    folder,
                    emptyConfig,
                    {} as vscode.CancellationToken
                );

                expect(result).to.be.undefined;
                expect(showErrorMessageStub.calledOnce).to.be.true;
            });

            it('should show error when file is .ts instead of .js', async () => {
                const folder: vscode.WorkspaceFolder = {
                    uri: vscode.Uri.file('some/path'),
                    index: 0,
                    name: 'Workspace',
                };
                const emptyConfig: vscode.DebugConfiguration = {
                    type: '',
                    request: '',
                    name: ''
                };

                const mockEditor = {
                    document: {
                        uri: {
                            fsPath: '/project/server-logics/handler.ts'
                        }
                    }
                };
                sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

                const result = await provider.resolveDebugConfiguration(
                    folder,
                    emptyConfig,
                    {} as vscode.CancellationToken
                );

                expect(result).to.be.undefined;
                expect(showErrorMessageStub.calledOnce).to.be.true;
            });
        });
    });

    describe('generateServerMockSdk', () => {
        it('should return a non-empty string', () => {
            const result = generateServerMockSdk();
            expect(result).to.be.a('string');
            expect(result.length).to.be.greaterThan(0);
        });

        it('should contain Server object definition', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('const Server');
        });

        it('should contain globalThis.Server assignment', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('globalThis.Server = Server');
        });

        it('should contain Logger implementation', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('Server.Logger.Log');
        });

        it('should contain Context object', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('Context:');
            expect(result).to.include('QueryParameters');
            expect(result).to.include('Headers');
        });

        it('should contain Dataverse mock', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('Dataverse');
        });

        it('should contain HttpClient mock', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('HttpClient');
            expect(result).to.include('GetAsync');
            expect(result).to.include('PostAsync');
        });

        it('should contain success message', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('Server Logic Mock SDK loaded successfully');
        });

        it('should contain HOW TO USE documentation', () => {
            const result = generateServerMockSdk();
            expect(result).to.include('HOW TO USE');
            expect(result).to.include('Edit the mock data below');
        });
    });
});
