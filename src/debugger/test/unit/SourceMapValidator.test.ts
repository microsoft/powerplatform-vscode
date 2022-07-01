import { expect } from "chai";
import { SourceMapValidator } from "../../SourceMapValidator";

describe("SourceMapValidator", () => {
    it("should return true if the file contains a source map", () => {
        const fileContents =
            "/******//******/ })(); //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9u";
        expect(SourceMapValidator.isValid(fileContents)).to.be.true;
    });

    it("should return false if the file does not contain a source map", () => {
        const fileContents = "/******//******/ })();";
        expect(SourceMapValidator.isValid(fileContents)).to.be.false;
    });

    it("should return false if source map is url", () => {
        const fileContents = "//# sourceMappingURL=main.js.map";
        expect(SourceMapValidator.isValid(fileContents)).to.be.false;
    });
});
