/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import {
    removeTrailingSlash,
    replaceWorkSpaceFolderPlaceholder,
} from "../../utils";

describe("utils", () => {
    describe("removeTrailingSlash", () => {
        it("should remove a '/' from the end of the specified string if it exists", () => {
            expect(removeTrailingSlash("/")).to.equal("");
            expect(removeTrailingSlash("test/")).to.equal("test");
            expect(removeTrailingSlash("test.com/path/test/")).to.equal(
                "test.com/path/test"
            );
        });

        it("should not remove slashes in the beginning", () => {
            expect(removeTrailingSlash("/test/test")).to.equal("/test/test");
        });
    });

    describe("replaceWorkSpaceFolderPlaceholder", () => {
        it("should handle empty string", () => {
            expect(replaceWorkSpaceFolderPlaceholder("")).to.equal("");
        });

        it("should handle string without placeholder", () => {
            expect(replaceWorkSpaceFolderPlaceholder("test")).to.equal("test");
        });
        it("should replace the workspaceFolder placeholder in a specified path", () => {
            expect(
                replaceWorkSpaceFolderPlaceholder("${workspaceFolder}/test")
            ).to.equal("test");
            expect(
                replaceWorkSpaceFolderPlaceholder("${workspaceFolder}/test/")
            ).to.equal("test/");
            expect(
                replaceWorkSpaceFolderPlaceholder(
                    "${workspaceFolder}/test/test"
                )
            ).to.equal("test/test");
        });
    });
});
