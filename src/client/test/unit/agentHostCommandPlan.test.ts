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
        installHost: "install {0}",
        refreshPath: "refresh path",
        verifyHost: "verify {0}",
        checkMarketplace: "check marketplace",
        checkPlugin: "check plugin",
        registerMarketplace: "register",
        installPlugin: "install",
        installPluginUserScope: "install user scope",
        enablePlugin: "enable plugin",
        launchHost: "start {0}"
    };

    it("builds the Copilot plan with marketplace, install, and interactive prompt", () => {
        const plan = buildAgentHostCommandPlan(AgentHost.Copilot, "GitHub Copilot CLI", strings);

        expect(plan).to.deep.equal([
            {
                kind: "registerMarketplace",
                commandLine: 'copilot plugin marketplace add "microsoft/power-platform-skills"',
                description: "register"
            },
            {
                kind: "installPlugin",
                commandLine: 'copilot plugin install "power-pages@power-platform-skills"',
                description: "install"
            },
            {
                kind: "launchHost",
                commandLine: 'copilot -i "/power-pages:create-site Create a Power Pages site"',
                executable: "copilot",
                args: [
                    "-i",
                    "/power-pages:create-site Create a Power Pages site"
                ],
                description: "start GitHub Copilot CLI"
            }
        ]);
    });

    it("builds the Claude plan with user-scope install and a bare prompt launch", () => {
        const plan = buildAgentHostCommandPlan(AgentHost.Claude, "Claude Code", strings);

        expect(plan).to.deep.equal([
            {
                kind: "registerMarketplace",
                commandLine: 'claude plugin marketplace add "microsoft/power-platform-skills"',
                description: "register"
            },
            {
                kind: "installPlugin",
                commandLine: 'claude plugin install "power-pages@power-platform-skills" --scope user',
                description: "install user scope"
            },
            {
                kind: "launchHost",
                commandLine: 'claude "/power-pages:create-site Create a Power Pages site"',
                executable: "claude",
                args: [
                    "/power-pages:create-site Create a Power Pages site"
                ],
                description: "start Claude Code"
            }
        ]);
    });

    it("substitutes the host display name into the launch description", () => {
        const plan = buildAgentHostCommandPlan(AgentHost.Copilot, "My Host", strings);

        expect(plan[2].description).to.equal("start My Host");
    });

    it("prepends Windows installation, PATH refresh, and verification for missing Copilot CLI", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            strings,
            {
                platform: "win32",
                installer: "winget",
                shellPath: "pwsh"
            }
        );

        expect(plan.slice(0, 3)).to.deep.equal([
            {
                kind: "installHost",
                commandLine: "winget install --id GitHub.Copilot --exact --accept-package-agreements --accept-source-agreements",
                description: "install GitHub Copilot CLI"
            },
            {
                kind: "refreshPath",
                commandLine: '$env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User") + ";" + $env:Path',
                description: "refresh path"
            },
            {
                kind: "verifyHost",
                commandLine: "copilot --version",
                description: "verify GitHub Copilot CLI"
            }
        ]);
        expect(plan.map(command => command.kind)).to.deep.equal([
            "installHost",
            "refreshPath",
            "verifyHost",
            "checkMarketplace",
            "checkPlugin",
            "registerMarketplace",
            "installPlugin",
            "enablePlugin",
            "launchHost"
        ]);
    });

    it("uses the official Linux installer for missing Claude Code", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Claude,
            "Claude Code",
            strings,
            {
                platform: "linux",
                installer: "script",
                shellPath: "bash"
            }
        );

        expect(plan[0]).to.deep.equal({
            kind: "installHost",
            commandLine: "curl -fsSL https://claude.ai/install.sh | bash",
            description: "install Claude Code"
        });
        expect(plan[1].commandLine).to.equal('export PATH="$HOME/.local/bin:$PATH"; hash -r');
        expect(plan[2].commandLine).to.equal("claude --version");
    });

    it("skips marketplace and plugin setup when both are already present", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            strings,
            undefined,
            {
                marketplace: "present",
                plugin: "present"
            }
        );

        expect(plan.map(command => command.kind)).to.deep.equal(["launchHost"]);
    });

    it("installs only the missing setup component", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Claude,
            "Claude Code",
            strings,
            undefined,
            {
                marketplace: "present",
                plugin: "missing"
            }
        );

        expect(plan.map(command => command.kind)).to.deep.equal([
            "installPlugin",
            "launchHost"
        ]);
    });

    it("enables an installed but disabled plugin instead of reinstalling it", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Claude,
            "Claude Code",
            strings,
            undefined,
            {
                marketplace: "present",
                plugin: "disabled"
            }
        );

        expect(plan.map(command => command.kind)).to.deep.equal([
            "enablePlugin",
            "launchHost"
        ]);
        expect(plan[0].commandLine).to.equal(
            'claude plugin enable "power-pages@power-platform-skills" --scope user'
        );
    });

    it("passes the maker prompt to the create-site skill without shell interpolation", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            strings,
            undefined,
            {
                marketplace: "present",
                plugin: "present"
            },
            'A volunteer portal with "Event signup" and donations'
        );
        const launch = plan[0];

        expect(launch.commandLine).to.equal(
            'copilot -i "/power-pages:create-site A volunteer portal with \\"Event signup\\" and donations"'
        );
        expect(launch.executable).to.equal("copilot");
        expect(launch.args).to.deep.equal([
            "-i",
            '/power-pages:create-site A volunteer portal with "Event signup" and donations'
        ]);
    });
});
