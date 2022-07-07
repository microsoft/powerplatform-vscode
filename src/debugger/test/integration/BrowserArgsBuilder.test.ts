/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { BrowserArgsBuilder } from "../../browser/BrowserArgsBuilder";

import { expect } from "chai";

describe("BrowserArgsBuilder", () => {
    it("with user data dir undefined", () => {
        const expectedArgs = [
            "--no-first-run",
            "--no-default-browser-check",
            `${BrowserArgsBuilder.debuggingPortArg}=1234`,
        ];
        const args = new BrowserArgsBuilder(1234).build();
        expect(args).to.eql(expectedArgs);
    });

    it("with user data dir defined", () => {
        const expectedArgs = [
            `${BrowserArgsBuilder.userDataDirArg}=/tmp/userDataDir`,
            "--no-first-run",
            "--no-default-browser-check",
            `${BrowserArgsBuilder.debuggingPortArg}=1234`,
        ];
        const args = new BrowserArgsBuilder(1234, "/tmp/userDataDir").build();
        expect(args).to.eql(expectedArgs);
    });
});
