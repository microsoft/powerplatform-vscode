/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { fetchWebsites } from '../../../../power-pages/actions-hub/ActionsHubUtils';
import { WebsiteDataModel, ServiceEndpointCategory } from '../../../../../common/services/Constants';
import { IWebsiteDetails, IArtemisAPIOrgResponse } from '../../../../../common/services/Interfaces';
import PacContext from '../../../../pac/PacContext';
import ArtemisContext from '../../../../ArtemisContext';
import * as WebsiteUtils from '../../../../../common/utilities/WebsiteUtil';
import * as TelemetryHelper from '../../../../power-pages/actions-hub/TelemetryHelper';

describe('ActionsHubUtils', () => {
    let sandbox: sinon.SinonSandbox;
    let traceErrorStub: sinon.SinonStub;

    const artemisResponse = {
        environment: 'cluster-env',
        clusterCategory: 'cluster-category',
        geoName: 'geo-name'
    } as IArtemisAPIOrgResponse;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        sandbox.stub(vscode.window, 'showInformationMessage');
        ArtemisContext["_artemisResponse"] = { stamp: ServiceEndpointCategory.TEST, response: artemisResponse };
        traceErrorStub = sandbox.stub(TelemetryHelper, 'traceError');
        sandbox.stub(TelemetryHelper, "getBaseEventInfo").returns({ foo: 'bar' });
        sandbox.stub(TelemetryHelper, "traceInfo");
        sandbox.stub(vscode.env, 'sessionId').get(() => 'test-session-id');
    });

    afterEach(() => {
        sandbox.restore();
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
                    siteVisibility: "public",
                    isCodeSite: false
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
                    siteManagementUrl: "https://inactive-site-1-management.com",
                    isCodeSite: false
                }
            ] as IWebsiteDetails[];

            const allSites = [
                ...activeSites.map(site => ({ ...site, siteManagementUrl: "https://portalmanagement.com", createdOn: "2025-03-20", creator: "Test Creator" })),
                ...inactiveSites

            ] as IWebsiteDetails[];
            mockGetActiveWebsites.resolves(activeSites);
            mockGetAllWebsites.resolves(allSites);

            const response = await fetchWebsites();

            expect(response.activeSites).to.deep.equal([...activeSites.map(site => ({ ...site, isCodeSite: false, siteManagementUrl: "https://portalmanagement.com", createdOn: "2025-03-20", creator: "Test Creator" }))]);
            expect(response.inactiveSites).to.deep.equal(inactiveSites);
        });
    });
});
