/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import {
    buildCreateFlowTelemetry,
    CreateFlowParameters
} from '../../uriHandler/handlers/createFlowParams';
import { uriHandlerTelemetryEventNames } from '../../uriHandler/telemetry/uriHandlerTelemetryEvents';
import { AgentHost } from '../../uriHandler/utils/detectAgentHost';
import {
    resumeAgenticCreate,
    ResumeAgenticCreateDependencies,
    ResumeAgenticCreateStrings
} from '../../uriHandler/utils/resumeAgenticCreate';
import {
    clearResumeMarker,
    ResumeMarker,
    ResumeMarkerStore
} from '../../uriHandler/utils/resumeMarker';

const NOW = 1000;
const strings: ResumeAgenticCreateStrings = {
    resumePrompt: '{0} is now installed. Resume creating your Power Pages site?',
    resume: 'Resume',
    notNow: 'Not Now',
    hostDisplayNames: {
        [AgentHost.Copilot]: 'GitHub Copilot CLI',
        [AgentHost.Claude]: 'Claude Code'
    }
};
const marker: ResumeMarker = {
    host: AgentHost.Copilot,
    timestamp: NOW,
    correlationId: 'correlation-id',
    environmentId: 'environment-id',
    orgUrl: 'https://secret.crm.dynamics.com',
    websiteId: 'website-id',
    source: 'powerPagesHome'
};

class FakeResumeMarkerStore implements ResumeMarkerStore {
    public value: ResumeMarker | undefined;

    constructor(value?: ResumeMarker) {
        this.value = value;
    }

    get<T>(_: string): T | undefined {
        return this.value as T | undefined;
    }

    update(_: string, value: unknown): void {
        this.value = value as ResumeMarker | undefined;
    }
}

interface TestContext {
    deps: ResumeAgenticCreateDependencies;
    store: FakeResumeMarkerStore;
    detectHost: sinon.SinonStub;
    showInformationMessage: sinon.SinonStub;
    emitEvent: sinon.SinonStub;
    runStages: sinon.SinonStub;
    clearMarker: sinon.SinonStub;
}

function createContext(
    storedMarker?: ResumeMarker,
    selection?: string
): TestContext {
    const initialMarker = arguments.length > 0 ? storedMarker : marker;
    const promptSelection = arguments.length > 1 ? selection : strings.resume;
    const store = new FakeResumeMarkerStore(initialMarker);
    const detectHost = sinon.stub().resolves({
        host: AgentHost.Copilot,
        installed: true,
        version: '1.2.3'
    });
    const showInformationMessage = sinon.stub().resolves(promptSelection);
    const emitEvent = sinon.stub().resolves();
    const runStages = sinon.stub().resolves();
    const clearMarker = sinon.stub().callsFake(clearResumeMarker);
    const deps: ResumeAgenticCreateDependencies = {
        store,
        strings,
        isEnabled: () => true,
        detectHost,
        now: () => NOW,
        showInformationMessage,
        emitEvent,
        runStages,
        clearMarker
    };

    return {
        deps,
        store,
        detectHost,
        showInformationMessage,
        emitEvent,
        runStages,
        clearMarker
    };
}

