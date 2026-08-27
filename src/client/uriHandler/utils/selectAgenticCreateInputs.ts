/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import * as path from "path";
import { MultiStepInput } from "../../../common/utilities/MultiStepInput";
import { validateAndSanitizeUserInput } from "../../../common/utilities/InputValidator";
import { URI_HANDLER_STRINGS } from "../constants/uriStrings";
import {
    AgentHostQuickPickItem,
    AgentHostSelection,
    getAgentHostQuickPickItems,
    toAgentHostSelection
} from "./selectAgentHost";
import { AgentHostDetectionResult } from "./detectAgentHost";
import {
    getTargetFolderQuickPickItems,
    resolveTargetFolderQuickPickItem,
    TargetFolderQuickPickItem
} from "./selectTargetFolder";

export interface AgenticCreateInputsSelection {
    folderUri: vscode.Uri;
    hostSelection: AgentHostSelection;
    siteDescription: string;
}

export type AgenticCreateInputsResult =
    | ({ status: "selected" } & AgenticCreateInputsSelection)
    | {
        status: "cancelled";
        step: "folder" | "host" | "siteDescription";
        folderUri?: vscode.Uri;
    };

/**
 * VS Code interactions used by the Agentic Create input wizard.
 */
export interface SelectAgenticCreateInputsDependencies {
    getWorkspaceFolders(): readonly vscode.WorkspaceFolder[];
    showOpenDialog(options: vscode.OpenDialogOptions): Thenable<vscode.Uri[] | undefined>;
}

interface AgenticCreateInputState {
    currentStep: "folder" | "host" | "siteDescription";
    folderItem?: TargetFolderQuickPickItem;
    folderUri?: vscode.Uri;
    hostItem?: AgentHostQuickPickItem;
    hostSelection?: AgentHostSelection;
    siteDescription?: string;
}

const MAX_SITE_DESCRIPTION_LENGTH = 1000;

const DEFAULT_DEPENDENCIES: SelectAgenticCreateInputsDependencies = {
    getWorkspaceFolders: () => vscode.workspace.workspaceFolders ?? [],
    showOpenDialog: (options) => vscode.window.showOpenDialog(options)
};

/**
 * Collects target folder, AI assistant, and site description in one three-step input flow.
 *
 * Back navigates between steps. Browse cancellation reopens folder selection, while Esc ends the
 * wizard and reports the step that was cancelled.
 *
 * @param detection Agent-host detection results shown in step two.
 * @param initialSelection Existing folder and host choices when editing a confirmation.
 * @param dependencies Optional VS Code interactions used by integration tests.
 * @returns Completed inputs or the step cancelled with Esc.
 */
