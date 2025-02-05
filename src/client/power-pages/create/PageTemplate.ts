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
    getPortalContext,
    getWebTemplates,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "../../../common/utilities/MultiStepInput";
import path from "path";
import { statSync } from "fs";
import {
    TableFolder,
    Tables,
    YoSubGenerator,
} from "./CreateOperationConstants";
import { sendTelemetryEvent, UserFileCreateEvent } from "../../../common/OneDSLoggerTelemetry/telemetry/telemetry";

interface IPagetemplateInputState {
    title: string;
    step: number;
    totalSteps: number;
    type: string;
    name: string;
}

export const createPageTemplate = async (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string | undefined,
    yoGenPath: string | null
): Promise<void> => {
    try {
        if (!selectedWorkspaceFolder) {
            return
        }
        const portalDir = selectedWorkspaceFolder;
        const portalContext = getPortalContext(portalDir);

        const { webTemplateNames, webTemplateMap } = await getWebTemplates(
            portalContext
        );

        const pageTemplateInputs = await getPageTemplateInputs(
            webTemplateNames,
            selectedWorkspaceFolder
        );
        const webtemplateId = webTemplateMap.get(pageTemplateInputs.type);
        const pageTemplateName = pageTemplateInputs.name;

        if (!pageTemplateName) {
            throw new Error(
                vscode.l10n.t("Page Template name cannot be empty.")
            );
        }

        const file = formatFileName(pageTemplateName);
        const watcherPattern = path.join(
            TableFolder.PAGETEMPLATE_FOLDER,
            `${file}.pagetemplate.yml`
        );
        const watcher = createFileWatcher(
            context,
            selectedWorkspaceFolder,
            watcherPattern
        );

        const command = `${yoGenPath} ${YoSubGenerator.PAGETEMPLATE} "${pageTemplateName}" "${webtemplateId}"`;
        await createRecord(
            Tables.PAGETEMPLATE,
            command,
            portalDir,
            watcher
        );
    } catch (error: any) {
        sendTelemetryEvent({
            methodName: createPageTemplate.name,
            eventName: UserFileCreateEvent,
            fileEntityType: Tables.PAGETEMPLATE,
            exception: error as Error,
        });
        throw new Error(error);
    }
};

/*
 * Get inputs from user for creating a new page template
 * @param webTemplateNames - list of web template names
 * @returns - page template name and web template id
 */
async function getPageTemplateInputs(
    webTemplateNames: string[],
    selectedWorkspaceFolder: string
) {
    const webTemplates: QuickPickItem[] = webTemplateNames.map((label) => ({
        label,
    }));

    const title = vscode.l10n.t("New Page Template");

    async function collectInputs() {
        const state = {} as Partial<IPagetemplateInputState>;
        await MultiStepInput.run((input) => inputName(input, state));
        return state as IPagetemplateInputState;
    }

    async function inputName(
        input: MultiStepInput,
        state: Partial<IPagetemplateInputState>
    ) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.name || "",
            placeholder: vscode.l10n.t("Enter name"),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickWebtemplate(input, state);
    }

    async function pickWebtemplate(
        input: MultiStepInput,
        state: Partial<IPagetemplateInputState>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 2,
            placeholder: vscode.l10n.t("Choose web template"),
            items: webTemplates,
            activeItem: typeof state.type !== "string" ? state.type : undefined,
        });
        state.type = pick.label;
    }

    async function validateNameIsUnique(
        name: string
    ): Promise<string | undefined> {
        if (!name) {
            return vscode.l10n.t("Please enter a name for the page template.");
        }

        const file = formatFileName(name);
        const filePath = path.join(
            selectedWorkspaceFolder,
            "page-templates",
            `${file}.pagetemplate.yml`
        );
        try {
            const stat = statSync(filePath);
            if (stat) {
                return vscode.l10n.t(
                    "A page template with the same name already exists. Please enter a different name."
                );
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
