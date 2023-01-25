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
import { fileName, isNullOrEmpty } from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";

import { Context } from "@microsoft/generator-powerpages/generators/context";
import { MultiStepInput } from "./utils/MultiStepInput";
import DesktopFS from "./utils/DesktopFS";
import { Tables } from "./constants";

interface WebTemplate {
    name: string;
    value: string;
}

async function getWebTemplates(
    rootDir: string,
    portalDir: string,
    fs: DesktopFS
): Promise<{
    webTemplateNames: string[];
    webTemplateMap: Map<string, string>;
}> {
    const context = Context.getInstance(portalDir, fs);
    await context.init([Tables.WEBTEMPLATE]);
    const webTemplates: WebTemplate[] = context.getWebTemplates();

    const webTemplateNames = webTemplates.map((template) => template.name);
    const webTemplateMap = new Map<string, string>();
    webTemplates.forEach((template) => {
        webTemplateMap.set(template.name, template.value);
    });
    return { webTemplateNames, webTemplateMap };
}

export const pageTemplate = async (context: vscode.ExtensionContext) => {
    // Get the root directory of the workspace
    const rootDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!rootDir) {
        throw new Error("Root directory not found");
    }

    // Get the web templates from the data directory
    const portalDir = `${rootDir}\\data`;
    const fs: DesktopFS = new DesktopFS();
    const { webTemplateNames, webTemplateMap } = await getWebTemplates(
        rootDir,
        portalDir,
        fs
    );

    // Show a quick pick to enter name select the web template
    const pageTemplateInputs = await myMultiStepInput(webTemplateNames);

    const webtemplateId = webTemplateMap.get(pageTemplateInputs.type);

    const pageTemplateName = pageTemplateInputs.name;

    // Create the page template using the yo command
    if (!isNullOrEmpty(pageTemplateName)) {
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Creating Page Template...",
                cancellable: true,
            },
            async (progress) => {
                progress.report({ message: "Running command..." });

                // Execute terminal command
                const terminal = vscode.window.createTerminal("Powerpages", "");
                terminal.sendText(
                    `cd data\n ../node_modules/.bin/yo @microsoft/powerpages:pagetemplate "${pageTemplateName}" "${webtemplateId}"`
                );

                // Wait for the file to be created
                const file = fileName(pageTemplateName);
                const watcher: vscode.FileSystemWatcher =
                    vscode.workspace.createFileSystemWatcher(
                        new vscode.RelativePattern(
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            vscode.workspace.workspaceFolders![0],
                            `**/page-templates/${file}.pagetemplate.yml`
                        ),
                        false,
                        true,
                        true
                    );

                context.subscriptions.push(watcher);
                watcher.onDidCreate(async (uri) => {
                    await vscode.window.showTextDocument(uri);
                    terminal.dispose();
                });
            }
        );
    }
};

async function myMultiStepInput(webTemplateNames: string[]) {
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
        return (input: MultiStepInput) => picktype(input, state);
    }

    async function picktype(input: MultiStepInput, state: Partial<State>) {
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

    async function validateNameIsUnique(name: string) {
        // ...validate...
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (name) {
            return undefined;
        }
    }

    const state = await collectInputs();
    return state;
}
