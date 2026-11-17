/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import glob from "glob";

describe("Integration test discovery", () => {
    it("discovers compiled test files in nested directories", async () => {
        const testsRoot = fs.mkdtempSync(path.join(os.tmpdir(), "debugger-test-discovery-"));
        try {
            fs.mkdirSync(path.join(testsRoot, "nested"));
            fs.writeFileSync(path.join(testsRoot, "root.test.js"), "");
            fs.writeFileSync(path.join(testsRoot, "nested", "child.test.js"), "");
            fs.writeFileSync(path.join(testsRoot, "nested", "helper.js"), "");

            const files = await new Promise<string[]>((resolve, reject) => {
                glob("**/**.test.js", { cwd: testsRoot }, (error, matches) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(matches);
                    }
                });
            });

            expect(files.map((file) => path.resolve(testsRoot, file))).to.have.members([
                path.join(testsRoot, "root.test.js"),
                path.join(testsRoot, "nested", "child.test.js"),
            ]);
        } finally {
            fs.rmSync(testsRoot, { recursive: true, force: true });
        }
    });
});
