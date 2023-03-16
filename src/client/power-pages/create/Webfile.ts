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
import { exec } from "child_process";
import { Tables, WEBFILE, YoSubGenerator } from "./CreateOperationConstants";
import { FileCreateEvent, sendTelemetryEvent, UserFileCreateEvent } from "../telemetry";
import { ITelemetry } from "../../telemetry/ITelemetry";

interface IWebfileInputState {
    title: string;
    step: number;
    totalSteps: number;
    id: string;
}

export const createWebfile = async (
    selectedWorkspaceFolder: string | undefined,
    yoGenPath: string | null,
    telemetry: ITelemetry
) => {
    try {
        if (selectedWorkspaceFolder) {
            const portalDir = selectedWorkspaceFolder;
            const portalContext = getPortalContext(portalDir);
            portalContext.init([Tables.WEBPAGE]);

            const { paths, pathsMap } = await getParentPagePaths(portalContext);

            if (paths.length === 0) {
                vscode.window.showErrorMessage(
                    vscode.l10n.t("No parent pages found for adding webfile")
                );
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
                            title: vscode.l10n.t({
                                message: `Adding {0} web files...`,
                                args: [webfileCount],
                                comment: ["{0} represents the number of web files"]
                            }),
                        },
                        async () => {
                            const promises = selectedFiles.map((file) => {
                                const webfilePath = file.fsPath;
                                const command = `"${yoGenPath}" ${YoSubGenerator.WEBFILE} "${webfilePath}" "${parentPageId}"`;
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
                                                    vscode.l10n.t({
                                                        message: "Failed to add webfile: {0}.",
                                                        args: [error?.message],
                                                        comment: ["{0} will be replaced by the error message."]
                                                    })
                                                );
                                                sendTelemetryEvent(telemetry, {
                                                    eventName: FileCreateEvent,
                                                    fileEntityType: WEBFILE,
                                                    exception: error as Error,
                                                });
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
                                vscode.l10n.t("Webfiles Added!")
                            );
                        }
                    );
                }
            }
        }
    } catch (error: any) {
        sendTelemetryEvent(telemetry, {
            eventName: UserFileCreateEvent,
            fileEntityType: WEBFILE,
            exception: error as Error,
        });
        throw new Error(error);
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
