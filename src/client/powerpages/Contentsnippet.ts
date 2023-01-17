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
import { fileName, folderName, isNullOrEmpty } from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "./utils/MultiStepInput";

export const contentSnippet = async (context: vscode.ExtensionContext) => {
    const contentSnippetInputs = await myMultiStepInput();

    const contentSnippetName = contentSnippetInputs.name;
    if (!isNullOrEmpty(contentSnippetName)) {
        const terminal = vscode.window.createTerminal("Powerpages", "");
        terminal.sendText(
            `cd data\n ../node_modules/.bin/yo @microsoft/powerpages:contentsnippet "${contentSnippetName}" "${contentSnippetInputs.type}"`
        );

        const folder = folderName(contentSnippetName);
        const file = fileName(contentSnippetName);

        const watcher: vscode.FileSystemWatcher =
            vscode.workspace.createFileSystemWatcher(
                new vscode.RelativePattern(
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    vscode.workspace.workspaceFolders![0],
                    `**/content-snippets/${folder}/${file}.en-US.contentsnippet.yml` //TODO: check for text/html file
                ),
                false,
                true,
                true
            );

        context.subscriptions.push(watcher);
        vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                cancellable: true,
                title: localize(
                    "microsoft-powerapps-portals.webExtension.contentsnippet.create.message",
                    "Creating Content Snippet..."
                ),
            },
            async () => {
                watcher.onDidCreate(async (uri) => {
                    await vscode.window.showTextDocument(uri);
                    terminal.dispose();
                });
            }
        );
    }
};

async function myMultiStepInput() {
    const contentSnippetTypes: QuickPickItem[] = ["html", "text"].map(
        (label) => ({ label })
    );

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        type: QuickPickItem | string;
        name: string;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => inputName(input, state));
        return state as State;
    }

    const title = localize(
        "microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.title",
        "New Content Snippet"
    );

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.name || "",
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.name.placeholder",
                "Add content snippet name"
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
                "microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.type.placeholder",
                "Select Type"
            ),
            items: contentSnippetTypes,
            activeItem: typeof state.type !== "string" ? state.type : undefined,
        });

        state.type = pick.label;
    }

    async function validateNameIsUnique(name: string) {
        // ...validate...
        if (name) {
            return undefined;
        }
    }

    const state = await collectInputs();
    return state;
}
