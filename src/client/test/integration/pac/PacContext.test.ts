/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import { stub, spy } from 'sinon';
import PacContext from '../../../pac/PacContext';
import { AuthInfo, OrgInfo, CloudInstance, EnvironmentType } from '../../../pac/PacTypes';

describe('PacContext', () => {
    beforeEach(() => {
        PacContext["_authInfo"] = null;
        PacContext["_orgInfo"] = null;
    });

    it('should initialize with null values', () => {
        expect(PacContext.AuthInfo).to.be.null;
        expect(PacContext.OrgInfo).to.be.null;
    });

    it('should set AuthInfo correctly', () => {
        const mockAuthInfo: AuthInfo = {
            UserType: 'Member',
            Cloud: CloudInstance.Public,
            TenantId: 'test-tenant-id',
            TenantCountry: 'US',
            User: 'testuser@example.com',
            EntraIdObjectId: 'test-object-id',
            Puid: 'test-puid',
            UserCountryRegion: 'US',
            TokenExpires: new Date().toISOString(),
            Authority: 'https://login.microsoftonline.com',
            EnvironmentGeo: 'NAM',
            EnvironmentId: 'test-env-id',
            EnvironmentType: EnvironmentType.Regular,
            OrganizationId: 'test-org-id',
            OrganizationUniqueName: 'testorg',
            OrganizationFriendlyName: 'Test Organization'
        };

        PacContext.setContext(mockAuthInfo);
        expect(PacContext.AuthInfo).to.deep.equal(mockAuthInfo);
        expect(PacContext.OrgInfo).to.be.null;
    });

    it('should set OrgInfo correctly', () => {
        const mockOrgInfo: OrgInfo = {
            OrgId: 'test-org-id',
            UniqueName: 'testorg',
            FriendlyName: 'Test Organization',
            OrgUrl: 'https://test.crm.dynamics.com',
            UserEmail: 'testuser@example.com',
            UserId: 'test-user-id',
            EnvironmentId: 'test-env-id'
        };

        PacContext.setContext(null, mockOrgInfo);
        expect(PacContext.AuthInfo).to.be.null;
        expect(PacContext.OrgInfo).to.deep.equal(mockOrgInfo);
    });

    it('should set both AuthInfo and OrgInfo correctly', () => {
        const mockAuthInfo: AuthInfo = {
            UserType: 'Member',
            Cloud: CloudInstance.Public,
            TenantId: 'test-tenant-id',
            TenantCountry: 'US',
            User: 'testuser@example.com',
            EntraIdObjectId: 'test-object-id',
            Puid: 'test-puid',
            UserCountryRegion: 'US',
            TokenExpires: new Date().toISOString(),
            Authority: 'https://login.microsoftonline.com',
            EnvironmentGeo: 'NAM',
            EnvironmentId: 'test-env-id',
            EnvironmentType: EnvironmentType.Regular,
            OrganizationId: 'test-org-id',
            OrganizationUniqueName: 'testorg',
            OrganizationFriendlyName: 'Test Organization'
        };
        const mockOrgInfo: OrgInfo = {
            OrgId: 'test-org-id',
            UniqueName: 'testorg',
            FriendlyName: 'Test Organization',
            OrgUrl: 'https://test.crm.dynamics.com',
            UserEmail: 'testuser@example.com',
            UserId: 'test-user-id',
            EnvironmentId: 'test-env-id'
        };

        PacContext.setContext(mockAuthInfo, mockOrgInfo);
        expect(PacContext.AuthInfo).to.deep.equal(mockAuthInfo);
        expect(PacContext.OrgInfo).to.deep.equal(mockOrgInfo);
    });

    it('should fire onChanged event when context is updated', async () => {
        const mockAuthInfo: AuthInfo = {
            UserType: 'Member',
            Cloud: CloudInstance.Public,
            TenantId: 'test-tenant-id',
            TenantCountry: 'US',
            User: 'testuser@example.com',
            EntraIdObjectId: 'test-object-id',
            Puid: 'test-puid',
            UserCountryRegion: 'US',
            TokenExpires: new Date().toISOString(),
            Authority: 'https://login.microsoftonline.com',
            EnvironmentGeo: 'NAM',
            EnvironmentId: 'test-env-id',
            EnvironmentType: EnvironmentType.Regular,
            OrganizationId: 'test-org-id',
            OrganizationUniqueName: 'testorg',
            OrganizationFriendlyName: 'Test Organization'
        };

        const onChangedSpy = spy(PacContext['_onChanged'], 'fire');
        PacContext.setContext(mockAuthInfo, null);

        expect(onChangedSpy.calledOnce).to.be.true;
    });

    it('should dispose event emitter properly', () => {
        const eventEmitterSpy = stub(PacContext['_onChanged'], 'dispose');

        PacContext.dispose();

        expect(eventEmitterSpy.calledOnce).to.be.true;
    });
});
