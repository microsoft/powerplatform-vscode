/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";

import { runTests } from "@vscode/test-electron";

async function main() {
    try {
        console.info("###### Starging debugger test");
        // The folder containing the Extension Manifest package.json
        // Passed to `--extensionDevelopmentPath`
        const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
        console.info("###### Resolved extensionDevelopmentPath as {0}", extensionDevelopmentPath);
        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(
            __dirname,
            "./integration/index"
        );
        console.info("###### Resolved extensionTestsPath as {0}", extensionTestsPath);

        // Download VS Code, unzip it and run the integration test
        await runTests({ extensionDevelopmentPath, extensionTestsPath });
    } catch (err) {
        console.error("Failed to run tests");
        process.exit(1);
    }
}

exports.main = main;
