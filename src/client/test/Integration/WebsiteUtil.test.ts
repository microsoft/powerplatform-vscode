/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import { ServiceEndpointCategory, WebsiteDataModel } from '../../../common/services/Constants';
import { IWebsiteDetails } from '../../../common/services/Interfaces';
import { PPAPIService } from '../../../common/services/PPAPIService';
import { getActiveWebsites } from '../../../common/utilities/WebsiteUtil';

describe('WebsiteUtil', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getActiveWebsites', () => {
        it('should call PPAPIService.getAllWebsiteDetails with correct parameters', async () => {
            // Arrange
            const serviceEndpointStamp = ServiceEndpointCategory.PROD;
            const environmentId = 'test-environment-id';
            const mockWebsites: IWebsiteDetails[] = [];

            const getAllWebsiteDetailsStub = sandbox.stub(PPAPIService, 'getAllWebsiteDetails').resolves(mockWebsites);

            // Act
            const result = await getActiveWebsites(serviceEndpointStamp, environmentId);

            // Assert
            expect(getAllWebsiteDetailsStub.calledOnceWithExactly(serviceEndpointStamp, environmentId)).to.be.true;
            expect(result).to.equal(mockWebsites);
        });

        it('should return website details returned by PPAPIService', async () => {
            // Arrange
            const serviceEndpointStamp = ServiceEndpointCategory.TEST;
            const environmentId = 'test-environment-id';
            const mockWebsites: IWebsiteDetails[] = [
                {
                    name: 'Test Website 1',
                    websiteUrl: 'https://test1.powerapps.com',
                    dataverseInstanceUrl: 'https://test.crm.dynamics.com',
                    dataverseOrganizationId: 'org-id-1',
                    dataModel: WebsiteDataModel.Standard,
                    environmentId: 'env-id-1',
                    websiteRecordId: 'record-id-1',
                    siteManagementUrl: 'https://management.url/1',
                    siteVisibility: undefined,
                    creator: 'Test User',
                    createdOn: '2025-03-01T12:00:00Z'
                },
                {
                    name: 'Test Website 2',
                    websiteUrl: 'https://test2.powerapps.com',
                    dataverseInstanceUrl: 'https://test.crm.dynamics.com',
                    dataverseOrganizationId: 'org-id-1',
                    dataModel: WebsiteDataModel.Enhanced,
                    environmentId: 'env-id-1',
                    websiteRecordId: 'record-id-2',
                    siteManagementUrl: 'https://management.url/2',
                    siteVisibility: undefined,
                    creator: 'Another User',
                    createdOn: '2025-03-15T12:00:00Z'
                }
            ];

            sandbox.stub(PPAPIService, 'getAllWebsiteDetails').resolves(mockWebsites);

            // Act
            const result = await getActiveWebsites(serviceEndpointStamp, environmentId);

            // Assert
            expect(result).to.deep.equal(mockWebsites);
            expect(result.length).to.equal(2);
            expect(result[0].name).to.equal('Test Website 1');
            expect(result[1].name).to.equal('Test Website 2');
        });

        it('should handle empty array returned by PPAPIService', async () => {
            // Arrange
            const serviceEndpointStamp = ServiceEndpointCategory.PREPROD;
            const environmentId = 'test-environment-id';
            const mockWebsites: IWebsiteDetails[] = [];

            sandbox.stub(PPAPIService, 'getAllWebsiteDetails').resolves(mockWebsites);

            // Act
            const result = await getActiveWebsites(serviceEndpointStamp, environmentId);

            // Assert
            expect(result).to.be.an('array').that.is.empty;
        });

        it('should pass through any errors thrown by PPAPIService', async () => {
            // Arrange
            const serviceEndpointStamp = ServiceEndpointCategory.MOONCAKE;
            const environmentId = 'test-environment-id';
            const testError = new Error('Test service error');

            sandbox.stub(PPAPIService, 'getAllWebsiteDetails').rejects(testError);

            // Act & Assert
            try {
                await getActiveWebsites(serviceEndpointStamp, environmentId);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).to.equal(testError);
            }
        });
    });
});
