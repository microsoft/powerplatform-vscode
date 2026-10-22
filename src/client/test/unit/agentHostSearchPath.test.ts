/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    appendSearchPathEntries,
    expandWindowsEnvironmentVariables,
    getEnvironmentValue,
    parseRegistryPathValue,
    resolveAgentHostSearchPath
} from "../../uriHandler/utils/agentHostSearchPath";

describe("agentHostSearchPath", () => {
    describe("getEnvironmentValue", () => {
        it("reads Windows variables case-insensitively", () => {
            expect(getEnvironmentValue({ Path: "C:\\bin" }, "PATH", "win32")).to.equal("C:\\bin");
        });

        it("reads POSIX variables case-sensitively", () => {
            expect(getEnvironmentValue({ Path: "/bin" }, "PATH", "linux")).to.equal(undefined);
        });
    });

    describe("parseRegistryPathValue", () => {
        it("extracts expandable and plain registry Path values", () => {
            expect(parseRegistryPathValue(
                "\r\nHKEY_CURRENT_USER\\Environment\r\n    Path    REG_EXPAND_SZ    %USERPROFILE%\\bin;C:\\Tools\r\n\r\n"
            )).to.equal("%USERPROFILE%\\bin;C:\\Tools");
            expect(parseRegistryPathValue("    Path    REG_SZ    C:\\Windows")).to.equal("C:\\Windows");
        });

        it("returns undefined when the value is absent", () => {
            expect(parseRegistryPathValue("ERROR: The system was unable to find the specified registry key")).to.equal(undefined);
        });
    });

    describe("expandWindowsEnvironmentVariables", () => {
        it("expands known variables and preserves unknown ones", () => {
            expect(expandWindowsEnvironmentVariables(
                "%LOCALAPPDATA%\\Bin;%MISSING%\\Bin",
                { localappdata: "C:\\Users\\maker\\AppData\\Local" }
            )).to.equal("C:\\Users\\maker\\AppData\\Local\\Bin;%MISSING%\\Bin");
        });
    });

    describe("appendSearchPathEntries", () => {
        it("keeps current entries first and appends only new absolute directories", () => {
            expect(appendSearchPathEntries(
                "C:\\Windows;C:\\Tools",
                ["c:\\tools\\", "relative", "%MISSING%\\bin", "D:\\Agent", "D:\\Agent"],
                "win32"
            )).to.equal("C:\\Windows;C:\\Tools;D:\\Agent");
        });

        it("returns the current path unchanged when nothing is added", () => {
            expect(appendSearchPathEntries("/usr/bin", ["/usr/bin/"], "linux")).to.equal("/usr/bin");
        });

        it("treats POSIX directories case-sensitively", () => {
            expect(appendSearchPathEntries("/opt/Bin", ["/opt/bin"], "darwin")).to.equal("/opt/Bin:/opt/bin");
        });
    });

    describe("resolveAgentHostSearchPath", () => {
        it("appends persisted Windows registry paths and winget link directories", async () => {
            const keys: string[] = [];
            const searchPath = await resolveAgentHostSearchPath(
                "win32",
                {
                    Path: "C:\\Windows",
                    LOCALAPPDATA: "C:\\Users\\maker\\AppData\\Local",
                    ProgramFiles: "C:\\Program Files"
                },
                key => {
                    keys.push(key);
                    return Promise.resolve(key.startsWith("HKLM")
                        ? "C:\\Windows;C:\\Machine"
                        : "%LOCALAPPDATA%\\Programs\\Agent");
                }
            );

            expect(keys).to.have.length(2);
            expect(searchPath).to.equal([
                "C:\\Windows",
                "C:\\Machine",
                "C:\\Users\\maker\\AppData\\Local\\Programs\\Agent",
                "C:\\Users\\maker\\AppData\\Local\\Microsoft\\WinGet\\Links",
                "C:\\Program Files\\WinGet\\Links"
            ].join(";"));
        });

        it("ignores registry read failures", async () => {
            expect(await resolveAgentHostSearchPath(
                "win32",
                { PATH: "C:\\Windows" },
                () => Promise.reject(new Error("denied"))
            )).to.equal("C:\\Windows");
        });

        it("appends the official installer directory on POSIX", async () => {
            expect(await resolveAgentHostSearchPath(
                "linux",
                { PATH: "/usr/bin", HOME: "/home/maker" },
                () => Promise.reject(new Error("unused"))
            )).to.equal("/usr/bin:/home/maker/.local/bin");
        });
    });
});
