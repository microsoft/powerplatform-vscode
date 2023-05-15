/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import { SourceMapValidator } from "../../SourceMapValidator";

export const validSourceMapBundle =
    "/******//******/ })(); //# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9u";
export const missingSourceMapBundle = "/******//******/ })();";
export const urlSourceMapBundle = "//# sourceMappingURL=main.js.map";

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
