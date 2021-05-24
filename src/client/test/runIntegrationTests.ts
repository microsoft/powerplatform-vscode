// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as path from 'path';

import { runTests } from 'vscode-test';

async function runAllIntegrationTests() {
    try {
        // point to the extension's manifest, i.e. package.json in the repo root:
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');

        // point to folder with all test cases:
        const extensionTestsPath = path.resolve(__dirname, 'integration');

        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [ '--disable-extensions' ]
         });
    } catch (err) {
        console.error('Failed to run INTEGRATION tests');
        process.exit(1);
    }
}

runAllIntegrationTests();
