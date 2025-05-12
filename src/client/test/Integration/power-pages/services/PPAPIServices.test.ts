/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import sinon from 'sinon';
import { expect } from 'chai';
import { PPAPIService } from '../../../../../common/services/PPAPIService';
import * as AuthenticationProvider from '../../../../../common/services/AuthenticationProvider';
import { ServiceEndpointCategory, WebsiteDataModel } from '../../../../../common/services/Constants';
import { IWebsiteDetails } from '../../../../../common/services/Interfaces';
import * as copilotTelemetry from '../../../../../common/copilot/telemetry/copilotTelemetry';

describe('PPAPIService', () => {
    let powerPlatformAPIAuthenticationStub: sinon.SinonStub;
    let fetchStub: sinon.SinonStub;
    let sendTelemetryEventStub: sinon.SinonStub;

    const mockAccessToken = 'mock-access-token';
    const mockEnvironmentId = 'mock-environment-id';
    const mockWebsitePreviewId = 'mock-website-preview-id';
    const mockWebsiteRecordId = 'mock-website-record-id';
      const mockWebsiteDetails: IWebsiteDetails = {
        id: 'mock-id',
        name: 'mock-name',
        websiteUrl: 'https://mock-website-url',
        websiteRecordId: mockWebsiteRecordId,
        dataverseInstanceUrl: 'https://mock-org.crm.dynamics.com',
        dataverseOrganizationId: 'mock-org-id',
        dataModel: WebsiteDataModel.Standard,
        environmentId: mockEnvironmentId,
        siteManagementUrl: 'https://mock-management-url',
        creator: 'Mock User',
        createdOn: '2025-01-01T00:00:00Z',
        siteVisibility: undefined,
        isCodeSite: false
    };

    const mockWebsiteDetailsArray: IWebsiteDetails[] = [mockWebsiteDetails];

    beforeEach(() => {
        // Create stubs for authentication, fetch and telemetry
        powerPlatformAPIAuthenticationStub = sinon.stub(AuthenticationProvider, 'powerPlatformAPIAuthentication').resolves(mockAccessToken);

        // Create a stub for global fetch
        fetchStub = sinon.stub(global, 'fetch');

        // Create a stub for telemetry
        sendTelemetryEventStub = sinon.stub(copilotTelemetry, 'sendTelemetryEvent');
    });

    afterEach(() => {
        // Restore all stubs
        sinon.restore();
    });

    describe('getWebsiteDetailsById', () => {
        it('should return website details when API call is successful', async () => {
            // Setup successful fetch response
            const mockResponse = {
                ok: true,
                json: async () => mockWebsiteDetails
            };
            fetchStub.resolves(mockResponse);

            // Call the function
            const result = await PPAPIService.getWebsiteDetailsById(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                mockWebsitePreviewId
            );

            // Verify results
            expect(result).to.deep.equal(mockWebsiteDetails);
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });

        it('should return null when API call fails', async () => {
            // Setup failed fetch response
            fetchStub.rejects(new Error('API error'));

            // Call the function
            const result = await PPAPIService.getWebsiteDetailsById(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                mockWebsitePreviewId
            );

            // Verify results
            expect(result).to.be.null;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });
    });

    describe('getWebsiteDetailsByWebsiteRecordId', () => {
        it('should return website details when website with matching record ID is found', async () => {
            // Setup mock for getAllWebsiteDetails
            const getAllWebsiteDetailsStub = sinon.stub(PPAPIService, 'getAllWebsiteDetails').resolves(mockWebsiteDetailsArray);

            // Call the function
            const result = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                mockWebsiteRecordId
            );

            // Verify results
            expect(result).to.deep.equal(mockWebsiteDetails);
            expect(getAllWebsiteDetailsStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });

        it('should return null when no matching website record ID is found', async () => {
            // Setup mock for getAllWebsiteDetails
            const getAllWebsiteDetailsStub = sinon.stub(PPAPIService, 'getAllWebsiteDetails').resolves(mockWebsiteDetailsArray);

            // Call the function
            const result = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                'non-existent-record-id'
            );

            // Verify results
            expect(result).to.be.null;
            expect(getAllWebsiteDetailsStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.called).to.be.false;
        });

        it('should return null when service endpoint stamp is undefined', async () => {
            // Call the function with undefined service endpoint
            const result = await PPAPIService.getWebsiteDetailsByWebsiteRecordId(
                undefined,
                mockEnvironmentId,
                mockWebsiteRecordId
            );

            // Verify results
            expect(result).to.be.null;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });
    });

    describe('getAllWebsiteDetails', () => {
        it('should return website details array when API call is successful', async () => {
            // Setup successful fetch response
            const mockResponse = {
                ok: true,
                json: async () => ({ value: mockWebsiteDetailsArray })
            };
            fetchStub.resolves(mockResponse);

            // Call the function
            const result = await PPAPIService.getAllWebsiteDetails(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId
            );

            // Verify results
            expect(result).to.deep.equal(mockWebsiteDetailsArray);
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
        });

        it('should return empty array when API call fails', async () => {
            // Setup failed fetch response
            fetchStub.rejects(new Error('API error'));

            // Call the function
            const result = await PPAPIService.getAllWebsiteDetails(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId
            );

            // Verify results
            expect(result).to.be.an('array').that.is.empty;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });

        it('should throw error when response is not ok', async () => {
            // Setup not ok fetch response
            const mockResponse = {
                ok: false,
                status: 404
            };
            fetchStub.resolves(mockResponse);

            // Call the function
            const result = await PPAPIService.getAllWebsiteDetails(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId
            );

            // Verify results
            expect(result).to.be.an('array').that.is.empty;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });
    });

    describe('getPPAPIServiceEndpoint', () => {
        it('should return correct endpoint for PROD environment', async () => {
            // Call the function
            const endpoint = await PPAPIService.getPPAPIServiceEndpoint(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId
            );

            // Verify result contains the correct base URL
            expect(endpoint).to.include('https://api.powerplatform.com');
            expect(endpoint).to.include(mockEnvironmentId);
        });

        it('should return correct endpoint with website preview ID when provided', async () => {
            // Call the function with website preview ID
            const endpoint = await PPAPIService.getPPAPIServiceEndpoint(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                mockWebsitePreviewId
            );

            // Verify result contains website preview ID
            expect(endpoint).to.include(mockWebsitePreviewId);
        });

        it('should return endpoint for GCC environment', async () => {
            // Call the function
            const endpoint = await PPAPIService.getPPAPIServiceEndpoint(
                ServiceEndpointCategory.GCC,
                mockEnvironmentId
            );

            // Verify result contains the correct base URL for GCC
            expect(endpoint).to.include('https://api.powerplatform.us');
        });

        it('should log telemetry for unsupported region', async () => {
            // Call the function with unsupported category
            await PPAPIService.getPPAPIServiceEndpoint(
                'UNSUPPORTED' as ServiceEndpointCategory,
                mockEnvironmentId
            );

            // Verify telemetry was sent
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });
    });

    describe('getGovernanceFlag', () => {
        it('should return true for allowed governance flag with website ID', async () => {
            // Setup stubs
            const getWebsiteDetailsByWebsiteRecordIdStub = sinon.stub(PPAPIService, 'getWebsiteDetailsByWebsiteRecordId').resolves(mockWebsiteDetails);

            // Setup successful response with 'true'
            const mockResponse = {
                ok: true,
                json: async () => 'true'
            };
            fetchStub.resolves(mockResponse);

            // Call the function
            const result = await PPAPIService.getGovernanceFlag(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                'mock-session-id',
                'mock-governance-setting',
                mockWebsiteRecordId
            );

            // Verify results
            expect(result).to.be.true;
            expect(getWebsiteDetailsByWebsiteRecordIdStub.calledOnce).to.be.true;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });        it('should return true for "all" governance flag response', async () => {
            // Setup stubs
            const getWebsiteDetailsByWebsiteRecordIdStub = sinon.stub(PPAPIService, 'getWebsiteDetailsByWebsiteRecordId').resolves(mockWebsiteDetails);

            // Setup successful response with 'all'
            const mockResponse = {
                ok: true,
                json: async () => 'all'
            };
            fetchStub.resolves(mockResponse);

            // Call the function
            const result = await PPAPIService.getGovernanceFlag(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                'mock-session-id',
                'mock-governance-setting',
                mockWebsiteRecordId
            );

            // Verify results
            expect(result).to.be.true;
            expect(getWebsiteDetailsByWebsiteRecordIdStub.calledOnce).to.be.true;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
        });

        it('should return false for disallowed governance flag', async () => {
            // Setup stubs for environment without website ID

            // Setup successful response with 'false'
            const mockResponse = {
                ok: true,
                json: async () => 'false'
            };
            fetchStub.resolves(mockResponse);

            // Call the function without website ID
            const result = await PPAPIService.getGovernanceFlag(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                'mock-session-id',
                'mock-governance-setting',
                null
            );

            // Verify results
            expect(result).to.be.false;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });

        it('should return false when API call fails', async () => {
            // Setup failed fetch response
            fetchStub.rejects(new Error('API error'));

            // Call the function
            const result = await PPAPIService.getGovernanceFlag(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                'mock-session-id',
                'mock-governance-setting',
                null
            );

            // Verify results
            expect(result).to.be.false;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });

        it('should return false when response is not ok', async () => {
            // Setup not ok fetch response
            const mockResponse = {
                ok: false,
                status: 403
            };
            fetchStub.resolves(mockResponse);

            // Call the function
            const result = await PPAPIService.getGovernanceFlag(
                ServiceEndpointCategory.PROD,
                mockEnvironmentId,
                'mock-session-id',
                'mock-governance-setting',
                null
            );

            // Verify results
            expect(result).to.be.false;
            expect(powerPlatformAPIAuthenticationStub.calledOnce).to.be.true;
            expect(fetchStub.calledOnce).to.be.true;
            expect(sendTelemetryEventStub.calledOnce).to.be.true;
        });
    });
});
