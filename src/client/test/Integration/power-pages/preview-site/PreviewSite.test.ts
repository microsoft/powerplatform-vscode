/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import { PreviewSite } from '../../../../power-pages/preview-site/PreviewSite';
import { ECSFeaturesClient } from '../../../../../common/ecs-features/ecsFeatureClient';
import { EnableSiteRuntimePreview } from '../../../../../common/ecs-features/ecsFeatureGates';
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
