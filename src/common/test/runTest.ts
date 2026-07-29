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
            // Pin to 'stable' rather than 'insiders' so CI runs against a
            // predictable build. 'insiders' pulls whatever was published that
            // day, which historically broke @vscode/test-electron's macOS
            // binary resolution before the resolver was hardened in 3.1.0.
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
