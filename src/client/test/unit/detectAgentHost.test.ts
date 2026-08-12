/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from 'chai';
import sinon from 'sinon';
import {
    AgentHost,
    detectAgentHost,
    detectAgentHosts
} from '../../uriHandler/utils/detectAgentHost';

const createDeferred = <T>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });
    return { promise, resolve, reject };
};

describe('detectAgentHost', () => {
    it('returns the installed host with trimmed version output', async () => {
        const runProbe = sinon.stub().resolves({ stdout: '  GitHub Copilot CLI 1.2.3\r\n' });

        const result = await detectAgentHost(AgentHost.Copilot, runProbe);

        expect(result).to.deep.equal({
            host: AgentHost.Copilot,
            installed: true,
            version: 'GitHub Copilot CLI 1.2.3'
        });
    });

    it('returns not installed when the probe rejects', async () => {
        const runProbe = sinon.stub().rejects(Object.assign(new Error('spawn ENOENT'), { code: 'ENOENT' }));

        const result = await detectAgentHost(AgentHost.Claude, runProbe);

        expect(result).to.deep.equal({
            host: AgentHost.Claude,
            installed: false
        });
    });

    it('probes both hosts in parallel and aggregates mixed results', async () => {
        const copilotProbe = createDeferred<{ stdout: string }>();
        const claudeProbe = createDeferred<{ stdout: string }>();
        const runProbe = sinon.stub();
        runProbe.withArgs('copilot --version').returns(copilotProbe.promise);
        runProbe.withArgs('claude --version').returns(claudeProbe.promise);

        const resultsPromise = detectAgentHosts(runProbe);

        expect(runProbe.calledTwice).to.be.true;
        copilotProbe.resolve({ stdout: 'copilot 0.0.1\n' });
        claudeProbe.reject(new Error('not found'));
        const results = await resultsPromise;

        expect(results).to.deep.equal([
            {
                host: AgentHost.Copilot,
                installed: true,
                version: 'copilot 0.0.1'
            },
            {
                host: AgentHost.Claude,
                installed: false
            }
        ]);
    });

    it('uses the correct version command for each host', async () => {
        const runProbe = sinon.stub().resolves({ stdout: '1.0.0' });

        await detectAgentHosts(runProbe);

        expect(runProbe.calledTwice).to.be.true;
        expect(runProbe.calledWithExactly('copilot --version')).to.be.true;
        expect(runProbe.calledWithExactly('claude --version')).to.be.true;
    });
});
