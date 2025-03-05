/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { showEnvironmentDetails, refreshEnvironment, switchEnvironment, openActiveSitesInStudio, openInactiveSitesInStudio, createNewAuthProfile, previewSite, fetchWebsites, revealInOS, uploadSite, createKnownSiteIdsSet, findOtherSites, showSiteDetails, openSiteManagement, downloadSite, openInStudio } from '../../../../power-pages/actions-hub/ActionsHubCommandHandlers';
import { Constants } from '../../../../power-pages/actions-hub/Constants';
import { oneDSLoggerWrapper } from '../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import * as CommonUtils from '../../../../power-pages/commonUtility';
import { AuthInfo, CloudInstance, EnvironmentType, OrgInfo } from '../../../../pac/PacTypes';
import { PacTerminal } from '../../../../lib/PacTerminal';
import PacContext from '../../../../pac/PacContext';
import ArtemisContext from '../../../../ArtemisContext';
import { ServiceEndpointCategory, WebsiteDataModel } from '../../../../../common/services/Constants';
import { IArtemisAPIOrgResponse, IWebsiteDetails } from '../../../../../common/services/Interfaces';
import { PacWrapper } from '../../../../pac/PacWrapper';
import * as authProvider from '../../../../../common/services/AuthenticationProvider';
import * as PacAuthUtil from '../../../../../common/utilities/PacAuthUtil';
import { PreviewSite } from '../../../../power-pages/preview-site/PreviewSite';
import { SiteTreeItem } from '../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { WebsiteStatus } from '../../../../power-pages/actions-hub/models/WebsiteStatus';
import { IWebsiteInfo } from '../../../../power-pages/actions-hub/models/IWebsiteInfo';
import * as WebsiteUtils from '../../../../../common/utilities/WebsiteUtil';
import * as Utils from '../../../../../common/utilities/Utils';
import CurrentSiteContext from '../../../../power-pages/actions-hub/CurrentSiteContext';
import * as WorkspaceInfoFinderUtil from "../../../../../common/utilities/WorkspaceInfoFinderUtil";
import path from 'path';

