/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import * as fs from "fs";
import * as os from "os";

import { runTests } from "@vscode/test-electron";

async function main() {
    // VS Code creates IPC sockets under the user-data directory. Keeping that
    // directory in the system temp path avoids macOS Unix socket path limits when
    // tests run from long worktree paths.
    const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "pp-vscode-client-"));

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
          //  version: 'insiders',
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: ['--no-sandbox', '--disable-gpu', `--user-data-dir=${userDataDir}`]
        });
    } catch (err) {
        console.error("Failed to run tests");
        throw err;
    } finally {
        fs.rmSync(userDataDir, { recursive: true, force: true });
    }
}

exports.main = main;
