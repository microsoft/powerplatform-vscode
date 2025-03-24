/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import PacContext from '../../../../pac/PacContext';
import CurrentSiteContext from '../../../../power-pages/actions-hub/CurrentSiteContext';
import { getBaseEventInfo } from '../../../../power-pages/actions-hub/TelemetryHelper';
import ArtemisContext from '../../../../ArtemisContext';


describe('TelemetryHelper', () => {
    describe('getBaseEventInfo', () => {
        let orgInfoStub: sinon.SinonStub;
        let siteIdStub: sinon.SinonStub;
        let authInfoStub: sinon.SinonStub;

        beforeEach(() => {
            orgInfoStub = sinon.stub(PacContext, 'OrgInfo').value({ OrgId: 'testOrgId', OrgUrl: 'testOrgUrl' });
            authInfoStub = sinon.stub(PacContext, 'AuthInfo').value({ TenantId: 'testTenantId' });
            siteIdStub = sinon.stub(CurrentSiteContext, 'currentSiteId').value('testSiteId');
            sinon.stub(ArtemisContext, 'ServiceResponse').value({ stamp: 'testStamp', response: { geoName: 'testGeo' } });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should return event info with orgId, orgUrl, and siteId', () => {
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                os: 'Windows',
                stamp: 'testStamp',
                geo: 'testGeo',
                orgId: 'testOrgId',
                orgUrl: 'testOrgUrl',
                currentSiteId: 'testSiteId',
                tenantId: 'testTenantId'
            });
        });

        it('should return event info without orgId and orgUrl when PacContext.OrgInfo is undefined', () => {
            orgInfoStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                currentSiteId: 'testSiteId',
                os: 'Windows',
                stamp: 'testStamp',
                geo: 'testGeo',
                tenantId: 'testTenantId'
            });
        });

        it('should return event info without siteId when CurrentSiteContext.currentSiteId is undefined', () => {
            siteIdStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                orgId: 'testOrgId',
                orgUrl: 'testOrgUrl',
                os: 'Windows',
                stamp: 'testStamp',
                geo: 'testGeo',
                tenantId: 'testTenantId'
            });
        });

        it('should return basic event info when PacContext.OrgInfo and CurrentSiteContext.currentSiteId are undefined', () => {
            orgInfoStub.value(undefined);
            siteIdStub.value(undefined);
            authInfoStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                os: 'Windows',
                stamp: 'testStamp',
                geo: 'testGeo'
            });
        });

        it('should return event info with only os when all other values are undefined', () => {
            orgInfoStub.value(undefined);
            siteIdStub.value(undefined);
            authInfoStub.value(undefined);
            sinon.stub(ArtemisContext, 'ServiceResponse').value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                os: 'Windows'
            });
        });

        it('should return event info with only os when all other values are null', () => {
            orgInfoStub.value(null);
            siteIdStub.value(null);
            authInfoStub.value(null);
            sinon.stub(ArtemisContext, 'ServiceResponse').value(null);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                os: 'Windows'
            });
        });

        it('should not return tenant id when PacContext.AuthInfo is undefined', () => {
            authInfoStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                os: 'Windows',
                stamp: 'testStamp',
                geo: 'testGeo',
                orgId: 'testOrgId',
                orgUrl: 'testOrgUrl',
                currentSiteId: 'testSiteId'
            });
        });
    });
});
