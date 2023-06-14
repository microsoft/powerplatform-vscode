/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import Mocha from "mocha";
import glob from "glob";
import * as vscode from "vscode";
import NYC from "nyc";

async function addTests(): Promise<void> {
    // Ensure the dev-mode extension is activated
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await vscode.extensions
        .getExtension("microsoft-IsvExpTools.powerplatform-vscode")!
        .activate();
    const nyc = new NYC()
    await nyc.createTempDirectory()
    // Create the mocha test
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
    });

    const testsRoot = path.resolve(__dirname, '..')

    const files: Array<string> = await new Promise((resolve, reject) =>
        glob(
        '**/**.test.js',
        {
            cwd: testsRoot,
        },
        (err, files) => {
            if (err) reject(err)
            else resolve(files)
        }
        )
    )

    // Add files to the test suite
    files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)))

    const failures: number = await new Promise((resolve) => mocha.run(resolve))
    await nyc.writeCoverageFile()

    if (failures > 0) {
        throw new Error(`${failures} tests failed.`)
    }
}

export async function run(): Promise<void> {
    await addTests();
}
