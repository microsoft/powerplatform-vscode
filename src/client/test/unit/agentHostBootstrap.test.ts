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

    it("uses winget and PowerShell on Windows", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Copilot,
            "win32",
            availability("pwsh", "winget")
        )).to.deep.equal({
            supported: true,
            config: {
                platform: "win32",
                installer: "winget",
                shellPath: "pwsh"
            }
        });
    });

    it("uses built-in Windows PowerShell when PowerShell 7 is unavailable", () => {
        expect(resolveAgentHostBootstrap(
            AgentHost.Claude,
            "win32",
            availability("powershell", "winget")
        )).to.deep.equal({
            supported: true,
            config: {
                platform: "win32",
                installer: "winget",
                shellPath: "powershell"
            }
        });
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
