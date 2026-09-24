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
                kind: "checkMarketplace",
                commandLine: "copilot plugin marketplace list",
                description: "check marketplace",
                setupCheck: "marketplace"
            },
            {
                kind: "checkPlugin",
                commandLine: "copilot plugin list",
                description: "check plugin",
                setupCheck: "plugin"
            },
            {
                kind: "registerMarketplace",
                commandLine: 'copilot plugin marketplace add "microsoft/power-platform-skills"',
                description: "register",
                runWhenSetupState: {
                    component: "marketplace",
                    states: ["missing", "unknown"]
                }
            },
            {
                kind: "installPlugin",
                commandLine: 'copilot plugin install "power-pages@power-platform-skills"',
                description: "install",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["missing", "unknown"]
                }
            },
            {
                kind: "enablePlugin",
                commandLine: 'copilot plugin enable "power-pages@power-platform-skills"',
                description: "enable plugin",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["disabled"]
                }
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
                kind: "checkMarketplace",
                commandLine: "claude plugin marketplace list --json",
                description: "check marketplace",
                setupCheck: "marketplace"
            },
            {
                kind: "checkPlugin",
                commandLine: "claude plugin list --json",
                description: "check plugin",
                setupCheck: "plugin"
            },
            {
                kind: "registerMarketplace",
                commandLine: 'claude plugin marketplace add "microsoft/power-platform-skills"',
                description: "register",
                runWhenSetupState: {
                    component: "marketplace",
                    states: ["missing", "unknown"]
                }
            },
            {
                kind: "installPlugin",
                commandLine: 'claude plugin install "power-pages@power-platform-skills" --scope user',
                description: "install user scope",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["missing", "unknown"]
                }
            },
            {
                kind: "enablePlugin",
                commandLine: 'claude plugin enable "power-pages@power-platform-skills"',
                description: "enable plugin",
                runWhenSetupState: {
                    component: "plugin",
                    states: ["disabled"]
                }
            },
            {
                kind: "launchHost",
                commandLine: 'claude --permission-mode auto "/power-pages:create-site Create a Power Pages site"',
                executable: "claude",
                args: [
                    "--permission-mode",
                    "auto",
                    "/power-pages:create-site Create a Power Pages site"
                ],
                description: "start Claude Code"
            }
        ]);
    });

    it("substitutes the host display name into the launch description", () => {
        const plan = buildAgentHostCommandPlan(AgentHost.Copilot, "My Host", strings);

        expect(plan[5].description).to.equal("start My Host");
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
            'claude plugin enable "power-pages@power-platform-skills"'
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

    it("launches Claude in auto permission mode with the maker prompt", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Claude,
            "Claude Code",
            strings,
            undefined,
            {
                marketplace: "present",
                plugin: "present"
            },
            "A customer support portal"
        );
        const launch = plan[0];

        expect(launch.commandLine).to.equal(
            'claude --permission-mode auto "/power-pages:create-site A customer support portal"'
        );
        expect(launch.executable).to.equal("claude");
        expect(launch.args).to.deep.equal([
            "--permission-mode",
            "auto",
            "/power-pages:create-site A customer support portal"
        ]);
    });

    it("normalizes multiline input and renders the preview for the execution shell", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            strings,
            undefined,
            {
                marketplace: "present",
                plugin: "present"
            },
            "A volunteer portal\nwith\tevent signup and a donor's dashboard",
            "bash"
        );
        const launch = plan[0];

        expect(launch.commandLine).to.equal(
            `copilot '-i' '/power-pages:create-site A volunteer portal with event signup and a donor'"'"'s dashboard'`
        );
        expect(launch.args).to.deep.equal([
            "-i",
            "/power-pages:create-site A volunteer portal with event signup and a donor's dashboard"
        ]);
    });

    it("builds a non-executable preview without throwing for an unsupported shell", () => {
        const plan = buildAgentHostCommandPlan(
            AgentHost.Copilot,
            "GitHub Copilot CLI",
            strings,
            undefined,
            {
                marketplace: "present",
                plugin: "present"
            },
            "A customer portal",
            "cmd.exe"
        );

        expect(plan[0].commandLine).to.equal(
            'copilot -i "/power-pages:create-site A customer portal"'
        );
    });

    it("uses the resolved host executable for setup and launch commands", () => {
        const executablePath = "C:\\Program Files\\Agent Host\\claude.cmd";
        const plan = buildAgentHostCommandPlan(
            AgentHost.Claude,
            "Claude Code",
            strings,
            undefined,
            {
                marketplace: "missing",
                plugin: "missing"
            },
            "A customer portal",
            "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
            executablePath,
            "win32"
        );

        expect(plan.map(command => command.commandLine)).to.deep.equal([
            "& 'C:\\Program Files\\Agent Host\\claude.cmd' 'plugin' 'marketplace' 'add' 'microsoft/power-platform-skills'",
            "& 'C:\\Program Files\\Agent Host\\claude.cmd' 'plugin' 'install' 'power-pages@power-platform-skills' '--scope' 'user'",
            "& 'C:\\Program Files\\Agent Host\\claude.cmd' '--permission-mode' 'auto' '/power-pages:create-site A customer portal'"
        ]);
        expect(plan[2].executable).to.equal(executablePath);
    });
});