describe('ActionsHubCommandHandlers', () => {
    let sandbox: sinon.SinonSandbox;
    let mockShowInformationMessage: sinon.SinonStub;
    let mockSetAuthInfo: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

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

    const mockOrgInfo: OrgInfo = {
        OrgId: 'test-org-id',
        UniqueName: 'test-org-name',
        FriendlyName: 'test-org-friendly-name',
        OrgUrl: 'test-org-url',
        UserEmail: 'test-user-email',
        UserId: 'test-user-id',
        EnvironmentId: 'test-env-id',
    };

    const artemisResponse = {
        environment: 'cluster-env',
        clusterCategory: 'cluster-category',
        geoName: 'geo-name'
    } as IArtemisAPIOrgResponse;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        mockShowInformationMessage = sandbox.stub(vscode.window, 'showInformationMessage');
        ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: artemisResponse };
        mockSetAuthInfo = sandbox.stub(PacContext, 'setContext');
        traceErrorStub = sinon.stub();
        sandbox.stub(oneDSLoggerWrapper, 'getLogger').returns({
            traceError: traceErrorStub,
            traceInfo: sinon.stub(),
            traceWarning: sinon.stub(),
            featureUsage: sinon.stub(),
        });
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('showEnvironmentDetails', () => {
        it('should show information notification', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should have expected heading', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            const message = mockShowInformationMessage.firstCall.args[0];
            expect(message).to.include("Session Details");
        });

        it('should be rendered as modal', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            const message = mockShowInformationMessage.firstCall.args[1];
            expect(message.modal).to.be.true;
        });

        it('should show environment details when auth info is available', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            PacContext['_orgInfo'] = mockOrgInfo;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;

            const message = mockShowInformationMessage.firstCall.args[1].detail;
            expect(message).to.include("Timestamp");
            expect(message).to.include("Tenant ID: test-tenant");
            expect(message).to.include("Object ID: test-object-id");
            expect(message).to.include("Organization ID: test-org-id");
            expect(message).to.include("Unique name: test-org-name");
            expect(message).to.include("Instance url: test-org-url");
            expect(message).to.include("Environment ID: test-env-id");
            expect(message).to.include("Cluster environment: cluster-env");
            expect(message).to.include("Cluster category: cluster-cat");
            expect(message).to.include("Cluster geo name: geo-name");
        });

        it('should handle cases without auth info', async () => {
            PacContext['_authInfo'] = null;
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showEnvironmentDetails();

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should handle errors appropriately', async () => {
            mockShowInformationMessage.throws(new Error('Test error'));

            await showEnvironmentDetails();

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_SHOW_ENVIRONMENT_DETAILS_FAILED);
        });
    });

    describe('refreshEnvironment', () => {
        let mockPacTerminal: { getWrapper: sinon.SinonStub };
        let mockActiveAuth: sinon.SinonStub;
        let mockExtractAuthInfo: sinon.SinonStub;

        beforeEach(() => {
            mockPacTerminal = {
                getWrapper: sandbox.stub()
            };
            mockActiveAuth = sandbox.stub();
            mockPacTerminal.getWrapper.returns({ activeAuth: mockActiveAuth });
            mockExtractAuthInfo = sandbox.stub(CommonUtils, 'extractAuthInfo').returns(mockAuthInfo as unknown as AuthInfo);
        });

        it('should refresh environment successfully when auth is available', async () => {
            PacContext['_authInfo'] = mockAuthInfo;
            const mockResults = {
                tenantId: 'test-tenant',
                userId: 'test-user'
            };
            mockActiveAuth.resolves({
                Status: 'Success',
                Results: mockResults
            });

            await refreshEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(mockActiveAuth.calledOnce).to.be.true;
            expect(mockSetAuthInfo.calledOnce).to.be.true;
            expect(mockExtractAuthInfo.calledOnce).to.be.true;
            expect(mockSetAuthInfo.firstCall.args[0]).to.deep.equal(mockAuthInfo);
        });

        it('should not set auth info when activeAuth status is not success', async () => {
            mockActiveAuth.resolves({
                Status: 'Failed',
                Results: null
            });

            await refreshEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(mockActiveAuth.calledOnce).to.be.true;
            expect(mockSetAuthInfo.called).to.be.false;
            expect(mockExtractAuthInfo.called).to.be.false;
        });

        it('should handle error when activeAuth fails', async () => {
            const error = new Error('Active auth failed');
            mockActiveAuth.rejects(error);

            await refreshEnvironment(mockPacTerminal as unknown as PacTerminal);

            expect(traceErrorStub.firstCall.args[3]).to.deep.equal({ methodName: 'refreshEnvironment' });
        });
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

    describe('openActiveSitesInStudio', () => {
        let mockUrl: sinon.SinonSpy;

        beforeEach(() => {
            PacContext["_authInfo"] = mockAuthInfo;
            mockUrl = sandbox.spy(vscode.Uri, 'parse');
            sandbox.stub(vscode.env, 'openExternal');
        });

        describe('when service endpoint category is TEST', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open active sites in studio', async () => {
                await openActiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.test.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=active');
            });
        });

        describe('when service endpoint category is PREPROD', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.PREPROD, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open active sites in studio', async () => {
                await openActiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.preprod.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=active');
            });
        });

        describe('when service endpoint category is PROD', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.PROD, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open active sites in studio', async () => {
                await openActiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=active');
            });
        });

        describe('when service endpoint category is DOD', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.DOD, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open active sites in studio', async () => {
                await openActiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.powerpages.microsoft.appsplatform.us/environments/test-env-id/portals/home/?tab=active');
            });
        });

        describe('when service endpoint category is GCC', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.GCC, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open active sites in studio', async () => {
                await openActiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.gov.powerpages.microsoft.us/environments/test-env-id/portals/home/?tab=active');
            });
        });

        describe('when service endpoint category is HIGH', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.HIGH, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open active sites in studio', async () => {
                await openActiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.high.powerpages.microsoft.us/environments/test-env-id/portals/home/?tab=active');
            });
        });

        describe('when service endpoint category is MOONCAKE', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.MOONCAKE, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open active sites in studio', async () => {
                await openActiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.powerpages.microsoft.cn/environments/test-env-id/portals/home/?tab=active');
            });
        });
    });

    describe('openInactiveSitesInStudio', () => {
        let mockUrl: sinon.SinonSpy;

        beforeEach(() => {
            PacContext["_authInfo"] = mockAuthInfo;
            mockUrl = sandbox.spy(vscode.Uri, 'parse');
            sandbox.stub(vscode.env, 'openExternal');
        });

        describe('when service endpoint category is TEST', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open inactive sites in studio', async () => {
                await openInactiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.test.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=inactive');
            });
        });

        describe('when service endpoint category is PREPROD', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.PREPROD, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open inactive sites in studio', async () => {
                await openInactiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.preprod.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=inactive');
            });
        });

        describe('when service endpoint category is PROD', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.PROD, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open inactive sites in studio', async () => {
                await openInactiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=inactive');
            });
        });

        describe('when service endpoint category is DOD', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.DOD, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open inactive sites in studio', async () => {
                await openInactiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.powerpages.microsoft.appsplatform.us/environments/test-env-id/portals/home/?tab=inactive');
            });
        });

        describe('when service endpoint category is GCC', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.GCC, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open inactive sites in studio', async () => {
                await openInactiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.gov.powerpages.microsoft.us/environments/test-env-id/portals/home/?tab=inactive');
            });
        });

        describe('when service endpoint category is HIGH', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.HIGH, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open inactive sites in studio', async () => {
                await openInactiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.high.powerpages.microsoft.us/environments/test-env-id/portals/home/?tab=inactive');
            });
        });

        describe('when service endpoint category is MOONCAKE', () => {
            beforeEach(() => {
                ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.MOONCAKE, response: {} as IArtemisAPIOrgResponse };
            });

            it('should open inactive sites in studio', async () => {
                await openInactiveSitesInStudio();

                expect(mockUrl.calledOnce).to.be.true;
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.powerpages.microsoft.cn/environments/test-env-id/portals/home/?tab=inactive');
            });
        });
    });

    describe('createNewAuthProfile', () => {
        let mockPacWrapper: sinon.SinonStubbedInstance<PacWrapper>;
        let mockCreateAuthProfileExp: sinon.SinonStub;
        let mockDataverseAuthentication: sinon.SinonStub;

        beforeEach(() => {
            mockPacWrapper = sandbox.createStubInstance(PacWrapper);
            mockCreateAuthProfileExp = sandbox.stub(PacAuthUtil, 'createAuthProfileExp');
            mockDataverseAuthentication = sandbox.stub(authProvider, 'dataverseAuthentication');
        });

        it('should handle missing organization URL', async () => {
            const mockResults = [{ ActiveOrganization: [null, null] }];
            mockCreateAuthProfileExp.resolves({ Status: 'Success', Results: mockResults });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockDataverseAuthentication.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('createNewAuthProfile');
        });

        it('should handle empty results array', async () => {
            mockCreateAuthProfileExp.resolves({ Status: 'Success', Results: [] });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockDataverseAuthentication.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('createNewAuthProfile');
        });

        it('should handle PAC auth output failure', async () => {
            mockCreateAuthProfileExp.resolves({ Status: 'Failed', Results: null });

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockDataverseAuthentication.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('createNewAuthProfile');
        });

        it('should handle errors during auth profile creation', async () => {
            const error = new Error('Test error');
            mockCreateAuthProfileExp.rejects(error);

            await createNewAuthProfile(mockPacWrapper);

            expect(mockCreateAuthProfileExp.calledOnce).to.be.true;
            expect(mockDataverseAuthentication.called).to.be.false;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal('createNewAuthProfile');
        });
    });

    describe('previewSite', () => {
        let mockPreviewSiteClearCache: sinon.SinonStub;
        let mockLaunchBrowserAndDevTools: sinon.SinonStub;
        let mockSiteInfo: IWebsiteInfo;

        beforeEach(() => {
            mockPreviewSiteClearCache = sandbox.stub(PreviewSite, 'clearCache');
            mockLaunchBrowserAndDevTools = sandbox.stub(PreviewSite, 'launchBrowserAndDevToolsWithinVsCode');
            mockSiteInfo = {
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: 'Public',
                siteManagementUrl: 'https://test-site-management.com',
            };
        });

        it('should clear cache and launch browser with dev tools', async () => {
            const siteTreeItem = new SiteTreeItem(mockSiteInfo);

            await previewSite(siteTreeItem);

            expect(mockPreviewSiteClearCache.calledOnceWith('https://test-site.com')).to.be.true;
            expect(mockLaunchBrowserAndDevTools.calledOnceWith('https://test-site.com', 1)).to.be.true;
        });
    });

    describe('fetchWebsites', () => {
        let mockGetActiveWebsites: sinon.SinonStub;
        let mockGetAllWebsites: sinon.SinonStub;

        beforeEach(() => {
            ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: artemisResponse };
            mockGetActiveWebsites = sandbox.stub(WebsiteUtils, 'getActiveWebsites');
            mockGetAllWebsites = sandbox.stub(WebsiteUtils, 'getAllWebsites');
            sinon.stub(PacContext, "OrgInfo").get(() => ({ OrgId: 'test-org-id', EnvironmentId: 'test-env-id' }));
        });

        it('should not call getActiveWebsites and getAllWebsites', async () => {
            sinon.stub(PacContext, "OrgInfo").get(() => undefined);

            await fetchWebsites();

            expect(mockGetActiveWebsites.called).to.be.false;
            expect(mockGetAllWebsites.called).to.be.false;
        });

        it('should return empty response when orgInfo is null', async () => {
            sinon.stub(PacContext, "OrgInfo").get(() => undefined);

            const response = await fetchWebsites();

            expect(response.activeSites).to.be.empty;
            expect(response.inactiveSites).to.be.empty;
        });

        it('should log the error when there is problem is fetching websites', async () => {
            const activeSites = [
                {
                    name: 'Active Site 1',
                    websiteRecordId: 'active-site-1',
                    dataModel: WebsiteDataModel.Enhanced,
                    websiteUrl: 'https://active-site-1.com',
                    id: 'active-site-1',
                }
            ] as IWebsiteDetails[];

            mockGetActiveWebsites.resolves(activeSites);
            mockGetAllWebsites.rejects(new Error('Test error'));

            const response = await fetchWebsites();

            expect(response.activeSites).to.be.empty;
            expect(response.inactiveSites).to.be.empty;

            expect(traceErrorStub.calledOnce).to.be.true;
        });

        it('should return active and inactive websites', async () => {
            const activeSites = [
                {
                    name: 'Active Site 1',
                    websiteRecordId: 'active-site-1',
                    dataModel: WebsiteDataModel.Enhanced,
                    websiteUrl: 'https://active-site-1.com',
                    id: 'active-site-1',
                    siteVisibility: "public"
                }
            ] as IWebsiteDetails[];
            const inactiveSites = [
                {
                    name: 'Inactive Site 1',
                    websiteRecordId: 'inactive-site-1',
                    dataModel: WebsiteDataModel.Enhanced,
                    websiteUrl: 'https://inactive-site-1.com',
                    id: 'inactive-site-1',
                    siteVisibility: 'private',
                    siteManagementUrl: "https://inactive-site-1-management.com"
                }
            ] as IWebsiteDetails[];

            const allSites = [
                ...activeSites.map(site => ({ ...site, siteManagementUrl: "https://portalmanagement.com" })),
                ...inactiveSites

            ] as IWebsiteDetails[];
            mockGetActiveWebsites.resolves(activeSites);
            mockGetAllWebsites.resolves(allSites);

            const response = await fetchWebsites();

            expect(response.activeSites).to.deep.equal([...activeSites.map(site => ({ ...site, siteManagementUrl: "https://portalmanagement.com" }))]);
            expect(response.inactiveSites).to.deep.equal(inactiveSites);
        });
    });

    describe('revealInOS', () => {
        let executeCommandStub: sinon.SinonStub;

        beforeEach(() => {
            executeCommandStub = sinon.stub(vscode.commands, 'executeCommand');
        });

        afterEach(() => {
            executeCommandStub.restore();
        });

        it('should not reveal file in OS when file path is not provided', async () => {
            sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => undefined);
            await revealInOS();

            expect(executeCommandStub.called).to.be.false;
        });

        it('should reveal file in OS when file path is provided', async () => {
            const mockPath = 'test-path';
            sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => mockPath);
            await revealInOS(); expect(executeCommandStub.calledOnceWith('revealFileInOS', vscode.Uri.file(mockPath))).to.be.true;
        });
    });

    describe('openSiteManagement', () => {
        let mockUrl: sinon.SinonSpy;

        beforeEach(() => {
            mockUrl = sandbox.spy(vscode.Uri, 'parse');
            sandbox.stub(vscode.env, 'openExternal');
        });

        it('should open site management URL when available', async () => {
            await openSiteManagement({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1,
                    status: WebsiteStatus.Active,
                    websiteUrl: 'https://test-site.com',
                    isCurrent: false,
                    siteVisibility: Constants.SiteVisibility.PRIVATE,
                    siteManagementUrl: "https://test-site-management.com"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.calledOnce).to.be.true;
            expect(mockUrl.firstCall.args[0]).to.equal('https://test-site-management.com');
        });

        it('should show error message when site management URL is not available', async () => {
            const mockErrorMessage = sandbox.stub(vscode.window, 'showErrorMessage');

            await openSiteManagement({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1,
                    status: WebsiteStatus.Active,
                    websiteUrl: 'https://test-site.com',
                    isCurrent: false,
                    siteVisibility: Constants.SiteVisibility.PRIVATE
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockErrorMessage.calledOnce).to.be.true;
            expect(mockErrorMessage.firstCall.args[0]).to.equal(Constants.Strings.SITE_MANAGEMENT_URL_NOT_FOUND);
        });

        it('should show log error when site management URL is not available', async () => {
            sandbox.stub(vscode.window, 'showErrorMessage');

            await openSiteManagement({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1,
                    status: WebsiteStatus.Active,
                    websiteUrl: 'https://test-site.com',
                    isCurrent: false,
                    siteVisibility: Constants.SiteVisibility.PRIVATE
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND);
            expect(traceErrorStub.firstCall.args[1]).to.equal(Constants.EventNames.SITE_MANAGEMENT_URL_NOT_FOUND);
            expect(traceErrorStub.firstCall.args[3]).to.deep.equal({ method: openSiteManagement.name });
        });
    });


    describe('uploadSite', () => {
        let mockSendText: sinon.SinonStub;
        let mockSiteTreeItem: SiteTreeItem;

        beforeEach(() => {
            mockSendText = sinon.stub();

            // Set up CurrentSiteContext
            sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => "test-path");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sinon.stub(PacTerminal, 'getTerminal').returns({ sendText: mockSendText } as any);
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should show confirmation dialog and upload when user confirms for public site', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: Constants.SiteVisibility.PUBLIC,
                siteManagementUrl: "https://inactive-site-1-management.com"
            });
            mockShowInformationMessage.resolves(Constants.Strings.YES);

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockShowInformationMessage.firstCall.args[0]).to.equal(Constants.Strings.SITE_UPLOAD_CONFIRMATION);

            expect(mockSendText.calledOnceWith(`pac pages upload --path "test-path" --modelVersion "1"`)).to.be.true;
        });

        it('should not upload when user cancels confirmation for public site', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: Constants.SiteVisibility.PUBLIC,
                siteManagementUrl: "https://inactive-site-1-management.com"
            });
            mockShowInformationMessage.resolves(undefined);

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockSendText.called).to.be.false;
        });

        it('should upload without confirmation for private site', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: Constants.SiteVisibility.PRIVATE,
                siteManagementUrl: "https://inactive-site-1-management.com"
            });

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.called).to.be.false;
            expect(mockSendText.calledOnceWith(`pac pages upload --path "test-path" --modelVersion "1"`)).to.be.true;
        });

        it('should handle case sensitivity for public site visibility', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: "PUBLIC", // Uppercase
                siteManagementUrl: "https://inactive-site-1-management.com"
            });
            mockShowInformationMessage.resolves(Constants.Strings.YES);

            await uploadSite(mockSiteTreeItem, "");

            expect(mockShowInformationMessage.calledOnce).to.be.true;
            expect(mockSendText.calledOnceWith(`pac pages upload --path "test-path" --modelVersion "1"`)).to.be.true;
        });

        it('should handle errors during upload', async () => {
            mockSiteTreeItem = new SiteTreeItem({
                name: "Test Site",
                websiteId: "test-id",
                dataModelVersion: 1,
                status: WebsiteStatus.Active,
                websiteUrl: 'https://test-site.com',
                isCurrent: false,
                siteVisibility: Constants.SiteVisibility.PRIVATE,
                siteManagementUrl: "https://inactive-site-1-management.com"
            });

            mockSendText.throws(new Error('Upload failed'));

            await uploadSite(mockSiteTreeItem, "");

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_UPLOAD_SITE_FAILED);
        });
    });

    describe('findOtherSites', () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mockFs: any;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let mockYaml: any;
        let mockWorkspaceFolders: sinon.SinonStub;
        let mockGetWebsiteRecordId: sinon.SinonStub;

        beforeEach(() => {
            // Create mock fs module with stubbed methods
            mockFs = {
                readdirSync: sandbox.stub(),
                existsSync: sandbox.stub(),
                readFileSync: sandbox.stub()
            };

            // Create mock yaml module with stubbed methods
            mockYaml = {
                load: sandbox.stub()
            };

            // Stub workspace folders
            mockWorkspaceFolders = sandbox.stub(vscode.workspace, 'workspaceFolders').get(() => [{
                uri: { fsPath: '/test/current/workspace' },
                name: 'workspace',
                index: 0
            }]);

            // Stub the getWebsiteRecordId function
            mockGetWebsiteRecordId = sandbox.stub(WorkspaceInfoFinderUtil, 'getWebsiteRecordId');
        });

        afterEach(() => {
            sandbox.restore();
        });

        it('should return empty array when no workspace folders exist', () => {
            mockWorkspaceFolders.get(() => undefined);

            const result = findOtherSites(new Set(), mockFs, mockYaml);

            expect(result).to.be.an('array').that.is.empty;
        });

        it('should handle filesystem errors', () => {
            const knownSiteIds = new Set<string>();

            mockFs.readdirSync.throws(new Error('Filesystem error'));

            const result = findOtherSites(knownSiteIds, mockFs, mockYaml);

            expect(result).to.be.an('array').that.is.empty;
            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.OTHER_SITES_FILESYSTEM_ERROR);
        });

        it('should skip sites with missing website id', () => {
            const knownSiteIds = new Set<string>();

            mockFs.readdirSync.returns([
                { name: 'missing-id-site', isDirectory: () => true }
            ]);

            mockFs.existsSync.returns(true);
            mockFs.readFileSync.returns('yaml content');
            mockYaml.load.returns({
                adx_name: 'Site With Missing ID'
                // No adx_websiteid
            });

            // Setup the stub for getWebsiteRecordId to return null
            mockGetWebsiteRecordId.withArgs('/test/current/workspace/missing-id-site').returns(null);

            const result = findOtherSites(knownSiteIds, mockFs, mockYaml);

            expect(result).to.be.an('array').that.is.empty;
        });
    });

    describe('createKnownSiteIdsSet', () => {
        it('should create a set with active and inactive site IDs', () => {
            const activeSites = [
                { websiteRecordId: 'active-1', name: 'Active Site 1' },
                { websiteRecordId: 'active-2', name: 'Active Site 2' }
            ] as IWebsiteDetails[];

            const inactiveSites = [
                { websiteRecordId: 'inactive-1', name: 'Inactive Site 1' },
                { websiteRecordId: 'inactive-2', name: 'Inactive Site 2' }
            ] as IWebsiteDetails[];

            const result = createKnownSiteIdsSet(activeSites, inactiveSites);

            expect(result.size).to.equal(4);
            expect(result.has('active-1')).to.be.true;
            expect(result.has('active-2')).to.be.true;
            expect(result.has('inactive-1')).to.be.true;
            expect(result.has('inactive-2')).to.be.true;
        });

        it('should handle case sensitivity by converting to lowercase', () => {
            const activeSites = [
                { websiteRecordId: 'ACTIVE-1', name: 'Active Site 1' }
            ] as IWebsiteDetails[];

            const result = createKnownSiteIdsSet(activeSites, undefined);

            expect(result.size).to.equal(1);
            expect(result.has('active-1')).to.be.true;
        });

        it('should handle undefined inputs', () => {
            const result = createKnownSiteIdsSet(undefined, undefined);
            expect(result.size).to.equal(0);
        });

        it('should skip sites with missing websiteRecordId', () => {
            const activeSites = [
                { websiteRecordId: 'active-1', name: 'Active Site 1' },
                { name: 'Site Without ID' } as IWebsiteDetails
            ] as IWebsiteDetails[];

            const result = createKnownSiteIdsSet(activeSites, undefined);

            expect(result.size).to.equal(1);
            expect(result.has('active-1')).to.be.true;
        });
    });

    describe('showSiteDetails', () => {
        it('should show information notification', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockShowInformationMessage.calledOnce).to.be.true;
        });

        it('should have expected heading', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1
                } as IWebsiteInfo
            } as SiteTreeItem);

            const message = mockShowInformationMessage.firstCall.args[0];
            expect(message).to.include("Site Details");
        });

        it('should be rendered as modal', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1
                } as IWebsiteInfo
            } as SiteTreeItem);

            const message = mockShowInformationMessage.firstCall.args[1];
            expect(message.modal).to.be.true;
        });

        it('should show site details', async () => {
            mockShowInformationMessage.resolves(Constants.Strings.COPY_TO_CLIPBOARD);

            await showSiteDetails({
                siteInfo: {
                    name: "Test Site",
                    websiteId: "test-id",
                    dataModelVersion: 1
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockShowInformationMessage.calledOnce).to.be.true;

            const message = mockShowInformationMessage.firstCall.args[1].detail;
            expect(message).to.include("Friendly name: Test Site");
            expect(message).to.include("Website ID: test-id");
            expect(message).to.include("Data model version: v1");
        });
    });

    describe('downloadSite', () => {
        let dirnameSpy: sinon.SinonSpy;
        let mockSendText: sinon.SinonStub;

        beforeEach(() => {
            mockSendText = sinon.stub();
            dirnameSpy = sinon.spy(path, 'dirname');
            sinon.stub(PacTerminal, 'getTerminal').returns({ sendText: mockSendText } as unknown as vscode.Terminal);
        });

        afterEach(() => {
            sinon.restore();
        });

        describe('when the site is current', () => {
            it('should download without asking for download path', async () => {
                sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => "D:/foo/bar");
                const mockSiteTreeItem = new SiteTreeItem({
                    isCurrent: true,
                    websiteId: 'test-id',
                    dataModelVersion: 2
                } as IWebsiteInfo);

                await downloadSite(mockSiteTreeItem);

                expect(dirnameSpy.calledOnce).to.be.true;
                expect(mockSendText.calledOnce).to.be.true;
                expect(mockSendText.firstCall.args[0]).to.equal('pac pages download --overwrite --path "D:/foo" --webSiteId test-id --modelVersion "2"');
            });
        });

        describe('when the site is not current', () => {
            describe('and there is no current site context', () => {
                beforeEach(() => {
                    sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => undefined);
                });

                it('should only show 1 option in download path quick pick', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');

                    await downloadSite(mockSiteTreeItem);

                    expect(mockQuickPick.calledOnce).to.be.true;
                    const options = mockQuickPick.firstCall.args[0] as { label: string, iconPath: vscode.ThemeIcon }[];
                    expect(options.length).to.equal(1);
                    expect(options[0].label).to.equal("Browse...");
                    expect(mockQuickPick.firstCall.args[1]).to.deep.equal({
                        canPickMany: false,
                        placeHolder: Constants.Strings.SELECT_DOWNLOAD_FOLDER
                    });
                });
            });

            describe('but there is a current site context', () => {
                beforeEach(() => {
                    sinon.stub(CurrentSiteContext, 'currentSiteFolderPath').get(() => "D:/foo/bar");
                });

                it('should show 2 options in download path quick pick', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');

                    await downloadSite(mockSiteTreeItem);

                    expect(mockQuickPick.calledOnce).to.be.true;
                    const options = mockQuickPick.firstCall.args[0] as vscode.QuickPickItem[];
                    expect(options.length).to.equal(2);
                    expect(options[0].label).to.equal("Browse...");
                    expect(options[1].label).to.equal("D:/foo");
                    expect(mockQuickPick.firstCall.args[1]).to.deep.equal({
                        canPickMany: false,
                        placeHolder: Constants.Strings.SELECT_DOWNLOAD_FOLDER
                    });
                });

                it('should download when a path is selected', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "D:/foo" });

                    await downloadSite(mockSiteTreeItem);

                    expect(mockSendText.calledOnce).to.be.true;
                    expect(mockSendText.firstCall.args[0]).to.equal('pac pages download --overwrite --path "D:/foo" --webSiteId test-id --modelVersion "2"');
                });

                it('should show file open dialog when "Browse..." is selected', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "Browse..." });

                    const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
                    mockShowOpenDialog.resolves([{ fsPath: "D:/foo" } as unknown as vscode.Uri]);

                    await downloadSite(mockSiteTreeItem);

                    expect(mockShowOpenDialog.calledOnce).to.be.true;
                    expect(mockShowOpenDialog.firstCall.args[0]).to.deep.equal({
                        canSelectFolders: true,
                        canSelectFiles: false,
                        openLabel: Constants.Strings.SELECT_FOLDER,
                        title: Constants.Strings.SELECT_DOWNLOAD_FOLDER
                    });
                });

                it('should download the site when a path is selected in the file open dialog', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "Browse..." });

                    const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
                    mockShowOpenDialog.resolves([{ fsPath: "D:/foo" } as unknown as vscode.Uri]);

                    await downloadSite(mockSiteTreeItem);

                    expect(mockSendText.calledOnce).to.be.true;
                    expect(mockSendText.firstCall.args[0]).to.equal('pac pages download --overwrite --path "D:/foo" --webSiteId test-id --modelVersion "2"');
                });

                it('should not download the site when no path is selected in the file open dialog', async () => {
                    const mockSiteTreeItem = new SiteTreeItem({
                        isCurrent: false,
                        websiteId: 'test-id',
                        dataModelVersion: 2
                    } as IWebsiteInfo);

                    const mockQuickPick = sinon.stub(vscode.window, 'showQuickPick');
                    mockQuickPick.resolves({ label: "Browse..." });

                    const mockShowOpenDialog = sinon.stub(vscode.window, 'showOpenDialog');
                    mockShowOpenDialog.resolves([]);

                    await downloadSite(mockSiteTreeItem);

                    expect(mockSendText.called).to.be.false;
                });
            });
        });
    });

    describe('openInStudio', () => {
        let mockUrl: sinon.SinonSpy;
        let mockOpenUrl: sinon.SinonStub;

        beforeEach(() => {
            mockUrl = sandbox.spy(vscode.Uri, 'parse');
            mockOpenUrl = sandbox.stub(vscode.env, 'openExternal');
            sandbox.stub(PacContext, 'AuthInfo').get(() => mockAuthInfo);
            sandbox.stub(ArtemisContext, 'ServiceResponse').get(() => ({ stamp: ServiceEndpointCategory.TEST }));
        });

        it('should open in studio', async () => {
            await openInStudio({
                siteInfo: {
                    websiteId: "test-id"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.calledOnce).to.be.true;
            expect(mockUrl.firstCall.args[0]).to.equal('https://make.test.powerpages.microsoft.com/e/test-env-id/sites/test-id/pages');

            expect(mockOpenUrl.calledOnce).to.be.true;
            expect(mockOpenUrl.firstCall.args[0].toString()).to.equal('https://make.test.powerpages.microsoft.com/e/test-env-id/sites/test-id/pages');
        });

        it('should not open when website id is missing', async () => {
            await openInStudio({
                siteInfo: {
                    websiteId: ""
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.called).to.be.false;
            expect(mockOpenUrl.called).to.be.false;
        });

        it('should not open when environment id is missing', async () => {
            sandbox.stub(PacContext, 'AuthInfo').get(() => ({ ...mockAuthInfo, EnvironmentId: undefined }));

            await openInStudio({
                siteInfo: {
                    websiteId: "test-id"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.called).to.be.false;
            expect(mockOpenUrl.called).to.be.false;
        });

        it('should not open when Artemis stamp id is missing', async () => {
            sandbox.stub(ArtemisContext, 'ServiceResponse').get(() => ({ stamp: 'foo' }));

            await openInStudio({
                siteInfo: {
                    websiteId: "test-id"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.called).to.be.false;
            expect(mockOpenUrl.called).to.be.false;
        });
    });
});
