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
    getPortalContext,
    getWebTemplates,
} from "./utils/CommonUtils";
import { QuickPickItem } from "vscode";
import { MultiStepInput } from "./utils/MultiStepInput";
import path from "path";
import { pageTemplate, TableFolder } from "./constants";
import { YoSubGenerator } from "../powerpages/constants";
import { statSync } from "fs";

export const createPageTemplate = async (
    context: vscode.ExtensionContext,
    selectedWorkspaceFolder: string | undefined,
    yoGenPath: string | null
): Promise<void> => {
    try {
        if (selectedWorkspaceFolder) {
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
                throw new Error("Page Template name cannot be empty.");
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

            //command to run, to create the page template
            const command = `${yoGenPath} ${YoSubGenerator.PAGETEMPLATE} "${pageTemplateName}" "${webtemplateId}"`;
            await createRecord(pageTemplate, command, portalDir, watcher);
        }
    } catch (error: any) {
        vscode.window.showErrorMessage(error.message);
        return;
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

    interface State {
        title: string;
        step: number;
        totalSteps: number;
        type: string;
        name: string;
    }

    async function collectInputs() {
        const state = {} as Partial<State>;
        await MultiStepInput.run((input) => inputName(input, state));
        return state as State;
    }

    const title = localize(
        "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.title",
        "New Page Template"
    );

    async function inputName(input: MultiStepInput, state: Partial<State>) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.name || "",
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.name.placeholder",
                "Enter name"
            ),
            validate: validateNameIsUnique,
        });
        return (input: MultiStepInput) => pickWebtemplate(input, state);
    }

    async function pickWebtemplate(
        input: MultiStepInput,
        state: Partial<State>
    ) {
        const pick = await input.showQuickPick({
            title,
            step: 2,
            totalSteps: 2,
            placeholder: localize(
                "microsoft-powerapps-portals.webExtension.pagetemplate.quickpick.webtemplate.placeholder",
                "Choose web template"
            ),
            items: webTemplates,
            activeItem: typeof state.type !== "string" ? state.type : undefined,
        });
        state.type = pick.label;
    }

    async function validateNameIsUnique(
        name: string
    ): Promise<string | undefined> {
        const file = formatFileName(name);
        const filePath = path.join(
            selectedWorkspaceFolder,
            "page-templates",
            `${file}.pagetemplate.yml`
        );
        try {
            const stat = statSync(filePath);
            if (stat) {
                return "A page template with the same name already exists. Please enter a different name.";
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
