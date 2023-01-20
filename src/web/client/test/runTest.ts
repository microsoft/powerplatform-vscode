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
        const extensionDevelopmentPath = path.resolve(__dirname, "../../../../");

        // The path to test runner
        // Passed to --extensionTestsPath
        const extensionTestsPath = path.resolve(
            __dirname,
            "./integration/index"
        );

        const basedir = path.resolve(__dirname, '../../../../');
        // Download VS Code, unzip it and run the integration test
        await runTests({
           // version: 'insiders',
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                basedir,
                `--extensions-dir=${path.resolve(basedir, 'node_modules/.code-extensions')}`,
                '--disable-extension=ms-vscode.js-debug',
                '--disable-user-env-probe',
                '--disable-workspace-trust',
              ],
        });
    } catch (err) {
        console.error("Failed to run tests");
        process.exit(1);
    }
}

exports.main = main;
