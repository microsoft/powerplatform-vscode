import { expect } from "chai";
import { SourceMapValidator } from "../../SourceMapValidator";
import {
    validSourceMapBundle,
    missingSourceMapBundle,
    urlSourceMapBundle,
} from "../helpers";

describe("SourceMapValidator", () => {
    it("should return true if the file contains a source map", () => {
        expect(SourceMapValidator.isValid(validSourceMapBundle)).to.be.true;
    });

    it("should return false if the file does not contain a source map", () => {
        expect(SourceMapValidator.isValid(missingSourceMapBundle)).to.be.false;
    });

    it("should return false if source map is url", () => {
        expect(SourceMapValidator.isValid(urlSourceMapBundle)).to.be.false;
    });
});
