/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    classifyAgentHostSetupOutput,
    detectAgentHostSetup,
    getAgentHostSetupCheckCommand
} from "../../uriHandler/utils/agentHostSetupPrecheck";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";

describe("agentHostSetupPrecheck", () => {
    it("builds host-specific read-only inventory commands", () => {
        expect(getAgentHostSetupCheckCommand(
            AgentHost.Copilot,
            "marketplace"
        )).to.equal("copilot plugin marketplace list");
        expect(getAgentHostSetupCheckCommand(
            AgentHost.Claude,
            "plugin"
        )).to.equal("claude plugin list");
    });

    it("matches exact marketplace identities in table output", () => {
        expect(classifyAgentHostSetupOutput(
            "Name │ Source\npower-platform-skills │ microsoft/power-platform-skills",
            "marketplace"
        )).to.equal("present");
        expect(classifyAgentHostSetupOutput(
            "power-platform-skills-preview",
            "marketplace"
        )).to.equal("missing");
    });

    it("ignores terminal color sequences around exact identities", () => {
        const escape = String.fromCharCode(27);
        expect(classifyAgentHostSetupOutput(
            `${escape}[32mpower-platform-skills${escape}[0m`,
            "marketplace"
        )).to.equal("present");
    });

    it("matches a canonical plugin identity or exact name and marketplace columns", () => {
        expect(classifyAgentHostSetupOutput(
            "power-pages@power-platform-skills enabled",
            "plugin"
        )).to.equal("present");
        expect(classifyAgentHostSetupOutput(
            "power-pages │ power-platform-skills │ enabled",
            "plugin"
        )).to.equal("present");
        expect(classifyAgentHostSetupOutput(
            "power-pages-preview@power-platform-skills",
            "plugin"
        )).to.equal("missing");
    });

    it("distinguishes a disabled installed plugin from a ready plugin", () => {
        expect(classifyAgentHostSetupOutput(
            "power-pages@power-platform-skills disabled",
            "plugin"
        )).to.equal("disabled");
        expect(classifyAgentHostSetupOutput(
            '{"name":"power-pages@power-platform-skills","enabled":false}',
            "plugin"
        )).to.equal("disabled");
    });

    it("returns unknown only for the inventory command that fails", async () => {
        const result = await detectAgentHostSetup(
            AgentHost.Copilot,
            async (_command, args) => {
                if (args.includes("marketplace")) {
                    throw new Error("unsupported");
                }
                return { stdout: "power-pages@power-platform-skills" };
            }
        );

        expect(result).to.deep.equal({
            marketplace: "unknown",
            plugin: "present"
        });
    });
});
