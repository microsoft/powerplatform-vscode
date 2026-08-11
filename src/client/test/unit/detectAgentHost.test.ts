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

    it('probes both hosts and aggregates mixed results', async () => {
        const runProbe = sinon.stub();
        runProbe.withArgs('copilot --version').resolves({ stdout: 'copilot 0.0.1\n' });
        runProbe.withArgs('claude --version').rejects(new Error('not found'));

        const results = await detectAgentHosts(runProbe);

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
