/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    buildAgentHostShellCommand,
    isAgentHostExecutableSupported,
    isAgentHostShellIntegrationSupported,
    isAgentHostShellSupported
} from "../../uriHandler/utils/agentHostShellCommand";

describe("agentHostShellCommand", () => {
    it("distinguishes argument quoting from Windows Shell Integration support", () => {
        expect(isAgentHostShellSupported("powershell.exe")).to.be.true;
        expect(isAgentHostShellIntegrationSupported("powershell.exe", "win32")).to.be.false;
        expect(isAgentHostShellIntegrationSupported("pwsh.exe", "win32")).to.be.true;
        expect(isAgentHostShellIntegrationSupported("bash.exe", "win32")).to.be.true;
    });

    it("accepts VS Code supported POSIX shell families", () => {
        expect(isAgentHostShellIntegrationSupported("/bin/bash", "linux")).to.be.true;
        expect(isAgentHostShellIntegrationSupported("/bin/zsh", "darwin")).to.be.true;
        expect(isAgentHostShellIntegrationSupported("/usr/bin/fish", "linux")).to.be.true;
        expect(isAgentHostShellIntegrationSupported("/bin/sh", "linux")).to.be.false;
    });

    it("rejects Windows batch shims for untrusted launch arguments", () => {
        expect(isAgentHostExecutableSupported(
            "C:\\tools\\copilot.cmd",
            "win32"
        )).to.be.false;
        expect(isAgentHostExecutableSupported(
            "C:\\tools\\copilot.ps1",
            "win32"
        )).to.be.true;
        expect(isAgentHostExecutableSupported(
            "/usr/local/bin/copilot",
            "linux"
        )).to.be.true;
    });

    it("normalizes a Windows executable path for Git Bash", () => {
        expect(buildAgentHostShellCommand(
            "C:\\tools\\claude",
            ["prompt value"],
            "C:\\Program Files\\Git\\bin\\bash.exe",
            "win32"
        )).to.equal("'C:/tools/claude' 'prompt value'");
    });
});
