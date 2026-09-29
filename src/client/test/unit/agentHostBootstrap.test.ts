/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    getAgentHostInstallCommand,
    resolveAgentHostBootstrap
} from "../../uriHandler/utils/agentHostBootstrap";
import { AgentHost } from "../../uriHandler/utils/detectAgentHost";

describe("resolveAgentHostBootstrap", () => {
    const availability = (...commands: string[]) => (command: string): boolean =>
        commands.includes(command);
    const pwsh = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
    const shellOptions = {
        environment: {},
        isFile: (candidate: string) => candidate === pwsh
    };

    it("uses winget and PowerShell on Windows", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Copilot,
            "win32",
            availability("winget"),
            shellOptions,
            command => command === "pwsh" ? pwsh : undefined
        )).to.deep.equal({
            supported: true,
            config: {
                platform: "win32",
                installer: "winget",
                shellPath: pwsh
            }
        });
    });

    it("rejects legacy Windows PowerShell when PowerShell 7 is unavailable", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude,
            "win32",
            availability("powershell", "winget"),
            shellOptions,
            () => undefined
        )).to.deep.equal({
            supported: false,
            reason: "missingPowerShell"
        });
    });

    it("uses installed PowerShell outside PATH for winget bootstrap", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude, "win32", availability("winget"),
            { ...shellOptions, environment: { ProgramFiles: "C:\\Program Files" } },
            () => undefined
        )).to.deep.equal({
            supported: true,
            config: { platform: "win32", installer: "winget", shellPath: pwsh }
        });
    });

    it("uses validated configured PowerShell profile paths for bootstrap", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude, "win32", availability("winget"),
            { ...shellOptions, profilePaths: [pwsh] }, () => undefined
        )).to.deep.equal({
            supported: true,
            config: { platform: "win32", installer: "winget", shellPath: pwsh }
        });
    });

    it("never substitutes Git Bash for the PowerShell-specific winget flow", () => {
        const bash = "C:\\Program Files\\Git\\bin\\bash.exe";
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude, "win32", availability("bash", "winget"),
            { environment: {}, profilePaths: [bash], isFile: () => true },
            command => command === "bash" ? bash : undefined
        )).to.deep.equal({ supported: false, reason: "missingPowerShell" });
    });

    it("still requires winget when PowerShell is installed", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Copilot, "win32", availability(),
            { ...shellOptions, profilePaths: [pwsh] }, () => undefined
        )).to.deep.equal({ supported: false, reason: "missingWinget" });
    });

    it("prefers Homebrew on macOS and falls back to the official script", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude,
            "darwin",
            availability("bash", "brew", "curl")
        )).to.deep.include({
            supported: true,
            config: {
                platform: "darwin",
                installer: "brew",
                shellPath: "bash"
            }
        });
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude,
            "darwin",
            availability("bash", "curl")
        )).to.deep.include({
            supported: true,
            config: {
                platform: "darwin",
                installer: "script",
                shellPath: "bash"
            }
        });
    });

    it("requires bash and curl on Linux", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Copilot,
            "linux",
            availability("bash")
        )).to.deep.equal({
            supported: false,
            reason: "missingInstaller"
        });
    });

    it("uses the official host package for each installer", () => {
        expect(getAgentHostInstallCommand(AgentHost.Claude, {
            platform: "win32",
            installer: "winget",
            shellPath: "pwsh"
        })).to.contain("Anthropic.ClaudeCode");
        expect(getAgentHostInstallCommand(AgentHost.Copilot, {
            platform: "darwin",
            installer: "brew",
            shellPath: "bash"
        })).to.equal("brew install --cask copilot-cli");
        expect(getAgentHostInstallCommand(AgentHost.Copilot, {
            platform: "linux",
            installer: "script",
            shellPath: "bash"
        })).to.equal("curl -fsSL https://gh.io/copilot-install | bash");
    });
});
