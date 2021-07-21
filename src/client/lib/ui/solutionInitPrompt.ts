// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { buildRegexValidator, MultiStepInput } from "./MultiStepInput";

export interface SolutionInitArgs {
    publisherName: string;
    publisherPrefix: string;
}

export async function solutionInitPrompt (): Promise<SolutionInitArgs> {
    const title = 'Initialize new Dataverse Solution';

    async function getPublisherName(input: MultiStepInput, state: Partial<SolutionInitArgs>) {
        state.publisherName = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.publisherName || '',
            prompt: 'Supply the solution\'s Publisher Name',
            validate: buildRegexValidator(
                /^([a-zA-Z_])\w*$/,
                "Only characters within the ranges [A - Z], [a - z], [0 - 9], or _ are allowed. The first character may only be in the ranges [A - Z], [a - z], or _."
            )
        });
        return (input: MultiStepInput) => getPublisherPrefix(input, state);
    }

    async function getPublisherPrefix(input: MultiStepInput, state: Partial<SolutionInitArgs>) {
        state.publisherPrefix = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 2,
            value: state.publisherPrefix || '',
            prompt: 'Supply the solution\'s Publisher Prefix',
            validate: buildRegexValidator(
                /^(?!mscrm)^([a-zA-Z])([a-zA-Z0-9]){1,7}$/,
                "The prefix must be 2 to 8 characters long, can only consist of alpha-numerics, must start with a letter, and cannot start with 'mscrm'."
            )
        });
    }

    async function collectInputs() {
        const state = {} as Partial<SolutionInitArgs>;
        await MultiStepInput.run(input => getPublisherName(input, state));
        return state as SolutionInitArgs;
    }

    const args = await collectInputs();
    return args;
}
