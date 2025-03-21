/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import PacContext from '../../../../pac/PacContext';
import CurrentSiteContext from '../../../../power-pages/actions-hub/CurrentSiteContext';
import { getBaseEventInfo } from '../../../../power-pages/actions-hub/TelemetryHelper';


describe('TelemetryHelper', () => {
    describe('getBaseEventInfo', () => {
        let orgInfoStub: sinon.SinonStub;
        let siteIdStub: sinon.SinonStub;

        beforeEach(() => {
            orgInfoStub = sinon.stub(PacContext, 'OrgInfo').value({ OrgId: 'testOrgId', OrgUrl: 'testOrgUrl' });
            siteIdStub = sinon.stub(CurrentSiteContext, 'currentSiteId').value('testSiteId');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('should return event info with orgId, orgUrl, and siteId', () => {
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                orgId: 'testOrgId',
                orgUrl: 'testOrgUrl',
                siteId: 'testSiteId'
            });
        });

        it('should return event info without orgId and orgUrl when PacContext.OrgInfo is undefined', () => {
            orgInfoStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                siteId: 'testSiteId'
            });
        });

        it('should return event info without siteId when CurrentSiteContext.currentSiteId is undefined', () => {
            siteIdStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({
                orgId: 'testOrgId',
                orgUrl: 'testOrgUrl'
            });
        });

        it('should return empty event info when PacContext.OrgInfo and CurrentSiteContext.currentSiteId are undefined', () => {
            orgInfoStub.value(undefined);
            siteIdStub.value(undefined);
            const eventInfo = getBaseEventInfo();
            expect(eventInfo).to.deep.equal({});
        });
    });
});
