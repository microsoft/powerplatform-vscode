import { BrowserArgsBuilder } from "../../browser/BrowserArgsBuilder";

import { expect } from "chai";

describe("BrowserArgsBuilder", () => {
    describe("should build args", () => {
        it("with user data dir undefined", () => {
            const args = new BrowserArgsBuilder(1234).build();
            expect(args).equal([
                "--no-first-run",
                "--no-default-browser-check",
                `${BrowserArgsBuilder.debuggingPortArg}=1234`,
            ]);
        });
    });
});
