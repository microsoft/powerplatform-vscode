/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    AgentHostTerminalShellOptions,
    resolveAgentHostTerminalShell
} from "../../uriHandler/utils/agentHostTerminalShell";

describe("agentHostTerminalShell", () => {
    const pwsh = "C:\\Program Files\\PowerShell\\7\\pwsh.exe";
    const bash = "C:\\Program Files\\Git\\bin\\bash.exe";
    const git = "C:\\Program Files\\Git\\cmd\\git.exe";
    const powershell = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
    const options = (...files: string[]): AgentHostTerminalShellOptions => ({
        environment: {},
        isFile: candidate => files.some(file => file.toLowerCase() === candidate.toLowerCase())
    });
    const selected = (shellPath: string) => ({
        commandShellPath: shellPath,
        terminalShellPath: shellPath
    });

    it("selects PowerShell 7 when cmd.exe is the Windows default profile", () => {
        const result = resolveAgentHostTerminalShell(
            "cmd.exe",
            "win32",
            command => command === "pwsh"
                ? "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
                : undefined,
            options(pwsh)
        );

        expect(result).to.deep.equal({
            commandShellPath: "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
            terminalShellPath: "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
        });
    });

    it("selects verified Git Bash from PATH when PowerShell 7 is unavailable", () => {
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", command => command === "bash" ? bash : undefined,
            options(bash, git)
        )).to.deep.equal(selected(bash));
    });

    it("uses PowerShell before Git Bash when both are available", () => {
        expect(resolveAgentHostTerminalShell(
            bash, "win32", command => command === "pwsh" ? pwsh : bash,
            options(pwsh, bash, git)
        )).to.deep.equal(selected(pwsh));
    });

    it("does not use an arbitrary configured default without independent discovery", () => {
        expect(resolveAgentHostTerminalShell(
            pwsh, "win32", () => undefined, options(pwsh)
        )).to.deep.equal(selected(""));
        expect(resolveAgentHostTerminalShell(
            bash, "win32", () => undefined, options(bash, git)
        )).to.deep.equal(selected(""));
    });

    it("does not automatically select a drive-root executable from PATH", () => {
        const executable = "C:\\pwsh.exe";
        expect(resolveAgentHostTerminalShell(
            executable, "win32", () => executable, {
                ...options(executable), environment: { PATH: "C:\\" }
            }
        )).to.deep.equal(selected(""));
        expect(resolveAgentHostTerminalShell(
            executable, "win32", () => executable, {
                ...options(executable), profilePaths: [executable]
            }
        )).to.deep.equal(selected(executable));
    });

    it("finds standard installations when PATH has not refreshed", () => {
        const inputs = {
            ...options(pwsh, bash, git),
            environment: { ProgramFiles: "C:\\Program Files" }
        };
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, inputs
        )).to.deep.equal(selected(pwsh));
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined,
            { ...inputs, ...options(bash, git), environment: inputs.environment }
        )).to.deep.equal(selected(bash));
    });

    it("finds per-user Git for Windows installations", () => {
        const root = "C:\\Users\\maker\\AppData\\Local";
        const executable = `${root}\\Programs\\Git\\usr\\bin\\bash.exe`;
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, {
                ...options(executable, `${root}\\Programs\\Git\\cmd\\git.exe`),
                environment: { LOCALAPPDATA: root }
            }
        )).to.deep.equal(selected(executable));
    });

    it("expands environment variables in configured profile path alternatives", () => {
        const executable = "D:\\Tools\\PowerShell\\pwsh.exe";
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, {
                ...options(executable),
                environment: { TOOLS: "D:\\Tools" },
                profilePaths: ["C:\\missing\\pwsh.exe", "${env:tools}\\PowerShell\\pwsh.exe"]
            }
        )).to.deep.equal(selected(executable));
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, {
                ...options(executable),
                environment: { TOOLS: "D:\\Tools" },
                profilePaths: ["%TOOLS%\\PowerShell\\pwsh.exe"]
            }
        )).to.deep.equal(selected(executable));
    });

    it("validates configured portable Git Bash using its Git executable", () => {
        const executable = "D:\\PortableGit\\usr\\bin\\bash.exe";
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, {
                ...options(executable, "D:\\PortableGit\\mingw64\\bin\\git.exe"),
                profilePaths: [executable]
            }
        )).to.deep.equal(selected(executable));
    });

    it("ignores WSL Bash on PATH and selects installed Git Bash instead", () => {
        const wsl = "C:\\Windows\\System32\\bash.exe";
        expect(resolveAgentHostTerminalShell(
            wsl, "win32", command => command === "bash" ? wsl : undefined, {
                ...options(wsl, bash, git),
                environment: { ProgramFiles: "C:\\Program Files" }
            }
        )).to.deep.equal(selected(bash));
    });

    it("continues through PATH after WSL Bash to a nonstandard Git installation", () => {
        const wsl = "C:\\Windows\\System32\\bash.exe";
        const executable = "D:\\Portable\\usr\\bin\\bash.exe";
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", command => command === "bash" ? wsl : undefined, {
                ...options(wsl, executable, "D:\\Portable\\cmd\\git.exe"),
                environment: { PATH: "C:\\Windows\\System32;D:\\Portable\\usr\\bin" }
            }
        )).to.deep.equal(selected(executable));
    });

    it("discovers Git Bash beside a nonstandard Git executable on PATH", () => {
        const executable = "D:\\Portable\\bin\\bash.exe";
        const gitExecutable = "D:\\Portable\\cmd\\git.exe";
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", command => command === "git.exe" ? gitExecutable : undefined,
            options(executable, gitExecutable)
        )).to.deep.equal(selected(executable));
    });

    it("does not search relative PATH directories", () => {
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, {
                environment: { PATH: ".;relative;C:relative" }, isFile: () => true
            }
        )).to.deep.equal(selected(""));
    });

    for (const candidate of [
        "pwsh", "pwsh.exe", ".\\pwsh.exe", "C:pwsh.exe", "\\pwsh.exe",
        "C:\\fake\\pwsh.cmd", "C:\\fake\\pwsh.exe\n",
        "C:\\${workspaceFolder}\\pwsh.exe", "C:\\%UNKNOWN%\\pwsh.exe",
        "C:\\Windows\\System32\\bash.exe", "C:\\other\\bin\\bash.exe"
    ]) {
        it(`rejects unverified, relative or unsupported candidates: ${JSON.stringify(candidate)}`, () => {
            expect(resolveAgentHostTerminalShell(
                candidate, "win32", () => candidate, {
                    ...options(candidate), profilePaths: [candidate]
                }
            )).to.deep.equal(selected(""));
        });
    }

    it("rejects missing executables even when a lookup or profile reports them", () => {
        expect(resolveAgentHostTerminalShell(
            pwsh, "win32", () => pwsh, { ...options(), profilePaths: [pwsh] }
        )).to.deep.equal(selected(""));
    });

    it("selects installed Windows PowerShell exclusively as a manual quoting fallback", () => {
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, {
                ...options(powershell),
                environment: { SystemRoot: "C:\\Windows" }
            }
        )).to.deep.equal(selected(powershell));
    });

    it("does not assume Windows PowerShell is installed", () => {
        expect(resolveAgentHostTerminalShell(
            "cmd.exe", "win32", () => undefined, {
                ...options(), environment: { SystemRoot: "C:\\Windows" }
            }
        )).to.deep.equal(selected(""));
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

    it("does not probe or override Linux shell profiles", () => {
        expect(resolveAgentHostTerminalShell("/bin/bash", "linux", () => {
            throw new Error("Windows shell discovery must not run");
        })).to.deep.equal({ commandShellPath: "/bin/bash" });
    });
});
