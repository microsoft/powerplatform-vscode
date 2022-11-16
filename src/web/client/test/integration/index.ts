/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as path from "path";
import Mocha from "mocha";
import glob from "glob";
//import * as vscode from "vscode";

async function addTests(mocha: Mocha, root: string): Promise<void> {
    return new Promise((c, e) => {
        glob("**/**.test.js", { cwd: root }, (err, files) => {
            if (err) {
                return e(err);
            }

            // Add files to the test suite
            files.forEach((f) => mocha.addFile(path.join(root, f)));

            try {
                // Run the mocha test
                mocha.run((failures) => {
                    if (failures > 0) {
                        e(new Error(`${failures} tests failed.`));
                    } else {
                        c();
                    }
                });
            } catch (err) {
                console.error(err);
                e(err);
            }

            c();
        });
    });
}

export async function run(): Promise<void> {
    // Ensure the dev-mode extension is activated
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    // await vscode.extensions
    //     .getExtension("microsoft-IsvExpTools.powerplatform-vscode")!
    //     .activate();

    // Create the mocha test
    const mocha = new Mocha({
        ui: "bdd",
        color: true,
    });

    const testsRoot = path.resolve(__dirname, "..");

    await addTests(mocha, testsRoot);
}
