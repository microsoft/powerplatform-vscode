/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from "vscode";
import { getParentPagePaths, isNullOrEmpty } from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { Context } from "@microsoft/generator-powerpages/generators/context";
import { MultiStepInput } from "./utils/MultiStepInput";
import { Tables, } from "./constants";
import DesktopFS from "./utils/DesktopFS";
import { exec } from "child_process";


export const createWebfile = async (selectedWorkspaceFolder: string | undefined, yoPath: string | null) => {
    // Get the root directory of the workspace
    const rootDir = selectedWorkspaceFolder;
    if (!rootDir) {
        throw new Error("Root directory not found");
    }

    // Get the web templates from the data directory
    const portalDir = selectedWorkspaceFolder;
    const fs: DesktopFS = new DesktopFS();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const ctx = Context.getInstance(portalDir!, fs);
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
            vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: `Adding ${webfileCount} web files...`,
              },
              async () => {
                const promises = selectedFiles.map((file) => {
                  const webfilePath = file.fsPath;
                  const command = `"${yoPath}" ${yoWebfileSubGenerator} "${webfilePath}" "${parentPageId}"`;
                  return new Promise((resolve, reject) => {
                    exec(command, { cwd: portalDir }, (error, stderr, stdout) => {
                      if (error || stdout.toString().includes("Error")) {
                        vscode.window.showErrorMessage(error ? error.message : stdout.toString());
                        reject(error || stdout);
                      } else {
                        resolve(stderr);
                      }
                    });
                  });
                });

                await Promise.all(promises);
                vscode.window.showInformationMessage("Webfiles Added!");
              }
            );
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

    const title =
        "Web files"
    ;

    async function pickParentPage(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 1,
            placeholder: 
                "Choose parent page"
            ,
            items: parentPages,
            activeItem: typeof state.id !== "string" ? state.id : undefined,
        });
        state.id = pick.label;
    }
    const state = await collectInputs();
    return state;
}
