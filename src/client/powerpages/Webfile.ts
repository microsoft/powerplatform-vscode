/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as nls from "vscode-nls";
nls.config({
    messageFormat: nls.MessageFormat.bundle,
    bundleFormat: nls.BundleFormat.standalone,
})();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import * as vscode from "vscode";
import { getParentPagePaths, isNullOrEmpty } from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { Context } from "@microsoft/generator-powerpages/generators/context";
import { MultiStepInput } from "./utils/MultiStepInput";
import { Tables, yoPath } from "./constants";
import DesktopFS from "./utils/DesktopFS";
import { exec } from "child_process";


// function getPaths(pages: Map<string, any>): {
//     paths: Array<string>;
//     pathsMap: Map<string, string>;
// } {
//     if (pages.size === 0) {
//         return { paths: [], pathsMap: new Map() };
//     }
//     const paths: Array<string> = [];
//     const pathsMap: Map<string, string> = new Map();
//     // eslint-disable-next-line prefer-const
//     for (let [webpageid, page] of pages) {
//         if (!page.adx_name || !webpageid) {
//             continue;
//         }
//         let path = page.adx_name;

//         // If the page is a home page, add it to the paths array
//         if (!page.adx_parentpageid && page.adx_partialurl === "/") {
//             paths.push(path);
//             pathsMap.set(webpageid, path);
//             continue;
//         }
//         let prevPage = null;
//         while (page.adx_parentpageid) {
//             if (!pages.has(page.adx_parentpageid)) {
//                 break;
//             }
//             // to check for circular reference
//             if (prevPage === page) {
//                 break;
//             }
//             prevPage = page;
//             page = pages.get(page.adx_parentpageid);
//             path = `${page.adx_name}/${path}`;
//         }
//         if (paths.indexOf(path) === -1) {
//             paths.push(path);
//             pathsMap.set(path, webpageid);
//         }
//     }
//     paths.sort();
//     return { paths, pathsMap };
// }

export const createWebfile = async () => {
    // Get the root directory of the workspace
    const rootDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!rootDir) {
        throw new Error("Root directory not found");
    }

    // Get the web templates from the data directory
    const portalDir = `${rootDir}`;
    const fs: DesktopFS = new DesktopFS();
    const ctx = Context.getInstance(portalDir, fs);
    try {
        await ctx?.init([Tables.WEBPAGE, Tables.PAGETEMPLATE]);
    } catch (error) {
        vscode.window.showErrorMessage("Error while loading data: " + error);
        return;
    }
    const { paths, pathsMap} = getParentPagePaths(ctx);

    if (paths.length === 0) {
        vscode.window.showErrorMessage("No parent pages found");
        return;
    }

    // Show a quick pick to enter name select the web template
    const webfileInputs = await getWebfileInputs(paths);

    const parentPageId = pathsMap.get(webfileInputs.id);

    if (!isNullOrEmpty(parentPageId)) {
        const openDialogOptions = { canSelectMany: true };
        const selectedFiles = await vscode.window.showOpenDialog(
            openDialogOptions
        );

        const yoWebfileSubGenerator = "@microsoft/powerpages:webfile";
        const webfileCount = selectedFiles?.length;




        if (selectedFiles) {
            vscode.window
            .withProgress(
                {
                    location: vscode.ProgressLocation.Notification,
                    title: `Adding ${webfileCount} web files...`,
                },
                () => {

                    for (let i = 0; i < selectedFiles.length - 1; i++) {
                        const file = selectedFiles[i];
                        const webfilePath = file.fsPath;
                        const command = `${yoPath} ${yoWebfileSubGenerator} "${webfilePath}" "${parentPageId}"`;
                        exec(command, {cwd: portalDir});
                      }

                    return new Promise((resolve, reject) => {
                        const lastFile = selectedFiles[selectedFiles.length -1 ];
                        const webfilePath = lastFile.fsPath;
                        const command = `${yoPath} ${yoWebfileSubGenerator} "${webfilePath}" "${parentPageId}"`;
                        exec(command, { cwd: portalDir }, (error, stderr) => {
                            if (error) {
                                vscode.window.showErrorMessage(error.message);
                                reject(error);
                            } else {
                                resolve(stderr);
                            }
                        });
                    });
                }
            )
            .then(() => {
                vscode.window.showInformationMessage(
                    "Webfiles Added!"
                );
            });
        }


    }
};

async function getWebfileInputs(parentPage: string[]) {
    const parentPages: QuickPickItem[] = parentPage.map((label) => ({
        label,
    }));

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        id: string;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => pickParentPage(input, state));
        return state as State;
    }

    const title = localize(
        "microsoft-powerapps-portals.desktopExt.webfile.quickpick.title",
        "Web files"
    );

    async function pickParentPage(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 1,
            placeholder: localize(
                "microsoft-powerapps-portals.desktopExt.webfile.quickpick.parentpage.placeholder",
                "Choose parent page"
            ),
            items: parentPages,
            activeItem: typeof state.id !== "string" ? state.id : undefined,
        });
        state.id = pick.label;
    }
    const state = await collectInputs();
    return state;
}
