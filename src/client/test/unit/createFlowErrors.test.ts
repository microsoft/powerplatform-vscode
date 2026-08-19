/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    CreateFlowCancellationError,
    describePacFailure,
    isCreateFlowCancellation
} from "../../uriHandler/utils/createFlowErrors";

describe("createFlowErrors", () => {
    describe("CreateFlowCancellationError", () => {
        it("is recognised as an Error and keeps its message", () => {
            const error = new CreateFlowCancellationError("User cancelled environment switch");

            expect(error).to.be.instanceOf(Error);
            expect(error.message).to.equal("User cancelled environment switch");
            expect(error.name).to.equal("CreateFlowCancellationError");
        });

        it("survives instanceof checks after transpilation", () => {
            const error = new CreateFlowCancellationError("cancelled");

            expect(error).to.be.instanceOf(CreateFlowCancellationError);
        });
    });

    describe("isCreateFlowCancellation", () => {
        it("returns true for a cancellation", () => {
            expect(isCreateFlowCancellation(new CreateFlowCancellationError("cancelled"))).to.be.true;
        });

        it("returns false for a genuine failure", () => {
            expect(isCreateFlowCancellation(new Error("environment switch failed"))).to.be.false;
        });

        it("returns false for non-error values", () => {
            expect(isCreateFlowCancellation("cancelled")).to.be.false;
            expect(isCreateFlowCancellation(undefined)).to.be.false;
            expect(isCreateFlowCancellation(null)).to.be.false;
        });
    });

    describe("describePacFailure", () => {
        it("appends the PAC CLI error text to the fallback message", () => {
            const result = describePacFailure("Failed to switch environment.", [
                "No Dataverse organization was found matching the specified criteria."
            ]);

            expect(result).to.equal(
                "Failed to switch environment. No Dataverse organization was found matching the specified criteria."
            );
        });

        it("joins multiple PAC errors", () => {
            const result = describePacFailure("Failed.", ["First problem.", "Second problem."]);

            expect(result).to.equal("Failed. First problem. Second problem.");
        });

        it("returns the fallback message when there is no PAC error text", () => {
            expect(describePacFailure("Failed.")).to.equal("Failed.");
            expect(describePacFailure("Failed.", [])).to.equal("Failed.");
        });

        it("ignores blank PAC error entries", () => {
            const result = describePacFailure("Failed.", ["", "   ", "Real problem."]);

            expect(result).to.equal("Failed. Real problem.");
        });

        it("trims surrounding whitespace on PAC error entries", () => {
            const result = describePacFailure("Failed.", ["  Padded problem.  "]);

            expect(result).to.equal("Failed. Padded problem.");
        });
    });
});
