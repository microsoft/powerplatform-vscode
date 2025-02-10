/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import * as vscode from "vscode";
import {
    createFileWatcher,
    createRecord,
    formatFileName,
    formatFolderName,
    isNullOrEmpty,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "../../../common/utilities/MultiStepInput";
import path from "path";
import { statSync } from "fs";
import {
    CONTENT_SNIPPET,
    TableFolder,
    YoSubGenerator,
} from "./CreateOperationConstants";
import { sendTelemetryEvent, UserFileCreateEvent } from "../../../common/OneDSLoggerTelemetry/telemetry/telemetry";

interface State {
    title: string;
    step: number;
    totalSteps: number;
    contentSnippetType: QuickPickItem | string;
    contentSnippetName: string;
}

export const createContentSnippet = async (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string | undefined,
    yoGenPath: string | null
): Promise<void> => {
    try {
        if (!selectedWorkspaceFolder) {
            return;
        }
        const { contentSnippetName, contentSnippetType } =
            await getContentSnippetInputs(selectedWorkspaceFolder);

        if (!isNullOrEmpty(contentSnippetName)) {
            const folder = formatFolderName(contentSnippetName);
            const file = formatFileName(contentSnippetName);

            const watcherPattern = path.join(
                TableFolder.CONTENT_SNIPPET_FOLDER,
                folder,
                `${file}.*.contentsnippet.yml`
            );
            const watcher = createFileWatcher(
                context,
                selectedWorkspaceFolder,
                watcherPattern
            );

            const command = `"${yoGenPath}" ${YoSubGenerator.CONTENT_SNIPPET} "${contentSnippetName}" "${contentSnippetType}"`;
            await createRecord(
                CONTENT_SNIPPET,
                command,
                selectedWorkspaceFolder,
                watcher
            );
        }
    } catch (error: any) {
        sendTelemetryEvent({ methodName: createContentSnippet.name, eventName: UserFileCreateEvent, fileEntityType: CONTENT_SNIPPET, exception: error as Error })
        throw new Error(error);
    }
};

async function getContentSnippetInputs(selectedWorkspaceFolder: string) {
    const contentSnippetTypes: QuickPickItem[] = ["html", "text"].map(
        (label) => ({ label })
    );

    const title = vscode.l10n.t("New Content Snippet");

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => inputName(input, state));
        return state as State;
    }

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        state.contentSnippetName = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.contentSnippetName || "",
            placeholder: vscode.l10n.t("Add content snippet name (name should be unique)"),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickType(input, state);
    }

    async function pickType(input: MultiStepInput, state: Partial<State>) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 2,
            placeholder: vscode.l10n.t("Select Type"),
            items: contentSnippetTypes,
            activeItem:
                typeof state.contentSnippetType !== "string"
                    ? state.contentSnippetType
                    : undefined,
        });

        state.contentSnippetType = pick.label;
    }

    async function validateNameIsUnique(name: string) {
        if (!name) {
            return vscode.l10n.t("Please enter a name for the content snippet.");
        }
        const folder = formatFolderName(name);
        const filePath = path.join(
            selectedWorkspaceFolder,
            TableFolder.CONTENT_SNIPPET_FOLDER,
            folder
        );
        try {
            const stat = statSync(filePath);
            if (stat) {
                return vscode.l10n.t("A content snippet with the same name already exists. Please enter a different name.");
            }
        } catch (error: any) {
            if (error.code === "ENOENT") {
                return;
            }
        }
    }

    const state = await collectInputs();
    return state;
}