describe('resumeAgenticCreate', () => {
    it('does nothing when no resume marker exists', async () => {
        const context = createContext(undefined);

        await resumeAgenticCreate(context.deps);

        expect(context.detectHost.notCalled).to.be.true;
        expect(context.showInformationMessage.notCalled).to.be.true;
        expect(context.emitEvent.notCalled).to.be.true;
        expect(context.runStages.notCalled).to.be.true;
        expect(context.clearMarker.notCalled).to.be.true;
    });

    it('clears without resuming when the ECS gate is disabled', async () => {
        const context = createContext();
        context.deps.isEnabled = () => false;

        await resumeAgenticCreate(context.deps);

        expect(context.store.value).to.be.undefined;
        expect(context.clearMarker.calledOnceWithExactly(context.store)).to.be.true;
        expect(context.detectHost.notCalled).to.be.true;
        expect(context.emitEvent.notCalled).to.be.true;
    });

    it('clears a stale marker without detecting or prompting', async () => {
        const context = createContext({ ...marker, timestamp: Number.MIN_SAFE_INTEGER });

        await resumeAgenticCreate(context.deps);

        expect(context.store.value).to.be.undefined;
        expect(context.detectHost.notCalled).to.be.true;
        expect(context.showInformationMessage.notCalled).to.be.true;
    });

    it('clears an unsupported persisted host without probing it', async () => {
        const context = createContext({ ...marker, host: 'unsupported' });

        await resumeAgenticCreate(context.deps);

        expect(context.store.value).to.be.undefined;
        expect(context.detectHost.notCalled).to.be.true;
        expect(context.showInformationMessage.notCalled).to.be.true;
    });

    it('clears without prompting when the host is still missing', async () => {
        const context = createContext();
        context.detectHost.resolves({
            host: AgentHost.Copilot,
            installed: false
        });

        await resumeAgenticCreate(context.deps);

        expect(context.detectHost.calledOnceWithExactly(AgentHost.Copilot)).to.be.true;
        expect(context.store.value).to.be.undefined;
        expect(context.showInformationMessage.notCalled).to.be.true;
        expect(context.emitEvent.notCalled).to.be.true;
    });

    for (const selection of [strings.notNow, undefined]) {
        it(`clears silently when the prompt returns ${selection ?? 'dismissed'}`, async () => {
            const context = createContext(marker, selection);

            await resumeAgenticCreate(context.deps);

            expect(context.store.value).to.be.undefined;
            expect(context.emitEvent.notCalled).to.be.true;
            expect(context.runStages.notCalled).to.be.true;
        });
    }

    it('prompts with the selected host display name', async () => {
        const context = createContext(
            { ...marker, host: AgentHost.Claude },
            strings.notNow
        );
        context.detectHost.resolves({
            host: AgentHost.Claude,
            installed: true,
            version: '2.3.4'
        });

        await resumeAgenticCreate(context.deps);

        expect(context.detectHost.calledOnceWithExactly(AgentHost.Claude)).to.be.true;
        expect(context.showInformationMessage.calledOnceWithExactly(
            'Claude Code is now installed. Resume creating your Power Pages site?',
            strings.resume,
            strings.notNow
        )).to.be.true;
    });

    it('emits resumed before running stages with reconstructed parameters', async () => {
        const context = createContext();
        const calls: string[] = [];
        context.emitEvent.callsFake(async () => {
            calls.push('emit');
        });
        context.runStages.callsFake(async () => {
            calls.push('stages');
        });
        context.clearMarker.callsFake(async (store: ResumeMarkerStore) => {
            calls.push('clear');
            await clearResumeMarker(store);
        });

        await resumeAgenticCreate(context.deps);

        const expectedParams: CreateFlowParameters = {
            environmentId: marker.environmentId,
            orgUrl: marker.orgUrl,
            region: null,
            tenantId: null,
            websiteId: marker.websiteId,
            source: marker.source,
            agentHost: marker.host,
            version: null,
            correlationId: marker.correlationId
        };
        expect(context.emitEvent.calledOnceWithExactly(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RESUMED,
            expectedParams,
            'agent'
        )).to.be.true;
        expect(context.runStages.calledOnceWithExactly(expectedParams, AgentHost.Copilot)).to.be.true;
        expect(calls).to.deep.equal(['emit', 'stages', 'clear']);
        expect(context.store.value).to.be.undefined;
    });

    it('clears the consumed marker when common stages throw', async () => {
        const context = createContext();
        context.runStages.rejects(new Error('stage failed'));

        let error: unknown;
        try {
            await resumeAgenticCreate(context.deps);
        } catch (caughtError) {
            error = caughtError;
        }

        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.equal('stage failed');
        expect(context.emitEvent.calledOnce).to.be.true;
        expect(context.clearMarker.calledOnce).to.be.true;
        expect(context.store.value).to.be.undefined;
    });

    it('redacts the raw organization URL and never emits folder data', async () => {
        const context = createContext();
        let eventName: string | undefined;
        let properties: Record<string, string> | undefined;
        context.deps.emitEvent = (capturedEventName, params, channel) => {
            eventName = capturedEventName;
            properties = {
                ...buildCreateFlowTelemetry(params),
                channel,
                correlationId: params.correlationId || ''
            };
        };
        context.runStages.resolves({ fsPath: 'C:\\secret\\site' });

        await resumeAgenticCreate(context.deps);

        expect(eventName).to.equal(
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RESUMED
        );
        expect(properties).to.not.be.undefined;
        expect(properties).to.not.have.property('orgUrl');
        expect(Object.values(properties ?? {})).to.not.include(marker.orgUrl);
        expect(Object.keys(properties ?? {})).to.not.include.members(['folder', 'folderUri', 'path']);
        expect(Object.values(properties ?? {})).to.not.include('C:\\secret\\site');
    });
});
