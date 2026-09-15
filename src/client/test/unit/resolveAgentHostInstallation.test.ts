/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import { URI_CONSTANTS } from '../../uriHandler/constants/uriConstants';
import type { CreateFlowParameters } from '../../uriHandler/handlers/createFlowParams';
import { uriHandlerTelemetryEventNames } from '../../uriHandler/telemetry/uriHandlerTelemetryEvents';
import { AgentHost } from '../../uriHandler/utils/detectAgentHost';
import {
    AgentHostInstallationStrings,
    ResolveAgentHostInstallationDependencies,
    resolveAgentHostInstallation
} from '../../uriHandler/utils/resolveAgentHostInstallation';
import type { ResumeMarker } from '../../uriHandler/utils/resumeMarker';

const strings: AgentHostInstallationStrings = {
    installGuidancePrompt: "{0} isn't installed. Install it, then choose {1}.",
    viewInstallationGuide: 'View Installation Guide',
    checkAgain: 'Check Again',
    dismiss: 'Dismiss',
    reloadWindow: 'Reload Window',
    notNow: 'Not Now'
};

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

interface CapturedEvent {
    eventName: string;
    extraProps?: Record<string, string>;
}

function createDependencies(
    informationSelections: Array<string | undefined>,
    warningSelections: Array<string | undefined> = []
): {
    deps: ResolveAgentHostInstallationDependencies;
    events: CapturedEvent[];
    showInformationMessage: sinon.SinonStub;
    showWarningMessage: sinon.SinonStub;
    openExternal: sinon.SinonStub;
    detectHost: sinon.SinonStub;
    writeMarker: sinon.SinonStub;
    reloadWindow: sinon.SinonStub;
} {
    const events: CapturedEvent[] = [];
    const showInformationMessage = sinon.stub();
    informationSelections.forEach((selection, index) => {
        showInformationMessage.onCall(index).resolves(selection);
    });
    const showWarningMessage = sinon.stub();
    warningSelections.forEach((selection, index) => {
        showWarningMessage.onCall(index).resolves(selection);
    });
    const openExternal = sinon.stub().resolves();
    const detectHost = sinon.stub().resolves({
        host: AgentHost.Copilot,
        installed: false
    });
    const writeMarker = sinon.stub().resolves();
    const reloadWindow = sinon.stub().resolves();

    const deps: ResolveAgentHostInstallationDependencies = {
        strings,
        showInformationMessage,
        showWarningMessage,
        openExternal,
        detectHost,
        writeResumeMarker: writeMarker,
        reloadWindow,
        emitEvent: (eventName, _eventParams, _channel, extraProps) => {
            events.push({ eventName, extraProps });
        },
        now: () => 123456
    };

    return {
        deps,
        events,
        showInformationMessage,
        showWarningMessage,
        openExternal,
        detectHost,
        writeMarker,
        reloadWindow
    };
}

