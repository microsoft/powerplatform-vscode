/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    getAgentHostCommandProbeOptions,
    resolveAgentHostTerminalExecutable,
    resolveCommandFromPath,
    runAgentHostCommandProbe
} from "../../uriHandler/utils/agentHostCommandProbe";

describe("agentHostCommandProbe", () => {
    it("uses the Windows command processor only for a resolved command shim", () => {
        expect(getAgentHostCommandProbeOptions(
            5000,
            "C:\\tools\\copilot.cmd",
            "win32"
        )).to.deep.equal({
            cwd: "C:\\tools",
            encoding: "utf8",
            timeout: 5000,
            windowsHide: true,
            shell: true
        });
    });

    it("executes POSIX probes directly", () => {
        expect(getAgentHostCommandProbeOptions(
            5000,
            "/usr/local/bin/claude",
            "linux"
        )).to.deep.equal({
            cwd: "/usr/local/bin",
            encoding: "utf8",
            timeout: 5000,
            windowsHide: true,
            shell: false
        });
    });

    it("resolves commands from PATH without searching the current directory", () => {
        const existingFiles = new Set([
            "C:\\workspace\\copilot.CMD",
            "C:\\tools\\copilot.CMD"
        ]);

        expect(resolveCommandFromPath(
            "copilot",
            "win32",
            "C:\\workspace;C:\\tools",
            ".EXE;.CMD",
            filePath => existingFiles.has(filePath),
            "C:\\workspace"
        )).to.equal("C:\\tools\\copilot.CMD");
    });

    it("prefers the first PATH directory and its PATHEXT order", () => {
        const existingFiles = new Set([
            "C:\\first\\claude.CMD",
            "C:\\second\\claude.EXE"
        ]);

        expect(resolveCommandFromPath(
            "claude",
            "win32",
            "C:\\first;C:\\second",
            ".EXE;.CMD",
            filePath => existingFiles.has(filePath),
            "C:\\workspace"
        )).to.equal("C:\\first\\claude.CMD");
    });

    it("replaces Windows batch shims with a trusted sibling terminal executable", () => {
        const existingFiles = new Set([
            "C:\\Program Files\\Agent Host\\claude.cmd",
            "C:\\Program Files\\Agent Host\\claude.ps1"
        ]);

        expect(resolveAgentHostTerminalExecutable(
            "C:\\Program Files\\Agent Host\\claude.cmd",
            "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
            "win32",
            filePath => existingFiles.has(filePath)
        )).to.equal("C:\\Program Files\\Agent Host\\claude.ps1");
    });

    it("does not use a Windows batch shim when no safe sibling exists", () => {
        expect(resolveAgentHostTerminalExecutable(
            "C:\\tools\\claude.cmd",
            "pwsh.exe",
            "win32",
            () => false
        )).to.be.undefined;
    });

    it("uses an extensionless sibling for a Windows Git Bash terminal", () => {
        const existingFiles = new Set([
            "C:\\tools\\claude.cmd",
            "C:\\tools\\claude"
        ]);

        expect(resolveAgentHostTerminalExecutable(
            "C:\\tools\\claude.cmd",
            "C:\\Program Files\\Git\\bin\\bash.exe",
            "win32",
            filePath => existingFiles.has(filePath)
        )).to.equal("C:\\tools\\claude");
    });

    it("rejects commands or arguments outside the fixed probe contract", async () => {
        let error: Error | undefined;

        try {
            await runAgentHostCommandProbe(
                "copilot",
                ["plugin", "list", "&&", "echo"],
                5000,
                () => "C:\\tools\\copilot.cmd"
            );
        } catch (caught) {
            error = caught as Error;
        }

        expect(error?.message).to.equal("Unsupported agent host probe command");
    });
});
