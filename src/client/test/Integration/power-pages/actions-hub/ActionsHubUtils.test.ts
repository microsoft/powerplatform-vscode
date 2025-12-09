/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { fetchWebsites, findOtherSites, createKnownSiteIdsSet } from '../../../../power-pages/actions-hub/ActionsHubUtils';
import { Constants } from '../../../../power-pages/actions-hub/Constants';
import { WebsiteDataModel, ServiceEndpointCategory } from '../../../../../common/services/Constants';
import { IWebsiteDetails, IArtemisAPIOrgResponse } from '../../../../../common/services/Interfaces';
import PacContext from '../../../../pac/PacContext';
import ArtemisContext from '../../../../ArtemisContext';
import * as WebsiteUtils from '../../../../../common/utilities/WebsiteUtil';
import * as WorkspaceInfoFinderUtil from '../../../../../common/utilities/WorkspaceInfoFinderUtil';
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
            expect(traceErrorStub.firstCall.args[0]).to.equal(Constants.EventNames.ACTIONS_HUB_FIND_OTHER_SITES_FAILED);
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
});
