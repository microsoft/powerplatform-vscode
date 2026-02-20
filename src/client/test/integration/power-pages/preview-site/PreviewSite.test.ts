/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import * as vscode from 'vscode';
import { PreviewSite } from '../../../../power-pages/preview-site/PreviewSite';
import { ECSFeaturesClient } from '../../../../../common/ecs-features/ecsFeatureClient';
import { EnableSiteRuntimePreview } from '../../../../../common/ecs-features/ecsFeatureGates';
import { oneDSLoggerWrapper } from '../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';
import { Events } from '../../../../power-pages/preview-site/Constants';
import ArtemisContext from '../../../../ArtemisContext';
import PacContext from '../../../../pac/PacContext';
import * as sinon from 'sinon';

describe('PreviewSite', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('isSiteRuntimePreviewEnabled', () => {
        it('should return false when config value is undefined', () => {
            // Arrange
            const config = {};
            Object.defineProperty(config, 'enableSiteRuntimePreview', { value: undefined });
            sandbox.stub(ECSFeaturesClient, 'getConfig').withArgs(EnableSiteRuntimePreview).returns(config);

            // Act
            const result = PreviewSite.isSiteRuntimePreviewEnabled();

            // Assert
            expect(result).to.be.false;
        });

        it('should return true when config value is true', () => {
            // Arrange
            sandbox.stub(ECSFeaturesClient, 'getConfig').withArgs(EnableSiteRuntimePreview).returns({ enableSiteRuntimePreview: true });

            // Act
            const result = PreviewSite.isSiteRuntimePreviewEnabled();

            // Assert
            expect(result).to.be.true;
        });

        it('should return false when config value is false', () => {
            // Arrange
            sandbox.stub(ECSFeaturesClient, 'getConfig').withArgs(EnableSiteRuntimePreview).returns({ enableSiteRuntimePreview: false });

            // Act
            const result = PreviewSite.isSiteRuntimePreviewEnabled();

            // Assert
            expect(result).to.be.false;
        });

        it('should handle empty config object', () => {
            // Arrange
            sandbox.stub(ECSFeaturesClient, 'getConfig').withArgs(EnableSiteRuntimePreview).returns({});

            // Act
            const result = PreviewSite.isSiteRuntimePreviewEnabled();

            // Assert
            expect(result).to.be.false;
        });
    });

    describe('initialize', () => {
        let mockLogger: { traceError: sinon.SinonStub; traceInfo: sinon.SinonStub; traceWarning: sinon.SinonStub; featureUsage: sinon.SinonStub };

        beforeEach(() => {
            PreviewSite['_isInitialized'] = false;

            mockLogger = {
                traceError: sandbox.stub(),
                traceInfo: sandbox.stub(),
                traceWarning: sandbox.stub(),
                featureUsage: sandbox.stub()
            };
            sandbox.stub(oneDSLoggerWrapper, 'getLogger').returns(mockLogger);
        });

        it('should include initPhase in error telemetry when initialization fails during ECS check', async () => {
            sandbox.stub(ECSFeaturesClient, 'getConfig').throws(new Error('ECS unavailable'));

            const mockContext = { subscriptions: [] } as unknown as import('vscode').ExtensionContext;
            const mockWorkspaceFolders = [{ uri: 'test/path', name: 'test', index: 0 }];
            const mockPacTerminal = {} as unknown as import('../../../../lib/PacTerminal').PacTerminal;

            await PreviewSite.initialize(mockContext, mockWorkspaceFolders, mockPacTerminal);

            expect(mockLogger.traceError.calledOnce).to.be.true;
            const [eventName, message, error, eventInfo] = mockLogger.traceError.firstCall.args;
            expect(eventName).to.equal(Events.PREVIEW_SITE_INITIALIZATION_FAILED);
            expect(message).to.equal('ECS unavailable');
            expect(error).to.be.instanceOf(Error);
            expect(eventInfo).to.deep.equal({ initPhase: 'checkECSConfig' });
        });

        it('should wrap non-Error exceptions with Error and include initPhase', async () => {
            sandbox.stub(ECSFeaturesClient, 'getConfig').throws('string error');

            const mockContext = { subscriptions: [] } as unknown as import('vscode').ExtensionContext;
            const mockWorkspaceFolders = [{ uri: 'test/path', name: 'test', index: 0 }];
            const mockPacTerminal = {} as unknown as import('../../../../lib/PacTerminal').PacTerminal;

            await PreviewSite.initialize(mockContext, mockWorkspaceFolders, mockPacTerminal);

            expect(mockLogger.traceError.calledOnce).to.be.true;
            const [, , error, eventInfo] = mockLogger.traceError.firstCall.args;
            expect(error).to.be.instanceOf(Error);
            expect(eventInfo).to.have.property('initPhase');
        });

        it('should report loadSiteDetails phase when loadSiteDetails fails', async () => {
            sandbox.stub(ECSFeaturesClient, 'getConfig').returns({ enableSiteRuntimePreview: true });
            sandbox.stub(ArtemisContext, 'ServiceResponse').get(() => ({ stamp: 'test', response: {} }));
            sandbox.stub(PacContext, 'OrgInfo').get(() => ({ OrgId: 'test' }));
            sandbox.stub(PacContext, 'onChanged');
            sandbox.stub(vscode.commands, 'registerCommand').returns({ dispose: () => { /* noop */ } });

            const mockSubscriptions: unknown[] = [];
            const mockContext = {
                subscriptions: {
                    push: (...items: unknown[]) => mockSubscriptions.push(...items)
                }
            } as unknown as import('vscode').ExtensionContext;
            const mockWorkspaceFolders = [{ uri: 'test/path', name: 'test', index: 0 }];
            const mockPacTerminal = {} as unknown as import('../../../../lib/PacTerminal').PacTerminal;

            sandbox.stub(PreviewSite, 'loadSiteDetails').rejects(new Error('load failed'));

            await PreviewSite.initialize(mockContext, mockWorkspaceFolders, mockPacTerminal);

            expect(mockLogger.traceError.calledOnce).to.be.true;
            const [, , , eventInfo] = mockLogger.traceError.firstCall.args;
            expect(eventInfo).to.deep.equal({ initPhase: 'loadSiteDetails' });
        });
    });

    describe('loadSiteUrl', () => {
        const mockWorkspaceFolders = [{ uri: 'test/path', name: 'test', index: 0 }];

        beforeEach(() => {
            PreviewSite['_websiteDetails'] = undefined;
        });

        it('should set website URL when getWebSiteUrl returns valid URL', async () => {
            // Arrange
            const expectedUrl = 'https://test-website.com';
            const getWebSiteUrlStub = sandbox.stub();
            getWebSiteUrlStub.resolves({ url: expectedUrl, dataModel: 'Enhanced'});
            PreviewSite['getWebsiteDetails'] = getWebSiteUrlStub;

            // Act
            await PreviewSite.loadSiteDetails(mockWorkspaceFolders);

            // Assert
            expect(PreviewSite['_websiteDetails']).to.deep.equal({ url: expectedUrl, dataModel: 'Enhanced' })
            expect(getWebSiteUrlStub.calledOnceWith(mockWorkspaceFolders)).to.be.true;
        });

        it('should set details when getWebSiteUrl returns empty URL string', async () => {
            // Arrange
            const getWebSiteUrlStub = sandbox.stub();
            getWebSiteUrlStub.resolves({ url: '', dataModel: 'Enhanced'});
            PreviewSite['getWebsiteDetails'] = getWebSiteUrlStub;

            // Act
            await PreviewSite.loadSiteDetails(mockWorkspaceFolders);

            // Assert
            expect(PreviewSite['_websiteDetails']).to.deep.equal({ url: '', dataModel: 'Enhanced' });
            expect(getWebSiteUrlStub.calledOnceWith(mockWorkspaceFolders)).to.be.true;
        });
    });
});