export async function selectAgenticCreateInputs(
    detection: AgentHostDetectionResult[],
    initialSelection?: AgenticCreateInputsSelection,
    dependencies: SelectAgenticCreateInputsDependencies = DEFAULT_DEPENDENCIES
): Promise<AgenticCreateInputsResult> {
    const state: AgenticCreateInputState = {
        currentStep: "folder",
        folderUri: initialSelection?.folderUri,
        hostSelection: initialSelection?.hostSelection,
        siteDescription: initialSelection?.siteDescription
    };
    const folderItems = getTargetFolderQuickPickItems(dependencies.getWorkspaceFolders());
    const hostItems = getAgentHostQuickPickItems(detection);
    state.folderItem = folderItems.find(item =>
        item.uri?.toString() === initialSelection?.folderUri.toString()
    );
    if (initialSelection && !state.folderItem) {
        state.folderItem = {
            label: path.basename(initialSelection.folderUri.fsPath),
            description: URI_HANDLER_STRINGS.DESCRIPTIONS.SELECTED_FOLDER,
            detail: initialSelection.folderUri.fsPath,
            iconPath: new vscode.ThemeIcon("folder"),
            uri: initialSelection.folderUri
        };
        folderItems.unshift(state.folderItem);
    }
    state.hostItem = hostItems.find(item =>
        item.host === initialSelection?.hostSelection.host
    );
    const pickSiteDescription = async (input: MultiStepInput): Promise<void> => {
        state.currentStep = "siteDescription";
        const existingDescription = state.siteDescription ?? "";
        state.siteDescription = undefined;
        const value = await input.showInputBox({
            title: URI_HANDLER_STRINGS.TITLES.SITE_DESCRIPTION,
            step: 3,
            totalSteps: 3,
            value: existingDescription,
            prompt: URI_HANDLER_STRINGS.PROMPTS.SITE_DESCRIPTION,
            placeholder: URI_HANDLER_STRINGS.PROMPTS.SITE_DESCRIPTION_PLACEHOLDER,
            validate: async (inputValue: string) => {
                if (!inputValue.trim()) {
                    return URI_HANDLER_STRINGS.ERRORS.SITE_DESCRIPTION_REQUIRED;
                }
                if (inputValue.length > MAX_SITE_DESCRIPTION_LENGTH) {
                    return URI_HANDLER_STRINGS.ERRORS.SITE_DESCRIPTION_TOO_LONG;
                }
                return undefined;
            }
        });
        state.siteDescription = validateAndSanitizeUserInput(
            value,
            MAX_SITE_DESCRIPTION_LENGTH
        ) ?? undefined;
    };

    const pickHost = async (
        input: MultiStepInput
    ): Promise<typeof pickSiteDescription> => {
        state.currentStep = "host";
        state.hostSelection = undefined;
        const selectedItem = await input.showQuickPick<
            AgentHostQuickPickItem,
            {
                title: string;
                step: number;
                totalSteps: number;
                placeholder: string;
                items: AgentHostQuickPickItem[];
                activeItem?: AgentHostQuickPickItem;
                ignoreFocusOut: boolean;
            }
        >({
            title: URI_HANDLER_STRINGS.TITLES.AI_ASSISTANT,
            step: 2,
            totalSteps: 3,
            placeholder: URI_HANDLER_STRINGS.PROMPTS.AGENT_HOST_SELECT,
            items: hostItems,
            activeItem: state.hostItem,
            ignoreFocusOut: true
        });
        state.hostItem = selectedItem;
        state.hostSelection = toAgentHostSelection(selectedItem);
        return pickSiteDescription;
    };

    const pickFolder = async (
        input: MultiStepInput
    ): Promise<typeof pickHost | void> => {
        state.currentStep = "folder";
        state.folderUri = undefined;

        while (!state.folderUri) {
            const selectedItem = await input.showQuickPick<
                TargetFolderQuickPickItem,
                {
                    title: string;
                    step: number;
                    totalSteps: number;
                    placeholder: string;
                    items: TargetFolderQuickPickItem[];
                    activeItem?: TargetFolderQuickPickItem;
                    ignoreFocusOut: boolean;
                }
            >({
                title: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER,
                step: 1,
                totalSteps: 3,
                placeholder: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER_PLACEHOLDER,
                items: folderItems,
                activeItem: state.folderItem,
                ignoreFocusOut: true
            });
            state.folderItem = selectedItem;
            state.folderUri = await resolveTargetFolderQuickPickItem(
                selectedItem,
                dependencies.showOpenDialog
            );
        }

        return pickHost;
    };

    await MultiStepInput.run(pickFolder);

    if (!state.folderUri || state.currentStep === "folder") {
        return { status: "cancelled", step: "folder" };
    }
    if (!state.hostSelection) {
        return {
            status: "cancelled",
            step: "host",
            folderUri: state.folderUri
        };
    }
    if (!state.siteDescription) {
        return {
            status: "cancelled",
            step: "siteDescription",
            folderUri: state.folderUri
        };
    }

    return {
        status: "selected",
        folderUri: state.folderUri,
        hostSelection: state.hostSelection,
        siteDescription: state.siteDescription
    };
}
