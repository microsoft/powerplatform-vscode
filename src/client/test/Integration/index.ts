/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import Mocha from "mocha";
import glob from "glob";
import * as vscode from "vscode";

async function addTests(): Promise<void> {
    // Ensure the dev-mode extension is activated
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await vscode.extensions
        .getExtension("microsoft-IsvExpTools.powerplatform-vscode")!
        .activate();

    // Create the mocha test
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
    });

    const testsRoot = path.resolve(__dirname, "..");
    console.log("testsRoot", testsRoot);

    return new Promise((resolve, reject) => {
        glob("**/integration/**/**.test.js", { cwd: testsRoot }, (err, files) => {
            if (err) {
                return reject(err);
            }

            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));
            console.log("extensionDevelopmentPath", files);

            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        reject(new Error(`${failures} tests failed.`));
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                console.error(err);
                reject(err);
            }
        });
    });
}

export async function run(): Promise<void> {
    await addTests();
}
