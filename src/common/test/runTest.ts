/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";

import { runTests } from "@vscode/test-electron";

async function main() {
    try {
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, "../../../");

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(
            __dirname,
            "./integration/index"
        );

        // Download VS Code, unzip it and run the integration test
        await runTests({
            // Pin to 'stable' rather than 'insiders'. 'insiders' always pulls the
            // latest Insiders build at run time; a change to its macOS app-bundle
            // layout breaks @vscode/test-electron's binary resolution (spawn ENOENT).
            version: 'stable',
            extensionDevelopmentPath,
            extensionTestsPath
        });
    } catch (err) {
        console.error("Failed to run tests");
        process.exit(1);
    }
}

exports.main = main;
