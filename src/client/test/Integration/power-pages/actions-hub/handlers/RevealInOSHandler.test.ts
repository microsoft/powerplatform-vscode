/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { revealInOS } from '../../../../../power-pages/actions-hub/handlers/RevealInOSHandler';
import { Constants } from '../../../../../power-pages/actions-hub/Constants';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import CurrentSiteContext from '../../../../../power-pages/actions-hub/CurrentSiteContext';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('RevealInOSHandler', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('revealInOS', () => {
        let executeCommandStub: sinon.SinonStub;

        beforeEach(() => {
            executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
        });

        afterEach(() => {
            executeCommandStub.restore();
        });

        describe('when opening active site', () => {
            it('should not reveal file in OS when file path is not provided', async () => {
                sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => undefined);
                await revealInOS({ contextValue: Constants.ContextValues.CURRENT_ACTIVE_SITE } as SiteTreeItem);

                expect(executeCommandStub.called).to.be.false;
            });

            it('should reveal file in OS when file path is provided', async () => {
                const mockPath = 'test-path';
                sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => mockPath);
                await revealInOS({ contextValue: Constants.ContextValues.CURRENT_ACTIVE_SITE } as SiteTreeItem);

                expect(executeCommandStub.calledOnceWith('revealFileInOS', vscode.Uri.file(mockPath))).to.be.true;
            });
        });

        describe('when opening other site', () => {
            it('should not reveal file in OS when file path is not provided', async () => {
                await revealInOS({ contextValue: Constants.ContextValues.OTHER_SITE, siteInfo: {} } as SiteTreeItem);

                expect(executeCommandStub.called).to.be.false;
            });

            it('should reveal file in OS when file path is provided', async () => {
                const mockPath = 'test-path';
                await revealInOS({ contextValue: Constants.ContextValues.OTHER_SITE, siteInfo: { folderPath: mockPath } } as SiteTreeItem);

                expect(executeCommandStub.calledOnceWith('revealFileInOS', vscode.Uri.file(mockPath))).to.be.true;
            });
        });
    });
});
