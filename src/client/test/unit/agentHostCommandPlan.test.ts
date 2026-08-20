/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    AgentHostCommandPlanStrings,
    buildAgentHostCommandPlan
} from "../../uriHandler/utils/agentHostCommandPlan";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";

describe("buildAgentHostCommandPlan", () => {
    const strings: AgentHostCommandPlanStrings = {
        registerMarketplace: "register",
        installPlugin: "install",
        installPluginUserScope: "install user scope",
        launchHost: "start {0}"
    };

    it("builds the Copilot plan with marketplace, install, and interactive prompt", () => {
        const plan = buildAgentHostCommandPlan(AgentHost.Copilot, "GitHub Copilot CLI", strings);

        expect(plan).to.deep.equal([
            {
                commandLine: 'copilot plugin marketplace add "microsoft/power-platform-skills"',
                description: "register"
            },
            {
                commandLine: 'copilot plugin install "power-pages@power-platform-skills"',
                description: "install"
            },
            {
                commandLine: 'copilot -i "How to use Power Pages Plugin for creating a site?"',
                description: "start GitHub Copilot CLI"
            }
        ]);
    });

    it("builds the Claude plan with user-scope install and a bare prompt launch", () => {
        const plan = buildAgentHostCommandPlan(AgentHost.Claude, "Claude Code", strings);

        expect(plan).to.deep.equal([
            {
                commandLine: 'claude plugin marketplace add "microsoft/power-platform-skills"',
                description: "register"
            },
            {
                commandLine: 'claude plugin install "power-pages@power-platform-skills" --scope user',
                description: "install user scope"
            },
            {
                commandLine: 'claude "How to use Power Pages Plugin for creating a site?"',
                description: "start Claude Code"
            }
        ]);
    });

    it("substitutes the host display name into the launch description", () => {
        const plan = buildAgentHostCommandPlan(AgentHost.Copilot, "My Host", strings);

        expect(plan[2].description).to.equal("start My Host");
    });
});
