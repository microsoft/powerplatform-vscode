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
import { fileName, getWebTemplates, isNullOrEmpty } from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import DesktopFS from "./utils/DesktopFS";
import { MultiStepInput } from "./utils/MultiStepInput";
import path from "path";
import { exec } from "child_process";
import { yoPath } from "./constants";


export const createPageTemplate = async (context: vscode.ExtensionContext, selectedWorkspaceFolder:string | undefined) => {
    // Get the root directory of the workspace
    const rootDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!rootDir) {
        throw new Error("Root directory not found");
    }

    // Get the web templates from the data directory
    const portalDir = `${rootDir}`;
    const fs: DesktopFS = new DesktopFS();
    const { webTemplateNames, webTemplateMap } = await getWebTemplates(
        portalDir,
        fs
    );

    // Show a quick pick to enter name select the web template
    const pageTemplateInputs = await getPageTemplateInputs(webTemplateNames);

    const webtemplateId = webTemplateMap.get(pageTemplateInputs.type);

    const pageTemplateName = pageTemplateInputs.name;

    // Create the page template using the yo command
    if (!isNullOrEmpty(pageTemplateName) && selectedWorkspaceFolder) {
        const file = fileName(pageTemplateName);
        const watcher: vscode.FileSystemWatcher =
            vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(
                    selectedWorkspaceFolder,
                    path.join("page-templates", `${file}.pagetemplate.yml`)
                ),
                false,
                true,
                true
            );

        context.subscriptions.push(watcher);
        const portalDir = selectedWorkspaceFolder;

        const packagePath =
            "@microsoft/powerpages:pagetemplate";
        const command = `${yoPath} ${packagePath} "${pageTemplateName}" "${webtemplateId}"`;


        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: localize(
                    "microsoft-powerapps-portals.webExtension.pagetemplate.progress.notification",
                    "Creating page template..."
                ),
                cancellable: false,
            },
            () => {
                return new Promise((resolve, reject) => {
                    exec(
                        command,
                        { cwd: portalDir },
                        (error, stderr) => {
                            if (error) {
                                vscode.window.showErrorMessage(
                                    error.message
                                );
                                reject(error);
                            } else {
                                resolve(stderr);
                            }
                        }
                    );
                });
            }
        ).then(() => {
            vscode.window.showInformationMessage(
                "Page template Created!"
            );
        });

        watcher.onDidCreate(async (uri) => {
            await vscode.window.showTextDocument(uri);
        });
    }
};

async function getPageTemplateInputs(webTemplateNames: string[]) {
    const webTemplates: QuickPickItem[] = webTemplateNames.map((label) => ({
        label,
    }));

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        type: string;
        name: string;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => inputName(input, state));
        return state as State;
    }

    const title = localize(
        "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.title",
        "New Page Template"
    );

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.name || "",
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.name.placeholder",
                "Enter name"
            ),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickWebtemplate(input, state);
    }

    async function pickWebtemplate(input: MultiStepInput, state: Partial<State>) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 2,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.webtemplate.placeholder",
                "Choose web template"
            ),
            items: webTemplates,
            activeItem: typeof state.type !== "string" ? state.type : undefined,
        });
        state.type = pick.label;
    }

    async function validateNameIsUnique(name: string): Promise<string | undefined> {
        const file = fileName(name)
        return await vscode.workspace.findFiles(path.join("page-templates", `${file}.pagetemplate.yml`),'', 1).then((uris) => {
            if(uris.length > 0){
                return "Name not unique";
            }
            return undefined;
        });
    }


    const state = await collectInputs();
    return state;
}
