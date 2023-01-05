/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
import * as vscode from "vscode";
import { fileName, folderName, isNullOrEmpty } from "./utils/CommonUtils";
import {
    Disposable,
    QuickInput,
    QuickInputButton,
    QuickInputButtons,
    QuickPickItem,
    window,
} from "vscode";

//import {Context} from "@microsoft/generator-powerpages";


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

    const title = localize("microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.title","New Content Snippet");

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.name || "",
            placeholder: localize("microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.name.placeholder","Add content snippet name"),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => picktype(input, state);
    }

    async function picktype(input: MultiStepInput, state: Partial<State>) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 2,
            placeholder: localize("microsoft-powerapps-portals.webExtension.contentsnippet.quickpick.type.placeholder","Select Type"),
            items: contentSnippetTypes,
            activeItem: typeof state.type !== "string" ? state.type : undefined,
        });

        state.type = pick.label;
    }

    async function validateNameIsUnique(name: string) {
        // ...validate...
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return name === "vscode" ? "Name not unique" : undefined;
    }

    const state = await collectInputs();
    return state;
}

// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

class InputFlowAction {
    static back = new InputFlowAction();
    static cancel = new InputFlowAction();
    static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
    title: string;
    step: number;
    totalSteps: number;
    items: T[];
    activeItem?: T;
    placeholder: string;
    buttons?: QuickInputButton[];
}

interface InputBoxParameters {
    title: string;
    step: number;
    totalSteps: number;
    value: string;
    prompt?: string;
    placeholder: string;
    validate: (value: string) => Promise<string | undefined>;
    buttons?: QuickInputButton[];
}

class MultiStepInput {
    static async run(start: InputStep) {
        const input = new MultiStepInput();
        return input.stepThrough(start);
    }

    private current?: QuickInput;
    private steps: InputStep[] = [];

    private async stepThrough(start: InputStep) {
        let step: InputStep | void = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            } catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                } else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                } else if (err === InputFlowAction.cancel) {
                    step = undefined;
                } else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }

    async showQuickPick<
        T extends QuickPickItem,
        P extends QuickPickParameters<T>
    >({ title, step, totalSteps, items, activeItem, placeholder, buttons }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<
                T | (P extends { buttons: (infer I)[] } ? I : never)
            >((resolve, reject) => {
                const input = window.createQuickPick<T>();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
                if (activeItem) {
                    input.activeItems = [activeItem];
                }
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || []),
                ];
                disposables.push(
                    input.onDidTriggerButton((item) => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            resolve(<any>item);
                        }
                    }),
                    input.onDidChangeSelection((items) => resolve(items[0]))
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach((d) => d.dispose());
        }
    }

    async showInputBox<P extends InputBoxParameters>({
        title,
        step,
        totalSteps,
        value,
        prompt,
        placeholder,
        validate,
        buttons,
    }: P) {
        const disposables: Disposable[] = [];
        try {
            return await new Promise<
                string | (P extends { buttons: (infer I)[] } ? I : never)
            >((resolve, reject) => {
                const input = window.createInputBox();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.value = value || "";
                input.prompt = prompt;
                input.placeholder = placeholder;
                input.buttons = [
                    ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
                    ...(buttons || []),
                ];
                let validating = validate("");
                disposables.push(
                    input.onDidTriggerButton((item) => {
                        if (item === QuickInputButtons.Back) {
                            reject(InputFlowAction.back);
                        } else {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            resolve(<any>item);
                        }
                    }),
                    input.onDidAccept(async () => {
                        const value = input.value;
                        input.enabled = false;
                        input.busy = true;
                        if (!(await validate(value))) {
                            resolve(value);
                        }
                        input.enabled = true;
                        input.busy = false;
                    }),
                    input.onDidChangeValue(async (text) => {
                        const current = validate(text);
                        validating = current;
                        const validationMessage = await current;
                        if (current === validating) {
                            input.validationMessage = validationMessage;
                        }
                    })
                );
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        } finally {
            disposables.forEach((d) => d.dispose());
        }
    }
}


