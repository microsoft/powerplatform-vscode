/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import { expect } from "chai";
import * as fs from "fs";
import * as path from "path";
import { generateDiffReport } from "../../../../power-pages/metadata-diff/MetadataDiffUtils";

// Simple helper to create temp folder structure
function makeTempDir(): string {
    const dir = fs.mkdtempSync(path.join(process.cwd(), "mdiff-util-test-"));
    return dir;
}

describe("MetadataDiffUtils.generateDiffReport", () => {
    it("escapes HTML special chars and sanitizes class names", async () => {
        const workspace = makeTempDir();
        const storageRoot = makeTempDir();
        // Simulate downloaded folder structure: storageRoot/siteA/
        const siteDir = path.join(storageRoot, "siteA");
        fs.mkdirSync(siteDir, { recursive: true });

        // File present in workspace only (attempt injection via filename / contents is not used in class)
        fs.writeFileSync(path.join(workspace, 'onlyLocal.txt'), 'local');
        // File present in storage only
        fs.writeFileSync(path.join(siteDir, 'onlyRemote.txt'), 'remote');
    // Modified file with differing content
    fs.writeFileSync(path.join(workspace, 'mod.html'), '<div>local & update</div>');
    fs.writeFileSync(path.join(siteDir, 'mod.html'), '<div>remote & update</div>');

        const html = await generateDiffReport(workspace, storageRoot);
    // Ensure potentially unsafe characters from content are escaped (should not appear raw)
    expect(html).to.not.contain('<div>local & update</div>');
    expect(html).to.not.contain('<div>remote & update</div>');
        // Class names should be canonical; no raw 'only-in-local' transformation injection beyond whitelist
        expect(html).to.match(/file-item only-in-local/);
        expect(html).to.match(/file-item only-in-environment/);
        expect(html).to.match(/file-item modified/);
        // Should not contain unescaped quotes in attributes leading to potential breakouts
        expect(html).to.not.contain('class="file-item modified""');
    });
});
