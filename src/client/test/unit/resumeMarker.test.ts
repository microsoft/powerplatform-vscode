/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import { URI_CONSTANTS } from '../../uriHandler/constants/uriConstants';
import type { CreateFlowParameters } from '../../uriHandler/handlers/createFlowParams';
import { AgentHost } from '../../uriHandler/utils/detectAgentHost';
import {
    buildResumeMarker,
    clearResumeMarker,
    isResumeMarkerFresh,
    readResumeMarker,
    ResumeMarkerStore,
    writeResumeMarker
} from '../../uriHandler/utils/resumeMarker';

const params: CreateFlowParameters = {
    environmentId: 'environment-id',
    orgUrl: 'https://org.crm.dynamics.com',
    region: 'NAM',
    tenantId: 'tenant-id',
    websiteId: 'website-id',
    source: 'powerPagesHome',
    agentHost: AgentHost.Copilot,
    version: '1',
    correlationId: 'correlation-id'
};

class FakeResumeMarkerStore implements ResumeMarkerStore {
    private readonly values = new Map<string, unknown>();

    get<T>(key: string): T | undefined {
        return this.values.get(key) as T | undefined;
    }

    update(key: string, value: unknown): void {
        if (value === undefined) {
            this.values.delete(key);
        } else {
            this.values.set(key, value);
        }
    }
}

describe('resumeMarker', () => {
    it('builds the locked resumable context with the supplied timestamp', () => {
        const marker = buildResumeMarker(params, AgentHost.Copilot, 123456);

        expect(marker).to.deep.equal({
            host: AgentHost.Copilot,
            timestamp: 123456,
            correlationId: 'correlation-id',
            environmentId: 'environment-id',
            orgUrl: 'https://org.crm.dynamics.com',
            websiteId: 'website-id',
            source: 'powerPagesHome'
        });
    });

    it('writes and reads a marker through the configured store key', async () => {
        const store = new FakeResumeMarkerStore();
        const marker = buildResumeMarker(params, AgentHost.Claude, 123456);

        await writeResumeMarker(store, marker);

        expect(readResumeMarker(store)).to.deep.equal(marker);
        expect(store.get(URI_CONSTANTS.RESUME_MARKER.KEY)).to.deep.equal(marker);
    });

    it('clears a persisted marker', async () => {
        const store = new FakeResumeMarkerStore();
        await writeResumeMarker(store, buildResumeMarker(params, AgentHost.Copilot, 123456));

        await clearResumeMarker(store);

        expect(readResumeMarker(store)).to.be.undefined;
    });

    it('treats markers at or within the TTL as fresh', () => {
        const marker = buildResumeMarker(params, AgentHost.Copilot, 1000);

        expect(isResumeMarkerFresh(marker, 1000)).to.be.true;
        expect(isResumeMarkerFresh(
            marker,
            1000 + URI_CONSTANTS.RESUME_MARKER.TTL_MS
        )).to.be.true;
    });

    it('treats markers past the TTL as stale', () => {
        const marker = buildResumeMarker(params, AgentHost.Copilot, 1000);

        expect(isResumeMarkerFresh(
            marker,
            1001 + URI_CONSTANTS.RESUME_MARKER.TTL_MS
        )).to.be.false;
    });
});
