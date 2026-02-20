/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import PacContext from '../../../../pac/PacContext';
import CurrentSiteContext from '../../../../power-pages/actions-hub/CurrentSiteContext';
import { getBaseEventInfo, traceError, traceInfo } from '../../../../power-pages/actions-hub/TelemetryHelper';
import ArtemisContext from '../../../../ArtemisContext';
import { oneDSLoggerWrapper } from '../../../../../common/OneDSLoggerTelemetry/oneDSLoggerWrapper';


describe('TelemetryHelper', () => {
    let traceInfoStub: sinon.SinonStub;
    let traceErrorStub: sinon.SinonStub;

    beforeEach(() => {
        traceInfoStub = sinon.stub();
        traceErrorStub = sinon.stub();
        sinon.stub(oneDSLoggerWrapper, 'getLogger').returns({
            traceError: traceErrorStub,
            traceInfo: traceInfoStub,
            traceWarning: sinon.stub(),
            featureUsage: sinon.stub(),
        });
    });

    afterEach(() => {
        sinon.restore();
    });

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
                stamp: 'testStamp',
                geo: 'testGeo'
            });
        });

        it('should return empty event info when all other values are undefined', () => {
            orgInfoStub.value(undefined);
            siteIdStub.value(undefined);
            authInfoStub.value(undefined);
            sinon.stub(ArtemisContext, 'ServiceResponse').value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({});
        });

        it('should return empty event info when all other values are null', () => {
            orgInfoStub.value(null);
            siteIdStub.value(null);
            authInfoStub.value(null);
            sinon.stub(ArtemisContext, 'ServiceResponse').value(null);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({});
        });

        it('should not return tenant id when PacContext.AuthInfo is undefined', () => {
            authInfoStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                stamp: 'testStamp',
                geo: 'testGeo',
                orgId: 'testOrgId',
                orgUrl: 'testOrgUrl',
                currentSiteId: 'testSiteId'
            });
        });
    });

    describe('traceInfo', () => {
        it('should call traceInfo with correct event name and data', () => {
            const eventName = 'testEvent';
            const eventData = { key: 'value' };

            traceInfo(eventName, eventData);

            expect(traceInfoStub.calledOnce).to.be.true;
            expect(traceInfoStub.firstCall.args[0]).to.equal(eventName);
            expect(traceInfoStub.firstCall.args[1]).to.deep.equal({
                ...getBaseEventInfo(),
                ...eventData
            });
        });
    });

    describe('traceError', () => {
        it('should call traceError with correct event name and data', () => {
            const eventName = 'testEvent';
            const error = new Error('testError');
            const eventData = { key: 'value' };

            traceError(eventName, error, eventData);

            expect(traceErrorStub.calledOnce).to.be.true;
            expect(traceErrorStub.firstCall.args[0]).to.equal(eventName);
            expect(traceErrorStub.firstCall.args[1]).to.equal(error.message);
            expect(traceErrorStub.firstCall.args[2]).to.equal(error);
            expect(traceErrorStub.firstCall.args[3]).to.deep.equal({
                ...getBaseEventInfo(),
                error: error.message,
                ...eventData
            });
        });
    });

});
