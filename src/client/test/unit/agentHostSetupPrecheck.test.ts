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
        )).to.equal("claude plugin list --json");
        expect(getAgentHostSetupCheckCommand(
            AgentHost.Claude,
            "marketplace"
        )).to.equal("claude plugin marketplace list --json");
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

    it("classifies Claude marketplace JSON using exact identities", () => {
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    name: "power-platform-skills",
                    source: "github",
                    repo: "microsoft/power-platform-skills"
                }
            ]),
            "marketplace"
        )).to.equal("present");
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([{ name: "power-platform-skills-preview" }]),
            "marketplace"
        )).to.equal("missing");
    });

    it("extracts Claude JSON from VS Code Shell Integration OSC framing", () => {
        const escape = String.fromCharCode(27);
        const bell = String.fromCharCode(7);
        const output = [
            `${escape}]633;C${bell}`,
            "claude plugin marketplace list --json",
            JSON.stringify([
                {
                    name: "power-platform-skills",
                    repo: "microsoft/power-platform-skills"
                }
            ], null, 2),
            `${escape}]633;D;0${bell}`
        ].join("\r\n");

        expect(classifyAgentHostSetupOutput(
            output,
            "marketplace"
        )).to.equal("present");
    });

    it("classifies Claude plugin JSON across installation scopes", () => {
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "local",
                    enabled: false,
                    projectPath: "C:\\other-site"
                },
                {
                    id: "power-pages@power-platform-skills",
                    scope: "user",
                    enabled: true
                }
            ]),
            "plugin",
            "C:\\selected-site"
        )).to.equal("present");
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "user",
                    enabled: false
                }
            ]),
            "plugin"
        )).to.equal("disabled");
    });

    it("ignores Claude local plugins from unrelated projects", () => {
        const output = JSON.stringify([
            {
                id: "power-pages@power-platform-skills",
                scope: "local",
                enabled: true,
                projectPath: "C:\\other-site"
            }
        ]);

        expect(classifyAgentHostSetupOutput(
            output,
            "plugin",
            "C:\\selected-site"
        )).to.equal("missing");
        expect(classifyAgentHostSetupOutput(
            output,
            "plugin",
            "C:\\other-site\\src"
        )).to.equal("present");
    });

    it("matches Claude local plugins on UNC project paths", () => {
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "local",
                    enabled: true,
                    projectPath: "\\\\server\\share\\site"
                }
            ]),
            "plugin",
            "\\\\server\\share\\site\\src"
        )).to.equal("present");
    });

    it("uses the highest-precedence applicable Claude plugin scope", () => {
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "user",
                    enabled: true
                },
                {
                    id: "power-pages@power-platform-skills",
                    scope: "local",
                    projectPath: "C:\\selected-site",
                    enabled: false
                }
            ]),
            "plugin",
            "C:\\selected-site\\src"
        )).to.equal("disabled");
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "user",
                    enabled: false
                },
                {
                    id: "power-pages@power-platform-skills",
                    scope: "project",
                    projectPath: "C:\\selected-site",
                    enabled: true
                }
            ]),
            "plugin",
            "C:\\selected-site\\src"
        )).to.equal("present");
    });

    it("preserves Claude plugin scope precedence inside OSC-framed JSON", () => {
        const escape = String.fromCharCode(27);
        const bell = String.fromCharCode(7);
        const output = `${escape}]633;C${bell}${JSON.stringify([
            {
                id: "power-pages@power-platform-skills",
                scope: "user",
                enabled: true
            },
            {
                id: "power-pages@power-platform-skills",
                scope: "local",
                projectPath: "C:\\selected-site",
                enabled: false
            }
        ], null, 2)}${escape}]633;D;0${bell}`;

        expect(classifyAgentHostSetupOutput(
            output,
            "plugin",
            "C:\\selected-site\\src"
        )).to.equal("disabled");
    });

    it("uses the most specific Claude project path within one scope", () => {
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "local",
                    projectPath: "C:\\selected-site",
                    enabled: true
                },
                {
                    id: "power-pages@power-platform-skills",
                    scope: "local",
                    projectPath: "C:\\selected-site\\nested",
                    enabled: false
                }
            ]),
            "plugin",
            "C:\\selected-site\\nested\\src"
        )).to.equal("disabled");
    });

    it("applies Claude project plugins from the main checkout to linked worktrees", () => {
        const commonDirectories = new Map([
            ["C:\\repos\\site", "C:\\repos\\site\\.git"],
            [
                "C:\\repos\\worktrees\\site-feature",
                "C:\\repos\\site\\.git"
            ]
        ]);

        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "project",
                    projectPath: "C:\\repos\\site",
                    enabled: true
                }
            ]),
            "plugin",
            "C:\\repos\\worktrees\\site-feature",
            folderPath => commonDirectories.get(folderPath)
        )).to.equal("present");
    });

    it("treats managed Claude plugins as globally applicable and highest precedence", () => {
        expect(classifyAgentHostSetupOutput(
            JSON.stringify([
                {
                    id: "power-pages@power-platform-skills",
                    scope: "user",
                    enabled: false
                },
                {
                    id: "power-pages@power-platform-skills",
                    scope: "managed",
                    enabled: true
                }
            ]),
            "plugin",
            "C:\\selected-site"
        )).to.equal("present");
    });

    it("returns unknown only for the inventory command that fails", async () => {
        const result = await detectAgentHostSetup(
            AgentHost.Copilot,
            undefined,
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