describe('resolveAgentHostInstallation', () => {
    it('shows the localized guidance and emits prompted once', async () => {
        const context = createDependencies([strings.dismiss]);

        await resolveAgentHostInstallation(
            AgentHost.Copilot,
            'GitHub Copilot CLI',
            params,
            context.deps
        );

        expect(context.showInformationMessage.calledOnceWithExactly(
            "GitHub Copilot CLI isn't installed. Install it, then choose Check Again.",
            strings.viewInstallationGuide,
            strings.checkAgain,
            strings.dismiss
        )).to.be.true;
        expect(context.events.filter(event =>
            event.eventName === uriHandlerTelemetryEventNames
                .URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED
        )).to.have.length(1);
    });

    it('opens the host guide, emits guide opened, and re-shows guidance', async () => {
        const context = createDependencies([
            strings.viewInstallationGuide,
            strings.dismiss
        ]);

        const result = await resolveAgentHostInstallation(
            AgentHost.Claude,
            'Claude Code',
            { ...params, agentHost: AgentHost.Claude },
            context.deps
        );

        expect(context.openExternal.calledOnceWithExactly(
            URI_CONSTANTS.AGENT_HOST_INSTALL_GUIDE_URLS.claude
        )).to.be.true;
        expect(context.showInformationMessage.callCount).to.equal(2);
        expect(context.events.map(event => event.eventName)).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_GUIDE_OPENED,
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED
        ]);
        expect(result).to.deep.equal({ status: 'dismissed' });
    });

    it('returns resolved when a live recheck finds the host', async () => {
        const context = createDependencies([strings.checkAgain]);
        context.detectHost.resolves({
            host: AgentHost.Copilot,
            installed: true,
            version: '1.2.3'
        });

        const result = await resolveAgentHostInstallation(
            AgentHost.Copilot,
            'GitHub Copilot CLI',
            params,
            context.deps
        );

        expect(context.detectHost.calledOnceWithExactly(AgentHost.Copilot)).to.be.true;
        expect(context.events).to.deep.include({
            eventName: uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RECHECKED,
            extraProps: { outcome: 'found' }
        });
        expect(context.events.some(event =>
            event.eventName === uriHandlerTelemetryEventNames
                .URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED
        )).to.be.false;
        expect(context.reloadWindow.notCalled).to.be.true;
        expect(result).to.deep.equal({
            status: 'resolved',
            host: AgentHost.Copilot
        });
    });

    it('persists a complete marker before requesting reload when the host remains missing', async () => {
        const context = createDependencies(
            [strings.checkAgain],
            [strings.reloadWindow]
        );
        const calls: string[] = [];
        context.writeMarker.callsFake(async () => {
            calls.push('marker');
        });
        context.deps.emitEvent = (eventName, _eventParams, _channel, extraProps) => {
            context.events.push({ eventName, extraProps });
            if (eventName === uriHandlerTelemetryEventNames
                .URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RELOAD_REQUESTED) {
                calls.push('event');
            }
        };
        context.reloadWindow.callsFake(async () => {
            calls.push('reload');
        });

        const result = await resolveAgentHostInstallation(
            AgentHost.Copilot,
            'GitHub Copilot CLI',
            params,
            context.deps
        );

        const marker = context.writeMarker.firstCall.args[0] as ResumeMarker;
        expect(marker).to.deep.equal({
            host: AgentHost.Copilot,
            timestamp: 123456,
            correlationId: 'correlation-id',
            environmentId: 'environment-id',
            orgUrl: 'https://org.crm.dynamics.com',
            websiteId: 'website-id',
            source: 'powerPagesHome'
        });
        expect(calls).to.deep.equal(['marker', 'event', 'reload']);
        expect(context.events).to.deep.include({
            eventName: uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RECHECKED,
            extraProps: { outcome: 'missing' }
        });
        expect(context.reloadWindow.calledOnce).to.be.true;
        expect(result).to.deep.equal({ status: 'reloading' });
    });

    it('dismisses from the missing-host warning', async () => {
        const context = createDependencies(
            [strings.checkAgain],
            [strings.dismiss]
        );

        const result = await resolveAgentHostInstallation(
            AgentHost.Copilot,
            'GitHub Copilot CLI',
            params,
            context.deps
        );

        expect(context.events.map(event => event.eventName)).to.deep.equal([
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED,
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_RECHECKED,
            uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED
        ]);
        expect(context.writeMarker.notCalled).to.be.true;
        expect(result).to.deep.equal({ status: 'dismissed' });
    });

    it('dismisses when the initial guidance is dismissed or closed', async () => {
        for (const selection of [strings.dismiss, strings.notNow, undefined]) {
            const context = createDependencies([selection]);

            const result = await resolveAgentHostInstallation(
                AgentHost.Copilot,
                'GitHub Copilot CLI',
                params,
                context.deps
            );

            expect(context.events.map(event => event.eventName)).to.deep.equal([
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_PROMPTED,
                uriHandlerTelemetryEventNames.URI_HANDLER_AGENTIC_CREATE_HOST_INSTALL_DISMISSED
            ]);
            expect(result).to.deep.equal({ status: 'dismissed' });
        }
    });

    it('keeps raw organization URLs and path data out of event extras', async () => {
        const context = createDependencies(
            [strings.checkAgain],
            [strings.dismiss]
        );
        const paramsWithPathLikeValues = {
            ...params,
            orgUrl: 'https://private.crm.dynamics.com',
            source: 'C:\\private\\folder'
        };

        await resolveAgentHostInstallation(
            AgentHost.Copilot,
            'GitHub Copilot CLI',
            paramsWithPathLikeValues,
            context.deps
        );

        const extraProps = context.events
            .map(event => event.extraProps)
            .filter((props): props is Record<string, string> => props !== undefined);
        expect(extraProps).to.deep.equal([{ outcome: 'missing' }]);
        for (const props of extraProps) {
            expect(props).to.not.have.property('orgUrl');
            expect(Object.keys(props).some(key => /path|folder/i.test(key))).to.be.false;
            expect(Object.values(props).some(value => /private|\\/.test(value))).to.be.false;
        }
    });
});
