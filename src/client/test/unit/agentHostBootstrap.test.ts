/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    getAgentHostInstallCommand,
    getAgentHostInstallInvocation,
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

    it("falls back to Windows PowerShell when PowerShell 7 is unavailable", () => {
        const windowsPowerShell = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude,
            "win32",
            availability("winget"),
            {
                environment: { SystemRoot: "C:\\Windows" },
                isFile: candidate => candidate === windowsPowerShell
            },
            () => undefined
        )).to.deep.equal({
            supported: true,
            config: { platform: "win32", installer: "winget", shellPath: windowsPowerShell }
        });
    });

    it("does not require any PowerShell installation to bootstrap with winget", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude,
            "win32",
            availability("winget"),
            shellOptions,
            () => undefined
        )).to.deep.equal({
            supported: true,
            config: { platform: "win32", installer: "winget", shellPath: "powershell.exe" }
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

    it("never substitutes Git Bash for the PowerShell-specific winget preview", () => {
        const bash = "C:\\Program Files\\Git\\bin\\bash.exe";
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude, "win32", availability("bash", "winget"),
            { environment: {}, profilePaths: [bash], isFile: () => true },
            command => command === "bash" ? bash : undefined
        )).to.deep.equal({
            supported: true,
            config: { platform: "win32", installer: "winget", shellPath: "powershell.exe" }
        });
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

    it("builds shell-free installer invocations that match the previewed commands", () => {
        expect(getAgentHostInstallInvocation(AgentHost.Copilot, {
            platform: "win32",
            installer: "winget",
            shellPath: "powershell.exe"
        })).to.deep.equal({
            executable: "winget",
            args: [
                "install",
                "--id",
                "GitHub.Copilot",
                "--exact",
                "--accept-package-agreements",
                "--accept-source-agreements"
            ]
        });
        expect(getAgentHostInstallInvocation(AgentHost.Claude, {
            platform: "darwin",
            installer: "brew",
            shellPath: "bash"
        })).to.deep.equal({ executable: "brew", args: ["install", "--cask", "claude-code"] });
        expect(getAgentHostInstallInvocation(AgentHost.Claude, {
            platform: "linux",
            installer: "script",
            shellPath: "bash"
        })).to.deep.equal({
            executable: "bash",
            args: ["-o", "pipefail", "-c", "curl -fsSL https://claude.ai/install.sh | bash"]
        });
        expect(getAgentHostInstallCommand(AgentHost.Claude, {
            platform: "win32",
            installer: "winget",
            shellPath: "pwsh"
        })).to.equal(
            "winget install --id Anthropic.ClaudeCode --exact --accept-package-agreements --accept-source-agreements"
        );
    });
});
