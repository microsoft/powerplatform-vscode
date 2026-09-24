/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { resolveAgentHostTerminalShell } from "../../uriHandler/utils/agentHostTerminalShell";

describe("agentHostTerminalShell", () => {
    it("selects PowerShell 7 when cmd.exe is the Windows default profile", () => {
        const result = resolveAgentHostTerminalShell(
            "cmd.exe",
            "win32",
            command => command === "pwsh"
                ? "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
                : undefined
        );

        expect(result).to.deep.equal({
            commandShellPath: "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
            terminalShellPath: "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
        });
    });

    it("retains the configured Windows profile when PowerShell 7 is unavailable", () => {
        const result = resolveAgentHostTerminalShell(
            "bash.exe",
            "win32",
            () => undefined
        );

        expect(result).to.deep.equal({
            commandShellPath: "bash.exe"
        });
    });

    it("retains the complete configured profile on non-Windows platforms", () => {
        const result = resolveAgentHostTerminalShell(
            "/bin/zsh",
            "darwin",
            () => "/usr/bin/pwsh"
        );

        expect(result).to.deep.equal({
            commandShellPath: "/bin/zsh"
        });
    });
});
