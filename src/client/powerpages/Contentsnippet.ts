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
import {
    createFileWatcher,
    createRecord,
    formatFileName,
    formatFolderName,
    isNullOrEmpty,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "./utils/MultiStepInput";
import path from "path";
import { statSync } from "fs";
import { contentSnippet, YoSubGenerator } from "./constants";

export const createContentSnippet = async (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string | undefined,
    yoCommandPath: string | null
): Promise<void> => {
    try {
        if (selectedWorkspaceFolder) {
            const { contentSnippetName, contentSnippetType } =
                await getContentSnippetInputs(selectedWorkspaceFolder);

            if (!isNullOrEmpty(contentSnippetName)) {
                const folder = formatFolderName(contentSnippetName);
                const file = formatFileName(contentSnippetName);

                const watcherPattern = path.join(
                    "content-snippets",
                    folder,
                    `${file}.*.contentsnippet.yml`
                );
                const watcher = createFileWatcher(
                    context,
                    selectedWorkspaceFolder,
                    watcherPattern
                );

                const portalDir = selectedWorkspaceFolder;

                const command = `"${yoCommandPath}" ${YoSubGenerator.CONTENT_SNIPPET} "${contentSnippetName}" "${contentSnippetType}"`;
                await createRecord(contentSnippet, command, portalDir, watcher);
            }

        }
    } catch (error: any) {
        throw new Error(error);
    }
};

async function getContentSnippetInputs(selectedWorkspaceFolder: string) {
    const contentSnippetTypes: QuickPickItem[] = ["html", "text"].map(
        (label) => ({ label })
    );

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        contentSnippetType: QuickPickItem | string;
        contentSnippetName: string;
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
        state.contentSnippetName = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.contentSnippetName || "",
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.name.placeholder",
                "Add content snippet name (name should be unique)"
            ),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickType(input, state);
    }

    async function pickType(input: MultiStepInput, state: Partial<State>) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 2,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.type.placeholder",
                "Select Type"
            ),
            items: contentSnippetTypes,
            activeItem:
                typeof state.contentSnippetType !== "string"
                    ? state.contentSnippetType
                    : undefined,
        });

        state.contentSnippetType = pick.label;
    }

    async function validateNameIsUnique(
        name: string
    ): Promise<string | undefined> {
        const folder = formatFolderName(name);
        const filePath = path.join(
            selectedWorkspaceFolder,
            "content-snippets",
            folder
        );
        try {
            const stat = statSync(filePath);
            if (stat) {
                return "A content snippet with the same name already exists. Please enter a different name.";
            }
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return undefined;
            }
        }
    }

    const state = await collectInputs();
    return state;
}
