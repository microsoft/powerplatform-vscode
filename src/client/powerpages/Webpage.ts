/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as nls from "vscode-nls";
nls.config({
    messageFormat: nls.MessageFormat.bundle,
    bundleFormat: nls.BundleFormat.standalone,
})();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import * as vscode from "vscode";
import {
    fileName,
    folderName,
    getPageTemplate,
    getParentPagePaths,
    isNullOrEmpty,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DesktopFS } from "@microsoft/generator-powerpages/generators/desktopFs";
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Context } from "@microsoft/generator-powerpages/generators/context";
import { MultiStepInput } from "./utils/MultiStepInput";
import { Tables } from "./constants";


// import { DesktopFS, Context, YeomanConstants} from "@microsoft/generator-powerpages";

export const webpage = async (context: vscode.ExtensionContext) => {
    // Get the root directory of the workspace
    const rootDir = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!rootDir) {
        throw new Error("Root directory not found");
    }

    // Get the web templates & webpages from the data directory
    const portalDir = `${rootDir}\\data`;
    const fs: DesktopFS.default = new DesktopFS.default();
    const ctx = Context.default.getInstance(portalDir, fs);
    try {
        await ctx?.init([
            Tables.WEBPAGE,
            Tables.PAGETEMPLATE,
        ]);
    } catch (error) {
        vscode.window.showErrorMessage("Error while loading data: " + error);
        return;
    }

    const { pageTemplateNames, pageTemplateMap } = getPageTemplate(ctx);

    if (pageTemplateNames.length === 0) {
        vscode.window.showErrorMessage("No page templates found");
        return;
    }

    const { paths, pathsMap, webpageNames } = getParentPagePaths(ctx);

    if (paths.length === 0) {
        vscode.window.showErrorMessage("No webpages found");
        return;
    }

    // Show a quick pick
    const webpageInputs = await myMultiStepInput(
        pageTemplateNames,
        paths,
        webpageNames
    );

    const pageTemplateId = pageTemplateMap.get(webpageInputs.pageTemplate);

    const webpageName = webpageInputs.name;

    const parentPageId = pathsMap.get(webpageInputs.parentPage);

    // Create the webpage using the yo command
    if (!isNullOrEmpty(webpageName)) {
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: "Creating webpage...",
                cancellable: true,
            },
            async (progress) => {
                progress.report({ message: "Running command..." });

                // Execute terminal command
                const terminal = vscode.window.createTerminal("Powerpages", "");
                terminal.show()
                terminal.sendText(
                    `cd data\n ../node_modules/.bin/yo @microsoft/powerpages:webpage "${webpageName}" "${parentPageId}" "${pageTemplateId}"`
                );

                // Wait for the file to be created
                const file = fileName(webpageName);
                const folder = folderName(webpageName);
                const watcher: vscode.FileSystemWatcher =
                    vscode.workspace.createFileSystemWatcher(
                        new vscode.RelativePattern(
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            vscode.workspace.workspaceFolders![0],
                            `**/web-pages/${folder}/${file}.webpage.yml`
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

async function myMultiStepInput(
    pageTemplateName: string[],
    parentPage: string[],
    webpageNames: string[]
) {
    const pageTemplates: QuickPickItem[] = pageTemplateName.map((label) => ({
        label,
    }));

    const parentPages: QuickPickItem[] = parentPage.map((label) => ({
        label,
    }));

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        pageTemplate: string;
        name: string;
        parentPage: string;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => inputName(input, state));
        return state as State;
    }

    const title = localize(
        "microsoft-powerapps-portals.webExtension.webpage.quickpick.title",
        "New Webpage"
    );

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 3,
            value: state.name || "",
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.webpage.quickpick.name.placeholder",
                "Enter name"
            ),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickPageTemplate(input, state);
    }

    async function pickPageTemplate(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 3,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.webpage.quickpick.pagetemplate.placeholder",
                "Choose page template"
            ),
            items: pageTemplates,
            activeItem:
                typeof state.pageTemplate !== "string"
                    ? state.pageTemplate
                    : undefined,
        });
        state.pageTemplate = pick.label;
        return (input: MultiStepInput) => pickParentPage(input, state);
    }

    async function pickParentPage(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 3,
            totalSteps: 3,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.webpage.quickpick.parentpage.placeholder",
                "Choose parent page"
            ),
            items: parentPages,
            activeItem:
                typeof state.parentPage !== "string"
                    ? state.parentPage
                    : undefined,
        });
        state.parentPage = pick.label;
    }

    async function validateNameIsUnique(name: string) {
        // ...validate...
        if (
            webpageNames
                .map((n) => n.toLowerCase())
                .includes(name.toLowerCase())
        ) {
            return "Name not unique";
        }

        return undefined;
    }

    const state = await collectInputs();
    return state;
}
