import { expect } from "chai";
import { SourceMapValidator } from "../../SourceMapValidator";
import {
    validSourceMapBundle,
    missingSourceMapBundle,
    urlSourceMapBundle,
} from "../helpers";

suite("SourceMapValidator", () => {
    test("should return true if the file contains a source map", () => {
        expect(SourceMapValidator.isValid(validSourceMapBundle)).to.be.true;
    });

    test("should return false if the file does not contain a source map", () => {
        expect(SourceMapValidator.isValid(missingSourceMapBundle)).to.be.false;
    });

    test("should return false if source map is url", () => {
        expect(SourceMapValidator.isValid(urlSourceMapBundle)).to.be.false;
    });
});
