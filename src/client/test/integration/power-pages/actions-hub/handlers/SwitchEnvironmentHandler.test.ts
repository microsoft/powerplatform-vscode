/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { switchEnvironment } from '../../../../../power-pages/actions-hub/handlers/SwitchEnvironmentHandler';
import { AuthInfo, CloudInstance, EnvironmentType } from '../../../../../pac/PacTypes';
import { PacTerminal } from '../../../../../lib/PacTerminal';
import PacContext from '../../../../../pac/PacContext';
import ArtemisContext from '../../../../../ArtemisContext';
import { ServiceEndpointCategory } from '../../../../../../common/services/Constants';
import { IArtemisAPIOrgResponse } from '../../../../../../common/services/Interfaces';
import * as Utils from '../../../../../../common/utilities/Utils';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('SwitchEnvironmentHandler', () => {
    let sandbox: sinon.SinonSandbox;

    const mockAuthInfo: AuthInfo = {
        UserType: 'user-type',
        Cloud: CloudInstance.Preprod,
        TenantId: 'test-tenant',
        TenantCountry: 'tenant-country',
        User: 'user',
        EntraIdObjectId: 'test-object-id',
        Puid: 'test-puid',
        UserCountryRegion: 'user-country-region',
        TokenExpires: 'token-expires',
        Authority: 'authority',
        EnvironmentGeo: 'test-geo',
        EnvironmentId: 'test-env-id',
        EnvironmentType: EnvironmentType.Regular,
        OrganizationId: 'test-org-id',
        OrganizationUniqueName: 'test-org-name',
        OrganizationFriendlyName: 'test-org-friendly-name'
    };

    const artemisResponse = {
        environment: 'cluster-env',
        clusterCategory: 'cluster-category',
        geoName: 'geo-name'
    } as IArtemisAPIOrgResponse;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: artemisResponse };
        sandbox.stub(PacContext, 'setContext');
        sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('switchEnvironment', () => {
        let mockPacTerminal: { getWrapper: sinon.SinonStub };
        let mockOrgList: sinon.SinonStub;
        let mockOrgSelect: sinon.SinonStub;
        let mockShowQuickPick: sinon.SinonStub;
        let mockPacContext: sinon.SinonStub;
        let mockShowProgressNotification: sinon.SinonStub;

        const mockEnvList = [
            {
                FriendlyName: 'Dev Environment',
                EnvironmentUrl: 'https://dev.crm.dynamics.com'
            },
            {
                FriendlyName: 'Prod Environment',
                EnvironmentUrl: 'https://prod.crm.dynamics.com'
            }
        ];

        beforeEach(() => {
            mockPacTerminal = {
                getWrapper: sandbox.stub()
            };
            mockOrgList = sandbox.stub();
            mockOrgSelect = sandbox.stub();
            mockPacTerminal.getWrapper.returns({
                orgList: mockOrgList,
                orgSelect: mockOrgSelect
            });
            mockShowQuickPick = sandbox.stub(vscode.window, 'showQuickPick');
            mockPacContext = sinon.stub(PacContext, 'AuthInfo').get(() => ({
                OrganizationFriendlyName: 'Dev Environment'
            }));
            mockShowProgressNotification = sinon.stub(Utils, 'showProgressWithNotification').callsFake(async (title: string, task: (progress: vscode.Progress<{
                message?: string;
                increment?: number;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            }>) => Promise<any>) => await task({} as unknown as vscode.Progress<{ message?: string; increment?: number }>));
        });

        afterEach(() => {
            mockPacContext.get(() => mockAuthInfo);
            mockShowProgressNotification.restore();
        });

        it('should switch environment successfully when env is selected', async () => {
            mockOrgList.resolves({
                Status: 'Success',
                Results: mockEnvList
            });
            mockShowQuickPick.resolves({
                label: 'Prod Environment',
                detail: 'https://prod.crm.dynamics.com'
            });
            mockOrgSelect.resolves();

            await switchEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(mockOrgList.calledOnce).to.be.true;
            expect(mockShowQuickPick.calledOnce).to.be.true;

            const envList = await mockShowQuickPick.firstCall.args[0];
            expect(envList).to.deep.equal([
                {
                    label: 'Dev Environment',
                    detail: 'https://dev.crm.dynamics.com',
                    description: 'Current'
                },
                {
                    label: 'Prod Environment',
                    detail: 'https://prod.crm.dynamics.com',
                    description: ''
                }
            ]);

            expect(mockShowQuickPick.firstCall.args[1]).to.deep.equal({
                placeHolder: 'Select an environment'
            });
            expect(mockShowProgressNotification.calledOnce, "Switch environment notification was not called").to.be.true;
            expect(mockShowProgressNotification.firstCall.args[0]).to.equal('Changing environment...');
            expect(mockOrgSelect.calledOnce, "Org select function was not called").to.be.true;
            expect(mockOrgSelect.firstCall.args[0]).to.equal('https://prod.crm.dynamics.com');
        });

        it('should not switch environment when current environment is selected', async () => {
            mockOrgList.resolves({
                Status: 'Success',
                Results: mockEnvList
            });
            mockShowQuickPick.resolves({
                label: 'Dev Environment',
                detail: 'https://dev.crm.dynamics.com'
            });
            mockOrgSelect.resolves();

            await switchEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(mockOrgList.calledOnce).to.be.true;
            expect(mockShowQuickPick.calledOnce).to.be.true;

            const envList = await mockShowQuickPick.firstCall.args[0];
            expect(envList).to.deep.equal([
                {
                    label: 'Dev Environment',
                    detail: 'https://dev.crm.dynamics.com',
                    description: 'Current'
                },
                {
                    label: 'Prod Environment',
                    detail: 'https://prod.crm.dynamics.com',
                    description: ''
                }
            ]);

            expect(mockShowProgressNotification.calledOnce, "Switch environment notification was called").to.be.false;
            expect(mockOrgSelect.calledOnce, "Org select function was called").to.be.false;
        });
    });
});
