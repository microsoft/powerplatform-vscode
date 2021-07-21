// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { buildRegexValidator, MultiStepInput } from "./MultiStepInput";

export interface PcfInitArgs {
    namespace: string;
    name: string;
    template: string;
}

export async function pcfInitPrompt (): Promise<PcfInitArgs> {
    const title = 'Initialize a new PowerApps component framework project';

    async function getNamespace(input: MultiStepInput, state: Partial<PcfInitArgs>) {
        state.namespace = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 3,
            value: state.namespace || '',
            prompt: 'The namespace for the component',
            validate: buildRegexValidator(
                /^(?!\.|\d)(?!.*\.$)(?!.*?\.\d)(?!.*?\.\.)[a-zA-Z0-9.]+$/,
                "Only characters within the ranges [A - Z], [a - z], [0 - 9], or '.' are allowed. The first and last character may not be the '.' character. Consecutive '.' characters are not allowed. Numbers are not allowed as the first character or immediately after a period.")
        });
        return (input: MultiStepInput) => getName(input, state);
    }

    async function getName(input: MultiStepInput, state: Partial<PcfInitArgs>) {
        state.name = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 3,
            value: state.name || '',
            prompt: 'The name for the component',
            validate: buildRegexValidator(
                /^(?!\d)[a-zA-Z0-9]+$/,
                "Only characters within the ranges [A - Z], [a - z] or [0 - 9] are allowed. The first character may not be a number."
            )
        });
        return (input: MultiStepInput) => getTemplate(input, state);
    }

    async function getTemplate(input: MultiStepInput, state: Partial<PcfInitArgs>) {
        const templateTypes = ["field", "dataset"].map(label => ({label}));
        const activeItem = templateTypes.find(item => item.label == state.template);
        const pickedItem = await input.showQuickPick({
            title,
            step: 3,
            totalSteps: 3,
            items: templateTypes,
            activeItem: activeItem,
            placeholder: 'Choose a template for the component'
        });
        state.template = pickedItem.label;
    }

    async function collectInputs() {
        const state = {} as Partial<PcfInitArgs>;
        await MultiStepInput.run(input => getNamespace(input, state));
        return state as PcfInitArgs;
    }

    const args = await collectInputs();
    return args;
}
