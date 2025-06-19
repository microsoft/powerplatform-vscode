/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as sinon from "sinon";
import { ServiceEndpointCategory, WebsiteDataModel } from "../../../common/services/Constants";
import { IWebsiteDetails } from "../../../common/services/Interfaces";
import { PPAPIService } from "../../../common/services/PPAPIService";
import { getActiveWebsites, getAllWebsites } from "../../../common/utilities/WebsiteUtil";
import { Constants } from "../../../client/power-pages/actions-hub/Constants";
import { OrgInfo } from "../../../client/pac/PacTypes";
import * as AuthenticationProvider from "../../../common/services/AuthenticationProvider";
import { oneDSLoggerWrapper } from "../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper";
import * as Utils from "../../../common/utilities/Utils";

describe("WebsiteUtil", () => {
    let sandbox: sinon.SinonSandbox;
    let fetchStub: sinon.SinonStub;
    let mockLogger = {
        traceError: sinon.stub(),
        traceInfo: sinon.stub(),
        traceWarning: sinon.stub(),
        featureUsage: sinon.stub()
    };

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        fetchStub = sandbox.stub(global, "fetch");
        sandbox.stub(Utils, "getUserAgent").returns("test-user-agent");

        mockLogger = {
            traceError: sandbox.stub(),
            traceInfo: sandbox.stub(),
            traceWarning: sandbox.stub(),
            featureUsage: sandbox.stub()
        };

        sandbox.stub(oneDSLoggerWrapper, "getLogger").returns(mockLogger);
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe("getActiveWebsites", () => {
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
                    createdOn: '2025-03-01T12:00:00Z',
                    languageCode: '1033',
                    isCodeSite: false
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
                    createdOn: '2025-03-15T12:00:00Z',
                    languageCode: '1033',
                    isCodeSite: false
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

    describe("getAllWebsites", () => {
        const mockOrgDetails: OrgInfo = {
            OrgUrl: "https://test.crm.dynamics.com",
            OrgId: "org-id-1",
            EnvironmentId: "env-id-1",
            FriendlyName: "Test Org",
            UniqueName: "test-org",
            UserEmail: "test@example.com",
            UserId: "test-user-id"
        };

        const mockAuthResponse = {
            accessToken: "mock-token",
            userId: "mock-user-id"
        };

        const mockAdxWebsiteRecords = [
            {
                adx_name: "ADX Website 1",
                adx_primarydomainname: "https://adx1.powerapps.com",
                adx_websiteid: "adx-id-1",
                createdon: "2025-03-01T12:00:00Z",
                owninguser: {
                    fullname: "ADX User"
                }
            }
        ];

        const mockPowerPagesSiteRecords = [
            {
                name: "Power Pages Site 1",
                primarydomainname: "https://pp1.powerapps.com",
                powerpagesiteid: "pp-id-1",
                createdon: "2025-03-10T12:00:00Z",
                owninguser: {
                    fullname: "PP User"
                }
            }
        ];

        const mockAppModules = [
            {
                appmoduleid: "portal-app-id",
                uniquename: Constants.AppNames.PORTAL_MANAGEMENT
            },
            {
                appmoduleid: "pp-app-id",
                uniquename: Constants.AppNames.POWER_PAGES_MANAGEMENT
            }
        ];

        const mockPowerPagesSiteSettings = [
            {
                mspp_name: "CodeSite/Enabled",
                mspp_value: "false",
                _mspp_websiteid_value: "pp-id-1",
                statecode: 0,
                statuscode: 1
            }
        ];

        it("should return combined website details from ADX and Power Pages", async () => {
            // Arrange
            // Stub the dataverseAuthentication function directly
            sandbox.stub(AuthenticationProvider, "dataverseAuthentication").resolves(mockAuthResponse);

            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockAdxWebsiteRecords })
            } as Response);

            // Second call - Power Pages site records
            fetchStub.onSecondCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockPowerPagesSiteRecords })
            } as Response);

            // Third call - App modules
            fetchStub.onThirdCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockAppModules })
            } as Response);

            // Fourth call - Power Pages site settings
            fetchStub.onCall(3).resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockPowerPagesSiteSettings })
            } as Response);

            // Act
            const result = await getAllWebsites(mockOrgDetails);

            // Assert
            expect(result).to.be.an("array");
            expect(result.length).to.equal(2); // 1 ADX + 1 Power Pages

            // Verify ADX website details
            const adxWebsite = result.find(w => w.websiteRecordId === "adx-id-1");
            expect(adxWebsite).to.exist;
            expect(adxWebsite?.name).to.equal("ADX Website 1");
            expect(adxWebsite?.dataModel).to.equal(WebsiteDataModel.Standard);
            expect(adxWebsite?.siteManagementUrl).to.include("portal-app-id");
            expect(adxWebsite?.websiteUrl).to.equal("https://adx1.powerapps.com");
            expect(adxWebsite?.isCodeSite).to.be.false;

            // Verify Power Pages website details
            const ppWebsite = result.find(w => w.websiteRecordId === "pp-id-1");
            expect(ppWebsite).to.exist;
            expect(ppWebsite?.name).to.equal("Power Pages Site 1");
            expect(ppWebsite?.dataModel).to.equal(WebsiteDataModel.Enhanced);
            expect(ppWebsite?.siteManagementUrl).to.include("pp-app-id");
            expect(ppWebsite?.isCodeSite).to.be.false;
        });

        it("should handle errors when fetching ADX website records gracefully", async () => {
            // Arrange
            sandbox.stub(AuthenticationProvider, "dataverseAuthentication").resolves(mockAuthResponse);

            fetchStub.reset();

            // First call - ADX website records fails
            fetchStub.onFirstCall().resolves({
                ok: false,
                status: 500
            } as Response);

            // Second call - Power Pages site records succeeds
            fetchStub.onSecondCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockPowerPagesSiteRecords })
            } as Response);

            // Third call - App modules
            fetchStub.onThirdCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockAppModules })
            } as Response);

            // Fourth call - Power Pages site settings
            fetchStub.onCall(3).resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockPowerPagesSiteSettings })
            } as Response);

            // Act
            const result = await getAllWebsites(mockOrgDetails);

            // Assert
            expect(result).to.be.an("array");
            expect(result.length).to.equal(1); // Only Power Pages records should be returned
            expect(result[0].name).to.equal("Power Pages Site 1");
            expect(mockLogger.traceError.calledOnce).to.be.true;
        });

        it("should handle errors when fetching Power Pages site records gracefully", async () => {
            // Arrange
            sandbox.stub(AuthenticationProvider, "dataverseAuthentication").resolves(mockAuthResponse);

            fetchStub.reset();

            // First call - ADX website records succeeds
            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockAdxWebsiteRecords })
            } as Response);

            // Second call - Power Pages site records fails
            fetchStub.onSecondCall().resolves({
                ok: false,
                status: 500
            } as Response);

            // Third call - App modules
            fetchStub.onThirdCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockAppModules })
            } as Response);

            // Fourth call - Power Pages site settings
            fetchStub.onCall(3).resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockPowerPagesSiteSettings })
            } as Response);

            // Act
            const result = await getAllWebsites(mockOrgDetails);

            // Assert
            expect(result).to.be.an("array");
            expect(result.length).to.equal(1); // Only ADX records should be returned
            expect(result[0].name).to.equal("ADX Website 1");
            expect(mockLogger.traceError.calledOnce).to.be.true;
        });

        it("should handle errors when fetching app modules gracefully", async () => {
            // Arrange
            sandbox.stub(AuthenticationProvider, "dataverseAuthentication").resolves(mockAuthResponse);

            fetchStub.reset();

            // First call - ADX website records
            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockAdxWebsiteRecords })
            } as Response);

            // Second call - Power Pages site records
            fetchStub.onSecondCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockPowerPagesSiteRecords })
            } as Response);

            // Third call - App modules fails
            fetchStub.onThirdCall().resolves({
                ok: false,
                status: 500
            } as Response);

            // Fourth call - Power Pages site settings
            fetchStub.onCall(3).resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockPowerPagesSiteSettings })
            } as Response);

            // Act
            const result = await getAllWebsites(mockOrgDetails);

            // Assert
            expect(result).to.be.an("array");
            expect(result.length).to.equal(2); // Both ADX and Power Pages should be returned
            expect(result[0].name).to.equal("ADX Website 1");
            expect(result[1].name).to.equal("Power Pages Site 1");
            expect(result[0].siteManagementUrl).to.equal(""); // No app module ID, so empty string
            expect(result[1].siteManagementUrl).to.equal(""); // No app module ID, so empty string
            expect(mockLogger.traceError.calledOnce).to.be.true;
        });

        it("should handle 404 errors for ADX and Power Pages API calls gracefully", async () => {
            // Arrange
            sandbox.stub(AuthenticationProvider, "dataverseAuthentication").resolves(mockAuthResponse);

            fetchStub.reset();

            // First call - ADX website records returns 404
            fetchStub.onFirstCall().resolves({
                ok: false,
                status: 404
            } as Response);

            // Second call - Power Pages site records returns 404
            fetchStub.onSecondCall().resolves({
                ok: false,
                status: 404
            } as Response);

            // Third call - App modules
            fetchStub.onThirdCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: mockAppModules })
            } as Response);

            // Act
            const result = await getAllWebsites(mockOrgDetails);

            // Assert
            expect(result).to.be.an("array");
            expect(result).to.be.empty;
        });

        it("should handle authentication errors gracefully", async () => {
            // Arrange
            const authError = new Error("Authentication failed");
            sandbox.stub(AuthenticationProvider, "dataverseAuthentication").rejects(authError);

            // Act
            const result = await getAllWebsites(mockOrgDetails);

            // Assert
            expect(result).to.be.an("array");
            expect(result).to.be.empty;
            expect(mockLogger.traceError.calledOnce).to.be.true;
        });

        it("should handle empty responses from all APIs gracefully", async () => {
            // Arrange
            sandbox.stub(AuthenticationProvider, "dataverseAuthentication").resolves(mockAuthResponse);

            fetchStub.reset();

            // First call - ADX website records empty
            fetchStub.onFirstCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            } as Response);

            // Second call - Power Pages site records empty
            fetchStub.onSecondCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            } as Response);

            // Third call - App modules empty
            fetchStub.onThirdCall().resolves({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            } as Response);

            // Fourth call - Power Pages site settings
            fetchStub.onCall(3).resolves({
                ok: true,
                json: () => Promise.resolve({ value: [] })
            } as Response);

            // Act
            const result = await getAllWebsites(mockOrgDetails);

            // Assert
            expect(result).to.be.an("array");
            expect(result).to.be.empty;
        });
    });
});
