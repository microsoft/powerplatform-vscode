/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { openActiveSitesInStudio, openInactiveSitesInStudio, openSiteInStudio } from '../../../../../power-pages/actions-hub/handlers/OpenSiteInStudioHandler';
import { AuthInfo, CloudInstance, EnvironmentType } from '../../../../../pac/PacTypes';
import PacContext from '../../../../../pac/PacContext';
import ArtemisContext from '../../../../../ArtemisContext';
import { ServiceEndpointCategory } from '../../../../../../common/services/Constants';
import { IArtemisAPIOrgResponse } from '../../../../../../common/services/Interfaces';
import { SiteTreeItem } from '../../../../../power-pages/actions-hub/tree-items/SiteTreeItem';
import { IWebsiteInfo } from '../../../../../power-pages/actions-hub/models/IWebsiteInfo';
import * as TelemetryHelper from '../../../../../power-pages/actions-hub/TelemetryHelper';

describe('OpenSiteInStudioHandler', () => {
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
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.test.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=active');
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
                expect(mockUrl.firstCall.args[0]).to.equal('https://make.test.powerpages.microsoft.com/environments/test-env-id/portals/home/?tab=inactive');
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
            await openSiteInStudio({
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
            await openSiteInStudio({
                siteInfo: {
                    websiteId: ""
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.called).to.be.false;
            expect(mockOpenUrl.called).to.be.false;
        });

        it('should not open when environment id is missing', async () => {
            sandbox.stub(PacContext, 'AuthInfo').get(() => ({ ...mockAuthInfo, EnvironmentId: undefined }));

            await openSiteInStudio({
                siteInfo: {
                    websiteId: "test-id"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.called).to.be.false;
            expect(mockOpenUrl.called).to.be.false;
        });

        it('should not open when Artemis stamp id is missing', async () => {
            sandbox.stub(ArtemisContext, 'ServiceResponse').get(() => ({ stamp: 'foo' }));

            await openSiteInStudio({
                siteInfo: {
                    websiteId: "test-id"
                } as IWebsiteInfo
            } as SiteTreeItem);

            expect(mockUrl.called).to.be.false;
            expect(mockOpenUrl.called).to.be.false;
        });
    });
});
