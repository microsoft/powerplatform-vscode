/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import * as vscode from "vscode";
import {
    getParentPagePaths,
    getPortalContext,
    isNullOrEmpty,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "./utils/MultiStepInput";
import { Tables, YoSubGenerator } from "./constants";
import { exec } from "child_process";

interface IWebfileInputState {
    title: string;
    step: number;
    totalSteps: number;
    id: string;
}

export const createWebfile = async (
    selectedWorkspaceFolder: string | undefined,
    yoPath: string | null
) => {
    try {
        if (selectedWorkspaceFolder) {
            const portalDir = selectedWorkspaceFolder;
            const portalContext = getPortalContext(portalDir);
            portalContext.init([Tables.WEBPAGE]);

            const { paths, pathsMap } = await getParentPagePaths(portalContext);

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
                                const command = `"${yoPath}" ${YoSubGenerator.WEBFILE} "${webfilePath}" "${parentPageId}"`;
                                return new Promise((resolve, reject) => {
                                    exec(
                                        command,
                                        { cwd: portalDir },
                                        (error, stderr, stdout) => {
                                            if (
                                                error ||
                                                stdout
                                                    .toString()
                                                    .includes("Error")
                                            ) {
                                                vscode.window.showErrorMessage(
                                                    error
                                                        ? error.message
                                                        : stdout.toString()
                                                );
                                                reject(error || stdout);
                                            } else {
                                                resolve(stderr);
                                            }
                                        }
                                    );
                                });
                            });

                            await Promise.all(promises);
                            vscode.window.showInformationMessage(
                                "Webfiles Added!"
                            );
                        }
                    );
                }
            }
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
        return;
    }
};

async function getWebfileInputs(parentPage: string[]) {
    const parentPages: QuickPickItem[] = parentPage.map((label) => ({
        label,
    }));

    const title = vscode.l10n.t("Web files");

    async function collectInputs() {
        const state = {} as Partial<IWebfileInputState>;
        await MultiStepInput.run((input) => pickParentPage(input, state));
        return state as IWebfileInputState;
    }

    async function pickParentPage(
        input: MultiStepInput,
        state: Partial<IWebfileInputState>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 1,
            totalSteps: 1,
            placeholder: vscode.l10n.t("Choose parent page"),
            items: parentPages,
            activeItem: typeof state.id !== "string" ? state.id : undefined,
        });
        state.id = pick.label;
    }
    const state = await collectInputs();
    return state;
}
