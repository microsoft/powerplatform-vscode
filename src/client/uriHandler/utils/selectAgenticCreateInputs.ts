/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */

import * as vscode from "vscode";
import { MultiStepInput } from "../../../common/utilities/MultiStepInput";
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

export type AgenticCreateInputsResult =
    | {
        status: "selected";
        folderUri: vscode.Uri;
        hostSelection: AgentHostSelection;
    }
    | {
        status: "cancelled";
        step: "folder" | "host";
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
    currentStep: "folder" | "host";
    folderItem?: TargetFolderQuickPickItem;
    folderUri?: vscode.Uri;
    hostItem?: AgentHostQuickPickItem;
    hostSelection?: AgentHostSelection;
}

const DEFAULT_DEPENDENCIES: SelectAgenticCreateInputsDependencies = {
    getWorkspaceFolders: () => vscode.workspace.workspaceFolders ?? [],
    showOpenDialog: (options) => vscode.window.showOpenDialog(options)
};

/**
 * Collects target-folder and agent-host choices in one two-step input flow.
 *
 * Back from the host step returns to folder selection. Browse cancellation reopens the folder
 * step, while Esc ends the wizard and reports the step that was cancelled.
 *
 * @param detection Agent-host detection results shown in step two.
 * @param dependencies Optional VS Code interactions used by integration tests.
 * @returns Completed inputs or the step cancelled with Esc.
 */
export async function selectAgenticCreateInputs(
    detection: AgentHostDetectionResult[],
    dependencies: SelectAgenticCreateInputsDependencies = DEFAULT_DEPENDENCIES
): Promise<AgenticCreateInputsResult> {
    const state: AgenticCreateInputState = { currentStep: "folder" };
    const folderItems = getTargetFolderQuickPickItems(dependencies.getWorkspaceFolders());
    const hostItems = getAgentHostQuickPickItems(detection);
    const title = URI_HANDLER_STRINGS.AGENT_HOST_CONFIRM.PANEL_TITLE;

    const pickHost = async (input: MultiStepInput): Promise<void> => {
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
            title,
            step: 2,
            totalSteps: 2,
            placeholder: URI_HANDLER_STRINGS.PROMPTS.AGENT_HOST_SELECT,
            items: hostItems,
            activeItem: state.hostItem,
            ignoreFocusOut: true
        });
        state.hostItem = selectedItem;
        state.hostSelection = toAgentHostSelection(selectedItem);
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
                title,
                step: 1,
                totalSteps: 2,
                placeholder: URI_HANDLER_STRINGS.TITLES.TARGET_FOLDER,
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

    return {
        status: "selected",
        folderUri: state.folderUri,
        hostSelection: state.hostSelection
    };
}
